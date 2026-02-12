import { makeBaseBox, makeCompound, makeCylinder, Shape3D } from "replicad";

interface GrommetConfig {
  holeLength: number; // along X
  holeWidth: number; // along Y
  flangeMargin: number;
  flangeThickness: number;
  femaleFlangeFactor: number;
  bodyThickness: number;
  protrusionHeight: number;
  depressionDepth: number;
  throughHoleDiameter: number;
  spacing: number;
}

export const defaultParams: GrommetConfig = {
  holeLength: 16,
  holeWidth: 9,
  flangeMargin: 3,
  flangeThickness: 2,
  femaleFlangeFactor: 2,
  bodyThickness: 3,
  protrusionHeight: 1,
  depressionDepth: 1,
  throughHoleDiameter: 4,
  spacing: 30,
};

type HalfKind = "male" | "female";

const buildHalf = (kind: HalfKind, config: GrommetConfig): Shape3D => {
  const outerLength = config.holeLength + config.flangeMargin * 2;
  const outerWidth = config.holeWidth + config.flangeMargin * 2;
  const flangeThickness =
    kind === "female"
      ? config.flangeThickness * config.femaleFlangeFactor
      : config.flangeThickness;

  const flange = makeBaseBox(outerLength, outerWidth, flangeThickness);

  let half: Shape3D = flange;

  if (kind === "male") {
    const protrusion = makeBaseBox(
      config.holeLength,
      config.holeWidth,
      config.depressionDepth
    ).translate(0, 0, flangeThickness);
    half = half.fuse(protrusion);
  } else {
    const recess = makeBaseBox(
      config.holeLength + 0.2,
      config.holeWidth + 0.2,
      config.depressionDepth
    ).translate(0, 0, flangeThickness - config.depressionDepth);
    half = half.cut(recess);
  }

  const throughHole = makeCylinder(
    config.throughHoleDiameter / 2,
    flangeThickness +
      (kind === "male" ? config.bodyThickness + config.depressionDepth : 0)
  ).translate(0, 0, 0);

  half = half.cut(throughHole);

  const slotWidth = config.throughHoleDiameter;
  const slotLength = outerWidth / 2 + slotWidth / 2;
  const slotHeight =
    kind === "male"
      ? flangeThickness + config.bodyThickness + config.depressionDepth
      : flangeThickness;

  // Female: slot runs along -Y from the hole; Male: along +Y.
  const slotY = (kind === "female" ? -slotLength / 2 : slotLength / 2);
  const slot: Shape3D = makeBaseBox(slotWidth, slotLength, slotHeight).translate(
    0,
    slotY,
    kind === "male" ? 0 : 0
  );

  half = half.cut(slot);

  if (kind === "female") {
    const holeRadius = 0.5;
    const csRadius = 1.5;
    const csDepth = 0.5;
    const holeOffsetX = config.holeLength / 2 - 2; // position along the long axis

    const makeHoleCuts = (xOffset: number) => {
      const thru = makeCylinder(holeRadius, flangeThickness).translate(xOffset, 0, 0);
      const countersink = makeCylinder(csRadius, csDepth).translate(xOffset, 0, -csDepth);
      half = half.cut(thru).cut(countersink);
    };

    makeHoleCuts(holeOffsetX);
    makeHoleCuts(-holeOffsetX);
  }

  return half;
};

export default function main(config: Partial<GrommetConfig> = {}): Shape3D {
  const resolved = { ...defaultParams, ...config };

  const male = buildHalf("male", resolved);
  const female = buildHalf("female", resolved).translate(resolved.spacing, 0, 0);

  return makeCompound([male, female]) as Shape3D;
}
