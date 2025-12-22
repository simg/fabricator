import {
  makeBaseBox,
  makeCylinder,
  Point,
  Shape3D,
  Sketch,
  Sketcher,
  sketchParametricFunction,
} from "replicad";

const ORIGIN: Point = [0, 0, 0];
const XDIR: Point = [1, 0, 0];
const ZDIR: Point = [0, 0, 1];

const clampMin = (value: number, min: number): number => Math.max(value, min);

interface CollarConfig {
  mouthDiameter: number;
  tubeInnerDiameter: number;
  axial: number;
  radial: number;
  splitCount: number;
  splitWidth: number;
  includeSplits: boolean;
  zOffset: number;
}

interface CollarDimensions {
  outerRadius: number;
  innerRadius: number;
}

interface HubConfig {
  radius: number;
  length: number;
  centerZ: number;
}

interface SpokeConfig {
  count: number;
  width: number;
  thickness: number;
  tiltDeg: number;
  zCenter: number;
  outerRadius: number;
  hubRadius: number;
  angleOffset?: number;
}

interface PocketConfig {
  dongleWidth: number;
  dongleHeight: number;
  bodyLength: number;
  clearance: number;
  leadIn: number;
  hubZ: number;
}

const calculateCollarDimensions = (config: CollarConfig): CollarDimensions => {
  const collarOD = Math.min(
    config.tubeInnerDiameter - 0.3,
    config.mouthDiameter + 1.4
  );
  const outerRadius = Math.max(collarOD / 2, 6);
  const innerRadius = Math.max(outerRadius - config.radial, 1.0);

  return { outerRadius, innerRadius };
};

const buildCollar = (
  config: CollarConfig,
  dimensions: CollarDimensions
): Shape3D => {
  let collar: Shape3D = makeCylinder(dimensions.outerRadius, config.axial)
    .cut(makeCylinder(dimensions.innerRadius, config.axial + 0.2))
    .translate(0, 0, config.zOffset);

  if (config.includeSplits && config.splitCount > 0) {
    for (let i = 0; i < config.splitCount; i += 1) {
      const angleZ = (i * 360) / config.splitCount;
      const cutter = makeBaseBox(
        dimensions.outerRadius * 2.4,
        config.splitWidth,
        config.axial + 2
      )
        .translate(-dimensions.outerRadius * 1.2, -config.splitWidth / 2, -1)
        .rotate(angleZ, ORIGIN, ZDIR)
        .translate(0, 0, config.zOffset);

      collar = collar.cut(cutter);
    }
  }

  return collar;
};

const buildHub = (config: HubConfig): Shape3D => {
  const length = clampMin(config.length, 5);
  return makeCylinder(clampMin(config.radius, 3), length).translate(
    0,
    0,
    config.centerZ - length / 2
  );
};

const buildSpoke = (index: number, config: SpokeConfig): Shape3D => {
  const angleStep = 360 / config.count;
  const baseAngle = index * angleStep + (config.angleOffset ?? 0);
  const collarOverlap = 0.8;
  const hubOverlap = 0.8;
  const span = Math.max(
    config.outerRadius + collarOverlap - (config.hubRadius - hubOverlap),
    1
  );
  const tilt = config.tiltDeg ?? 0;

  const startX = config.hubRadius - hubOverlap;
  const endX = config.outerRadius + collarOverlap;

  const path: Sketch = sketchParametricFunction(
    (t) => {
      const radius = startX + (endX - startX) * t;
      const theta = (Math.PI / 2) * (1 - t); // start 90° at hub, 0° at collar
      const x = radius * Math.cos(theta);
      const y = radius * Math.sin(theta);
      return [x, y];
    },
    { origin: [0, 0, config.zCenter], direction: ZDIR },
    { pointsCount: 48 }
  );

  const profile = (plane, origin) =>
    new Sketcher(plane, origin)
      .movePointerTo([-config.thickness / 2, -config.width / 2])
      .hLine(config.thickness)
      .vLine(config.width)
      .hLine(-config.thickness)
      .close();

  let spoke = path.sweepSketch(profile);

  if (tilt !== 0) {
    spoke = spoke.rotate(tilt, [startX, 0, config.zCenter], XDIR);
  }

  const axisThroughSpoke: Point = [0, 0, config.zCenter];
  return spoke.rotate(baseAngle, axisThroughSpoke, ZDIR);
};

const buildSpokes = (config: SpokeConfig): Shape3D => {
  let spokes = buildSpoke(0, config);

  for (let i = 1; i < config.count; i += 1) {
    spokes = spokes.fuse(buildSpoke(i, config));
  }

  return spokes;
};

const createPocketCuts = (
  config: PocketConfig
): { pocket: Shape3D; leadIn: Shape3D } => {
  const pocketW = config.dongleWidth + config.clearance * 2;
  const pocketH = config.dongleHeight + config.clearance * 2;
  const pocketLen = config.bodyLength + config.leadIn;

  const pocket = makeBaseBox(pocketW, pocketH, pocketLen).translate(
    0,
    0,
    config.hubZ - pocketLen / 2
  );

  const leadIn = makeBaseBox(
    pocketW + 2.0,
    pocketH + 2.0,
    config.leadIn
  ).translate(0, 0, config.hubZ - pocketLen / 2);

  return { pocket, leadIn };
};

export default function main(): Shape3D {
  const collarConfig: CollarConfig = {
    mouthDiameter: 68.0,
    tubeInnerDiameter: 69.0,
    axial: 14.0,
    radial: 2.4,
    splitCount: 4,
    splitWidth: 2.2,
    includeSplits: true,
    zOffset: 0,
  };

  const collarZCenter = collarConfig.zOffset + collarConfig.axial / 2;

  const hubConfig: HubConfig = {
    radius: 12.0,
    length: 14.0,
    centerZ: collarZCenter,
  };

  const collarDimensions = calculateCollarDimensions(collarConfig);

  const spokeConfig: SpokeConfig = {
    count: 4,
    width: collarConfig.axial,
    thickness: 2.0,
    tiltDeg: 0,
    zCenter: hubConfig.centerZ,
    outerRadius: Math.max(collarDimensions.innerRadius + 0.4, hubConfig.radius + 1), // slight overlap for smooth join
    hubRadius: hubConfig.radius,
    angleOffset:
      (collarConfig.splitCount > 0 ? 180 / collarConfig.splitCount : 0) + 90, // rotate a quarter turn
  };

  const pocketConfig: PocketConfig = {
    dongleWidth: 16.0,
    dongleHeight: 8.0,
    bodyLength: 45.0,
    clearance: 0.6,
    leadIn: 6.0,
    hubZ: hubConfig.centerZ,
  };

  const collar = buildCollar(collarConfig, collarDimensions);
  const hub = buildHub(hubConfig);
  const spokes = buildSpokes(spokeConfig);

  let part: Shape3D = collar.fuse(hub).fuse(spokes);

  const { pocket, leadIn } = createPocketCuts(pocketConfig);
  part = part.cut(pocket);
  part = part.cut(leadIn);

  return part;
}
