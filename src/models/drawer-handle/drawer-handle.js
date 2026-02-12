import {
  draw,
  drawCircle,
  makeBezierCurve,
  makeLine,
  genericSweep,
  assembleWire,
} from "replicad";

/** @typedef {{pitch:number, standoff:number, reach:number, droop:number, profile:{width:number, height:number, radius:number}}} BarCfg */
/** @typedef {{radius:number, height:number, flange:{radius:number, height:number}}} FootCfg */

// All dimensions in mm
export const defaultParams = {
  hole_pitch: 104, // distance between the centers of drawer holes
  hole_diameter: 16, // diameter of the hole in drawer
  hole_depth: 9, // thickness of the drawer front
  standoff: 15, // horizontal distance before starting to curve
  reach: 10, // horizontal distance from standoff to middle of handle
  droop: 20, // vertical droop of handle
  thickness: 5, // thickness of the handle
  roundness: 5, // roundness of handle edges
  height: 5, // height of flat surface of handle
  flange_size: 5, // how much larger than hole in drawer
  foot_height: 5, // height of the foot
  screw_diameter: 4, // screw size - eg for M4 then 4
};

export default function main(_api, defaultParams) {
  const config = parseParams(defaultParams);

  const bar = makeBar(config.bar);

  const foot = makeFoot({
    ...config.foot,
    barProfile: config.bar.profile,
  }).translateZ(-config.bar.baseOffset);
  const foot1 = foot.clone().rotate(90, [0, 0, 0], [0, -1, 0]);
  const foot2 = foot1.clone().translateY(config.bar.pitch);

  const handle = bar.fuse(foot1).fuse(foot2);

  const plug1 = makePlug(config.plug)
    .rotate(270, [0, 0, 0], [0, -1, 0])
    .translateX(config.plug.depth * -7);

  const plug2 = plug1.clone().translateY(config.bar.pitch);

  return [handle, plug1, plug2];
}

/**
 * Combine the profile with sweep to make the body of the handle
 */
const makeBar = ({ pitch, reach, standoff, baseOffset, profile, droop }) => {
  // spines to control the sweep of the handle
  const { spine, auxSpine } = makeBarSpine({
    standoff,
    reach,
    pitch,
    droop,
    baseOffset,
    auxOffset: [0, 0, 20],
  });

  // defines the surface profile of the handle
  const profileWire = makeBarProfile({ origin: [0, 0, 0], ...profile })
    .sketchOnPlane("XY")
    .wires();

  return genericSweep(profileWire, spine, {
    frenet: true,
    auxiliarySpine: auxSpine, // defines the "up" direction for the profile
    forceProfileSpineOthogonality: true,
    transitionMode: "round",
  });
};

/**
 * define the sweep of the handle
 */
const makeBarSpine = ({
  standoff,
  reach,
  pitch,
  droop,
  baseOffset = 5,
  auxOffset = [0, 0, 20],
}) => {
  // 3d control points for the sweep of the handle

  // baseOffset adds redundant straight length that is used later to prevent non-manifold edges
  // when joining to the foot
  const _standoff = baseOffset + standoff;
  const _reach = baseOffset + standoff + reach;

  const leadNet = [
    [0, 0, 0],
    [baseOffset, 0, 0],
  ];
  const tailNet = [
    [baseOffset, pitch, 0],
    [0, pitch, 0],
  ];

  const controlNet = [
    [baseOffset, 0, 0],
    [_standoff, 0, 0],
    [_reach, pitch * 0.25, droop],
    [_reach, pitch * 0.5, droop],
    [_reach, pitch * 0.75, droop],
    [_standoff, pitch, 0],
    [baseOffset, pitch, 0],
  ];

  const spine = assembleWire([
    makeLine(...leadNet),
    makeBezierCurve(controlNet),
    makeLine(...tailNet),
  ]);

  // create a second spine vertically above the first
  // that is later used to align the profile
  // to keep the face of the handle vertical
  //
  const auxSpine = assembleWire([
    makeLine(...offsetNet(leadNet, auxOffset)),
    // makeBezierCurve(offsetNet(leadNet, auxOffset)),
    makeBezierCurve(offsetNet(controlNet, auxOffset)),
    // makeBezierCurve(offsetNet(tailNet, auxOffset)),
    makeLine(...offsetNet(tailNet, auxOffset)),
  ]);

  return {
    spine,
    auxSpine,
  };
};

/**
 * Define the profile of the handle
 */
const makeBarProfile = ({ origin, width, height, radius }) =>
  draw(origin)
    .movePointerTo([-height, -width / 2])
    .hLine(height * 2)
    .bezierCurveTo([height, width / 2], [[height + radius, 0]])
    .hLine(-height * 2)
    .bezierCurveTo([-height, -width / 2], [[-height - radius, 0]])
    .done();

/**
 * Define the shape of the foot
 *
 * Currently assumes the handle will be mounted into holes in drawer front
 */
function makeFoot({ radius, height, flange, barProfile }) {
  // gets a copy of the bar profile
  const profileSketch = makeBarProfile({
    origin: [0, 0, 0],
    ...barProfile,
  }).sketchOnPlane("XY");

  // makes a circle and then uses a loft to join
  // the circle to the profile shape
  const flangeSolid = drawCircle(flange.radius)
    .sketchOnPlane("XY", flange.height)
    .loftWith(profileSketch);

  // creates the insert that will fit in the drawer holes
  const insert = drawCircle(radius)
    .sketchOnPlane()
    .extrude(height)
    .translateZ(flange.height);

  // fuses the flange and the insert
  return flangeSolid.fuse(insert);
}

/**
 * Define a Plug/washer:
 */
function makePlug(plug) {
  const edgeFillet = 0;

  // Build solids. Put flange at Z=0..flangeThick; shaft sits on top.
  const flange = drawCircle(plug.flange.radius)
    .sketchOnPlane("XY", 0.0)
    .extrude(plug.flange.thick);

  const shaft = drawCircle(plug.radius)
    .sketchOnPlane("XY", plug.flange.thick)
    .extrude(plug.depth);

  let plugSolid = flange.fuse(shaft);

  // Through-hole: overshoot height slightly to guarantee clean cut
  const holeDepth = plug.flange.thick + plug.depth + 1;
  const hole = drawCircle(plug.holeDia / 2)
    .sketchOnPlane("XY", -0.5)
    .extrude(holeDepth);
  const counterSink = drawCircle(plug.counterSinkRadius)
    .sketchOnPlane("XY", -0.5)
    .extrude(plug.counterSinkDepth + 0.5);

  plugSolid = plugSolid.cut(hole).cut(counterSink);

  // Optional small fillet on exposed outer edges to avoid razor-thin coplanar contacts
  if (edgeFillet > 0) {
    plugSolid = plugSolid.fillet(
      edgeFillet,
      (e) => e.isOnSurface("XY", 0) || e.isOnSurface("XY", plug.flange.thick) // ring edges
    );
  }

  return plugSolid;
}

/**
 * Apply a simple offset to the coordinates of a spine
 * which can be used to make a second spine offset from the first
 */
const offsetNet = (pts, [dx, dy, dz]) =>
  pts.map(([x, y, z = 0]) => [x + dx, y + dy, z + dz]);

/**
 * Replicad's defaultParams aren't what we want to work with
 * so map it to a more convenient structure
 * and throw in some validation for good measure
 */
const parseParams = (p = defaultParams) => {
  if (p.hole_pitch <= 0) throw new Error("hole pitch must be > 0");
  if (p.standoff < 0) throw new Error("standoff must be >= 0");
  if (p.foot_radius <= 0 || p.foot_height <= 0)
    throw new Error("invalid foot sizes");
  if (p.flange_radius < p.foot_radius)
    throw new Error("flange_radius should be larger than foot radius");
  if (Math.abs(p.droop) > p.bar_pitch)
    console.warn("Large droop relative to pitch: check aesthetics/clearance");

  return {
    bar: {
      pitch: p.hole_pitch,
      standoff: p.standoff,
      baseOffset: p.foot_height * 0.2,
      reach: p.reach,
      droop: -p.droop,
      profile: {
        width: p.thickness,
        height: p.height,
        radius: p.roundness,
      },
    },
    foot: {
      radius: (p.hole_diameter - 1) / 2,
      height: (p.hole_depth - 1) / 2,
      flange: {
        radius: (p.hole_diameter - 1) / 2 + p.flange_size,
        height: p.foot_height,
      },
    },
    plug: {
      radius: (p.hole_diameter - 1) / 2,
      depth: (p.hole_depth - 1) / 2,
      flange: {
        thick: p.hole_diameter * 0.15,
        radius: p.hole_diameter * 0.65,
      },
      holeDia: p.screw_diameter + 1,
      counterSinkDepth: p.screw_diameter * 0.7,
      counterSinkRadius: p.screw_diameter,
    },
  };
};
