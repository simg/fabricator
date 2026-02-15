import {
  drawRoundedRectangle,
  makeBaseBox,
  makeCompound,
  makeCylinder,
  Shape3D,
} from "replicad";

interface ChairConfig {
  seatWidth: number;
  seatDepth: number;
  seatThickness: number;
  seatBottomZ: number;
  legRadius: number;
  legLength: number;
  legSplayDeg: number;
  stretcherThickness: number;
  stretcherHeightZ: number;
  spindleCount: number;
  spindleRadius: number;
  spindleHeight: number;
  backrestWidth: number;
  backrestThickness: number;
  backrestHeight: number;
}

export const defaultParams: ChairConfig = {
  seatWidth: 160,
  seatDepth: 155,
  seatThickness: 18,
  seatBottomZ: 360,
  legRadius: 10,
  legLength: 365,
  legSplayDeg: 6,
  stretcherThickness: 8,
  stretcherHeightZ: 120,
  spindleCount: 5,
  spindleRadius: 3.2,
  spindleHeight: 195,
  backrestWidth: 132,
  backrestThickness: 16,
  backrestHeight: 28,
};

const makeLeg = (
  x: number,
  y: number,
  sx: number,
  sy: number,
  config: ChairConfig
): Shape3D => {
  const leg = makeCylinder(config.legRadius, config.legLength)
    .translate(0, 0, -config.legLength)
    .rotate(sx * config.legSplayDeg, [0, 0, 0], [0, 1, 0])
    .rotate(-sy * config.legSplayDeg, [0, 0, 0], [1, 0, 0]);

  return leg.translate(x, y, config.seatBottomZ + 2);
};

const makeStretchers = (config: ChairConfig): Shape3D[] => {
  const legX = config.seatWidth * 0.33;
  const frontY = config.seatDepth * 0.28;
  const backY = -config.seatDepth * 0.26;
  const h = config.stretcherThickness;
  const z = config.stretcherHeightZ;

  const sideSpan = Math.abs(frontY - backY);
  const frontSpan = legX * 2;
  const middleSpan = legX * 1.8;

  const leftSide = makeBaseBox(h, sideSpan, h).translate(-legX, (frontY + backY) / 2, z);
  const rightSide = makeBaseBox(h, sideSpan, h).translate(
    legX,
    (frontY + backY) / 2,
    z
  );
  const front = makeBaseBox(frontSpan, h, h).translate(0, frontY, z + 8);
  const middle = makeBaseBox(middleSpan, h, h).translate(0, 0, z - 4);

  return [leftSide, rightSide, front, middle];
};

const makeBackSpindles = (config: ChairConfig, seatTopZ: number): Shape3D[] => {
  const spindles: Shape3D[] = [];
  const spacing = config.backrestWidth / (config.spindleCount + 1);
  const baseY = -config.seatDepth * 0.22;

  for (let i = 0; i < config.spindleCount; i += 1) {
    const x = -config.backrestWidth / 2 + spacing * (i + 1);
    const spindle = makeCylinder(config.spindleRadius, config.spindleHeight)
      .rotate(4, [0, 0, seatTopZ], [1, 0, 0])
      .translate(x, baseY, seatTopZ - 2);

    spindles.push(spindle);
  }

  return spindles;
};

export default function main(params: Partial<ChairConfig> = {}): Shape3D {
  const config: ChairConfig = { ...defaultParams, ...params };
  const seatTopZ = config.seatBottomZ + config.seatThickness;

  const seat = drawRoundedRectangle(config.seatWidth, config.seatDepth, 18)
    .sketchOnPlane("XY", config.seatBottomZ)
    .extrude(config.seatThickness);

  const legX = config.seatWidth * 0.33;
  const legY = config.seatDepth * 0.30;
  const legs = [
    makeLeg(-legX, legY, -1, 1, config),
    makeLeg(legX, legY, 1, 1, config),
    makeLeg(-legX, -legY, -1, -1, config),
    makeLeg(legX, -legY, 1, -1, config),
  ];

  const spindles = makeBackSpindles(config, seatTopZ);

  const backrest = makeBaseBox(
    config.backrestWidth,
    config.backrestThickness,
    config.backrestHeight
  )
    .rotate(7, [0, 0, seatTopZ], [1, 0, 0])
    .translate(0, -config.seatDepth * 0.31, seatTopZ + config.spindleHeight - 2);

  const parts = [seat, ...legs, ...makeStretchers(config), ...spindles, backrest];
  return makeCompound(parts) as Shape3D;
}
