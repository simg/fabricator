import { makeBaseBox, makeCompound, makeCylinder } from "replicad";

export const metadata = {
  name: "Tethered Bottle Top",
  description:
    "Parametric replacement flip tether cap inspired by the provided photos.",
};

export const defaultParams = {
  capOuterDiameter: 33.0,
  capHeight: 12.0,
  topThickness: 2.0,
  bottleNeckOuterDiameter: 27.4,
  radialClearance: 0.3,
  wallThickness: 2.3,
  retentionBeadHeight: 1.1,
  retentionBeadRadial: 0.6,
  gripCount: 42,
  gripDepth: 0.45,
  loopOuterLength: 34.0,
  loopOuterWidth: 20.0,
  loopBandWidth: 2.6,
  loopThickness: 2.6,
  tetherWidth: 8.0,
  tetherThickness: 2.3,
  tetherDrop: 1.2,
  bridgeGap: 1.2,
};

export const controls = {
  capOuterDiameter: {
    label: "Cap Outer Diameter",
    min: 24,
    max: 44,
    step: 0.1,
    default: 33,
  },
  bottleNeckOuterDiameter: {
    label: "Bottle Neck OD",
    min: 18,
    max: 36,
    step: 0.1,
    default: 27.4,
  },
  radialClearance: {
    label: "Radial Clearance",
    min: 0.0,
    max: 1.0,
    step: 0.05,
    default: 0.3,
  },
  capHeight: { label: "Cap Height", min: 8, max: 20, step: 0.1, default: 12 },
  topThickness: {
    label: "Top Thickness",
    min: 1.2,
    max: 4,
    step: 0.1,
    default: 2,
  },
  wallThickness: {
    label: "Wall Thickness",
    min: 1.4,
    max: 4,
    step: 0.1,
    default: 2.3,
  },
  retentionBeadHeight: {
    label: "Bead Height",
    min: 0,
    max: 2.5,
    step: 0.1,
    default: 1.1,
  },
  retentionBeadRadial: {
    label: "Bead Radial",
    min: 0,
    max: 1.2,
    step: 0.05,
    default: 0.6,
  },
  gripCount: { label: "Grip Count", min: 12, max: 80, step: 1, default: 42 },
  gripDepth: { label: "Grip Depth", min: 0, max: 1.2, step: 0.05, default: 0.45 },
  loopOuterLength: {
    label: "Loop Outer Length",
    min: 20,
    max: 50,
    step: 0.1,
    default: 34,
  },
  loopOuterWidth: {
    label: "Loop Outer Width",
    min: 12,
    max: 32,
    step: 0.1,
    default: 20,
  },
  loopBandWidth: {
    label: "Loop Band Width",
    min: 1.4,
    max: 5,
    step: 0.1,
    default: 2.6,
  },
  tetherWidth: { label: "Tether Width", min: 4, max: 14, step: 0.1, default: 8 },
  tetherThickness: {
    label: "Tether Thickness",
    min: 1.2,
    max: 5,
    step: 0.1,
    default: 2.3,
  },
  tetherDrop: {
    label: "Tether Vertical Drop",
    min: -3,
    max: 5,
    step: 0.1,
    default: 1.2,
  },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const fuseAll = (solids) =>
  solids.filter(Boolean).reduce((acc, part) => {
    if (!acc) return part;
    return acc.fuse(part) || acc;
  }, null);

const makeRoundedLoop = ({
  outerLength,
  outerWidth,
  bandWidth,
  thickness,
  center = [0, 0, 0],
}) => {
  const outerRadius = outerWidth / 2;
  const outerHalfStraight = Math.max(0.01, outerLength / 2 - outerRadius);
  const innerWidth = outerWidth - bandWidth * 2;
  const innerLength = outerLength - bandWidth * 2;
  const innerRadius = Math.max(0.4, innerWidth / 2);
  const innerHalfStraight = Math.max(0.01, innerLength / 2 - innerRadius);
  const [cx, cy, cz] = center;

  const outerCaps = [
    makeCylinder(outerRadius, thickness).translate(cx + outerHalfStraight, cy, cz),
    makeCylinder(outerRadius, thickness).translate(cx - outerHalfStraight, cy, cz),
  ];
  const outerBridge = makeBaseBox(outerHalfStraight * 2, outerWidth, thickness).translate(
    cx,
    cy,
    cz + thickness / 2
  );
  const outer = fuseAll([...outerCaps, outerBridge]);

  const innerCaps = [
    makeCylinder(innerRadius, thickness + 0.6).translate(
      cx + innerHalfStraight,
      cy,
      cz - 0.3
    ),
    makeCylinder(innerRadius, thickness + 0.6).translate(
      cx - innerHalfStraight,
      cy,
      cz - 0.3
    ),
  ];
  const innerBridge = makeBaseBox(
    innerHalfStraight * 2,
    innerWidth,
    thickness + 0.6
  ).translate(cx, cy, cz + thickness / 2 - 0.3);
  const inner = fuseAll([...innerCaps, innerBridge]);

  return outer.cut(inner);
};

export default function buildTetheredBottleTop(params = {}) {
  const cfg = {
    ...defaultParams,
    ...params,
  };

  const capOuterRadius = cfg.capOuterDiameter / 2;
  const innerRadius = cfg.bottleNeckOuterDiameter / 2 + cfg.radialClearance;
  const effectiveWall = Math.max(cfg.wallThickness, capOuterRadius - innerRadius + 0.4);
  const capInnerRadius = Math.max(1, capOuterRadius - effectiveWall);
  const capHeight = clamp(cfg.capHeight, 6, 30);
  const topThickness = clamp(cfg.topThickness, 0.8, capHeight - 0.8);

  let cap = makeCylinder(capOuterRadius, capHeight);

  // Cup cavity: open on the bottom, closed by a top plate.
  const cavity = makeCylinder(capInnerRadius, capHeight - topThickness + 0.2).translate(
    0,
    0,
    -0.1
  );
  cap = cap.cut(cavity);

  if (cfg.retentionBeadHeight > 0 && cfg.retentionBeadRadial > 0) {
    const beadOuter = makeCylinder(
      capInnerRadius + cfg.retentionBeadRadial,
      cfg.retentionBeadHeight
    ).translate(0, 0, 0.7);
    const beadInner = makeCylinder(capInnerRadius - 0.05, cfg.retentionBeadHeight + 0.2)
      .translate(0, 0, 0.6);
    cap = cap.fuse(beadOuter.cut(beadInner)) || cap;
  }

  const gripCount = Math.max(0, Math.round(cfg.gripCount));
  const toothWidth = (2 * Math.PI * capOuterRadius) / Math.max(1, gripCount) * 0.45;
  const toothHeight = capHeight * 0.78;
  for (let i = 0; i < gripCount; i += 1) {
    const angle = (360 / gripCount) * i;
    const cutter = makeBaseBox(
      cfg.gripDepth * 2.2,
      Math.max(0.5, toothWidth),
      toothHeight
    )
      .translate(capOuterRadius - cfg.gripDepth * 0.75, 0, capHeight * 0.44)
      .rotate(angle, [0, 0, 0], [0, 0, 1]);
    cap = cap.cut(cutter);
  }

  const loopOuterLength = Math.max(cfg.loopOuterLength, cfg.loopOuterWidth + 0.2);
  const loopCenterX =
    -(capOuterRadius + cfg.bridgeGap + cfg.loopBandWidth + loopOuterLength / 2);
  const loopCenterZ = capHeight * 0.52 - cfg.tetherDrop;
  const loop = makeRoundedLoop({
    outerLength: loopOuterLength,
    outerWidth: cfg.loopOuterWidth,
    bandWidth: cfg.loopBandWidth,
    thickness: cfg.loopThickness,
    center: [loopCenterX, 0, loopCenterZ],
  });

  const loopRightX = loopCenterX + loopOuterLength / 2;
  const capLeftX = -capOuterRadius;
  const bridgeLength = Math.max(2, capLeftX - loopRightX + cfg.loopBandWidth * 0.9);
  const bridgeCenterX = (capLeftX + loopRightX) / 2;
  const bridgeCenterZ = capHeight * 0.5 - cfg.tetherDrop * 0.55;

  let tether = makeBaseBox(
    bridgeLength,
    cfg.tetherWidth,
    cfg.tetherThickness
  ).translate(bridgeCenterX, 0, bridgeCenterZ);
  tether = tether.rotate(8, [bridgeCenterX, 0, bridgeCenterZ], [0, 1, 0]);

  const ribWidth = Math.max(0.8, cfg.tetherWidth * 0.16);
  const rib1 = makeBaseBox(bridgeLength * 0.9, ribWidth, cfg.tetherThickness * 0.9).translate(
    bridgeCenterX,
    -cfg.tetherWidth * 0.32,
    bridgeCenterZ + cfg.tetherThickness * 0.18
  );
  const rib2 = makeBaseBox(bridgeLength * 0.9, ribWidth, cfg.tetherThickness * 0.9).translate(
    bridgeCenterX,
    cfg.tetherWidth * 0.32,
    bridgeCenterZ + cfg.tetherThickness * 0.18
  );
  tether = fuseAll([tether, rib1, rib2]);

  const unified = fuseAll([cap, tether, loop]);
  return unified || makeCompound([cap, tether, loop]);
}
