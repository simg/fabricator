import { makeBaseBox, makeCompound, makeCylinder } from "replicad";

export const metadata = {
  name: "Algorithmic Tower Block",
  description:
    "Seeded parametric tower with configurable floors, footprint, structural core, balconies, terraces, and style presets.",
};

export const defaultParams = {
  floors: 16,
  floorHeight: 3.6,
  slabThickness: 0.24,
  footprintWidth: 36,
  footprintDepth: 32,
  footprintShape: 0,
  coreWidth: 11,
  coreDepth: 10,
  taperTopScale: 0.72,
  twistTotalDeg: 34,
  setbackEvery: 9,
  setbackAmount: 0.03,
  stylePreset: 1,
  styleIntensity: 0.64,
  asymmetry: 0.28,
  massSeed: 1107,
  balconySeed: 3181,
  facadeSeed: 2027,
  symmetrySeed: 733,
  balconyDensity: 0.74,
  balconyDepth: 2.2,
  balconyBandEvery: 3,
  skyBandEvery: 12,
  terraceBoost: 0.18,
  columnCount: 14,
  columnSize: 0.52,
  lowerSupportDepth: 0.58,
  supportBias: 0.72,
  wallThickness: 0.22,
  windowBandRatio: 0.62,
  windowRibbonDepth: 0.08,
  doorWidth: 2.6,
  doorHeight: 3.2,
  facadeFinDensity: 0.58,
  lod: 1,
};

export const controls = {
  floors: { label: "Floors", min: 8, max: 120, step: 1, default: 16 },
  floorHeight: { label: "Floor Height (m)", min: 2.8, max: 5.4, step: 0.1, default: 3.6 },
  slabThickness: {
    label: "Slab Thickness (m)",
    min: 0.15,
    max: 0.6,
    step: 0.01,
    default: 0.24,
  },
  footprintWidth: { label: "Footprint Width", min: 16, max: 90, step: 1, default: 36 },
  footprintDepth: { label: "Footprint Depth", min: 16, max: 90, step: 1, default: 32 },
  footprintShape: {
    label: "Footprint Shape (0 rect, 1 round, 2 cross, 3 octa)",
    min: 0,
    max: 3,
    step: 1,
    default: 0,
  },
  coreWidth: { label: "Core Width", min: 6, max: 26, step: 0.5, default: 11 },
  coreDepth: { label: "Core Depth", min: 6, max: 26, step: 0.5, default: 10 },
  taperTopScale: { label: "Top Scale", min: 0.45, max: 1, step: 0.01, default: 0.72 },
  twistTotalDeg: { label: "Twist Total Deg", min: -120, max: 120, step: 1, default: 34 },
  setbackEvery: { label: "Setback Every Floors", min: 0, max: 20, step: 1, default: 9 },
  setbackAmount: { label: "Setback Amount", min: 0, max: 0.1, step: 0.005, default: 0.03 },
  stylePreset: {
    label: "Style Preset (0 calm, 1 agora, 2 terraced, 3 porous, 4 exo)",
    min: 0,
    max: 4,
    step: 1,
    default: 1,
  },
  styleIntensity: { label: "Style Intensity", min: 0, max: 1, step: 0.01, default: 0.64 },
  asymmetry: { label: "Asymmetry", min: 0, max: 1, step: 0.01, default: 0.28 },
  massSeed: { label: "Mass Seed", min: 1, max: 999999, step: 1, default: 1107 },
  balconySeed: { label: "Balcony Seed", min: 1, max: 999999, step: 1, default: 3181 },
  facadeSeed: { label: "Facade Seed", min: 1, max: 999999, step: 1, default: 2027 },
  symmetrySeed: { label: "Symmetry Seed", min: 1, max: 999999, step: 1, default: 733 },
  balconyDensity: { label: "Balcony Density", min: 0, max: 1, step: 0.01, default: 0.74 },
  balconyDepth: { label: "Balcony Depth", min: 0, max: 4.5, step: 0.05, default: 2.2 },
  balconyBandEvery: { label: "Balcony Band Every", min: 1, max: 8, step: 1, default: 3 },
  skyBandEvery: { label: "Sky Band Every", min: 0, max: 24, step: 1, default: 12 },
  terraceBoost: { label: "Terrace Boost", min: 0, max: 0.35, step: 0.01, default: 0.18 },
  columnCount: { label: "Column Count", min: 4, max: 24, step: 1, default: 14 },
  columnSize: { label: "Column Size", min: 0.25, max: 1.4, step: 0.01, default: 0.52 },
  lowerSupportDepth: { label: "Lower Support Depth", min: 0.2, max: 0.9, step: 0.01, default: 0.58 },
  supportBias: { label: "Support Bias", min: 0.35, max: 0.95, step: 0.01, default: 0.72 },
  wallThickness: { label: "Wall Thickness", min: 0.1, max: 0.8, step: 0.01, default: 0.22 },
  windowBandRatio: { label: "Window Band Ratio", min: 0.3, max: 0.85, step: 0.01, default: 0.62 },
  windowRibbonDepth: { label: "Window Ribbon Depth", min: 0.02, max: 0.2, step: 0.01, default: 0.08 },
  doorWidth: { label: "Door Width", min: 1.2, max: 5, step: 0.1, default: 2.6 },
  doorHeight: { label: "Door Height", min: 2, max: 5, step: 0.1, default: 3.2 },
  facadeFinDensity: { label: "Facade Fin Density", min: 0, max: 1, step: 0.01, default: 0.58 },
  lod: { label: "LOD (0 fast, 1 balanced, 2 rich)", min: 0, max: 2, step: 1, default: 1 },
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const clampInt = (v, min, max) => Math.round(clamp(Number(v), min, max));
const lerp = (a, b, t) => a + (b - a) * t;

const makeRng = (seed) => {
  let state = (seed >>> 0) || 1;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const randAt = (seed, index) => {
  const rng = makeRng((seed * 374761393 + index * 668265263) >>> 0);
  return rng();
};

const buildFloorPlate = (shapeId, width, depth, thickness) => {
  const shape = clampInt(shapeId, 0, 3);

  if (shape === 1) {
    return makeCylinder(Math.min(width, depth) * 0.5, thickness);
  }

  if (shape === 2) {
    const mainWing = makeBaseBox(width, depth * 0.52, thickness);
    const crossWing = makeBaseBox(width * 0.52, depth, thickness);
    return makeCompound([mainWing, crossWing]);
  }

  if (shape === 3) {
    const base = makeBaseBox(width, depth, thickness);
    const diamond = makeBaseBox(width * 0.78, depth * 0.78, thickness).rotate(
      45,
      [0, 0, 0],
      [0, 0, 1]
    );
    return makeCompound([base, diamond]);
  }

  return makeBaseBox(width, depth, thickness);
};

const styleFactors = (preset, intensity) => {
  const s = clampInt(preset, 0, 4);
  const i = clamp(intensity, 0, 1);

  const base = {
    twistMul: 1,
    taperMul: 1,
    balconyMul: 1,
    bandBoost: 1,
    roughness: 0.035,
    terraceMul: 1,
    finMul: 1,
    altRotation: 0,
  };

  if (s === 0) {
    return {
      ...base,
      twistMul: 0.25 + i * 0.15,
      taperMul: 0.8,
      balconyMul: 0.45 + i * 0.35,
      roughness: 0.012 + i * 0.01,
      terraceMul: 0.5,
      finMul: 0.35,
    };
  }

  if (s === 1) {
    return {
      ...base,
      twistMul: 0.95 + i * 0.35,
      taperMul: 1.05,
      balconyMul: 1.2 + i * 0.45,
      roughness: 0.03 + i * 0.02,
      terraceMul: 1.45,
      finMul: 0.7,
      altRotation: 5 + i * 8,
    };
  }

  if (s === 2) {
    return {
      ...base,
      twistMul: 0.55,
      taperMul: 1.15,
      balconyMul: 1.1,
      roughness: 0.018,
      terraceMul: 1.9,
      finMul: 0.45,
      altRotation: 3,
    };
  }

  if (s === 3) {
    return {
      ...base,
      twistMul: 1.35,
      taperMul: 0.95,
      balconyMul: 0.88,
      roughness: 0.05,
      terraceMul: 0.95,
      finMul: 1.3,
      altRotation: 9,
    };
  }

  return {
    ...base,
    twistMul: 1.2,
    taperMul: 1.1,
    balconyMul: 0.78,
    roughness: 0.028,
    terraceMul: 1.2,
    finMul: 1.9,
    altRotation: 7,
  };
};

const makeBalconySegments = ({
  plateWidth,
  plateDepth,
  floorZ,
  slabThickness,
  balconyDepth,
  sideMask,
  asymmetryScale,
}) => {
  if (balconyDepth <= 0.02) return [];

  const segThickness = Math.max(0.14, slabThickness * 0.72);
  const z = floorZ + slabThickness;
  const segments = [];

  if (sideMask & 1) {
    segments.push(
      makeBaseBox(plateWidth * (0.44 + 0.32 * asymmetryScale), balconyDepth, segThickness).translate(
        0,
        plateDepth * 0.5 + balconyDepth * 0.5,
        z
      )
    );
  }

  if (sideMask & 2) {
    segments.push(
      makeBaseBox(plateWidth * (0.4 + 0.3 * (1 - asymmetryScale)), balconyDepth, segThickness).translate(
        0,
        -plateDepth * 0.5 - balconyDepth * 0.5,
        z
      )
    );
  }

  if (sideMask & 4) {
    segments.push(
      makeBaseBox(balconyDepth, plateDepth * (0.44 + 0.24 * asymmetryScale), segThickness).translate(
        plateWidth * 0.5 + balconyDepth * 0.5,
        0,
        z
      )
    );
  }

  if (sideMask & 8) {
    segments.push(
      makeBaseBox(balconyDepth, plateDepth * (0.44 + 0.24 * (1 - asymmetryScale)), segThickness).translate(
        -plateWidth * 0.5 - balconyDepth * 0.5,
        0,
        z
      )
    );
  }

  return segments;
};

const makePerimeterColumns = (cfg, totalHeight) => {
  const count = clampInt(cfg.columnCount, 4, 24);
  const size = clamp(cfg.columnSize, 0.2, 1.8);
  const width = cfg.footprintWidth * 0.95;
  const depth = cfg.footprintDepth * 0.95;

  const columns = [];
  for (let i = 0; i < count; i += 1) {
    const a = (Math.PI * 2 * i) / count;
    const x = Math.cos(a) * (width * 0.5);
    const y = Math.sin(a) * (depth * 0.5);
    columns.push(makeBaseBox(size, size, totalHeight));
    columns[columns.length - 1] = columns[columns.length - 1].translate(x, y, totalHeight * 0.5);
  }

  return columns;
};

const makeLowerSupportColumns = (cfg, totalHeight) => {
  const count = clampInt(cfg.columnCount, 4, 24);
  const lowerRatio = clamp(cfg.lowerSupportDepth, 0.2, 0.9);
  const bias = clamp(cfg.supportBias, 0.35, 0.95);
  const lowerHeight = totalHeight * lowerRatio;
  const size = clamp(cfg.columnSize * (1.4 + bias * 0.7), 0.3, 2.6);
  const width = cfg.footprintWidth * (0.35 + bias * 0.45);
  const depth = cfg.footprintDepth * (0.35 + bias * 0.45);

  const columns = [];
  for (let i = 0; i < count; i += 1) {
    const a = (Math.PI * 2 * i) / count;
    const x = Math.cos(a) * width * 0.5;
    const y = Math.sin(a) * depth * 0.5;
    columns.push(
      makeBaseBox(size, size, lowerHeight).translate(x, y, lowerHeight * 0.5)
    );
  }

  return columns;
};

const makeWallAndWindowSystem = ({
  plateWidth,
  plateDepth,
  floorZ,
  floorHeight,
  slabThickness,
  wallThickness,
  windowBandRatio,
  windowRibbonDepth,
  rotationDeg,
  lod,
  floorIndex,
  isGroundFloor,
  doorWidth,
  doorHeight,
}) => {
  const walls = [];
  const windows = [];
  const mullions = [];
  const storyHeight = Math.max(1.8, floorHeight - slabThickness);
  const wallHeight = storyHeight * 0.96;
  const baseZ = floorZ + slabThickness + (storyHeight - wallHeight) * 0.5;

  const t = clamp(wallThickness, 0.1, 0.8);
  const ribbonDepth = clamp(windowRibbonDepth, 0.02, t * 0.95);
  const windowRatio = clamp(windowBandRatio, 0.3, 0.85);
  const windowHeight = wallHeight * windowRatio;
  const windowZ = baseZ + wallHeight * 0.5;

  const yNorth = plateDepth * 0.5 - t * 0.5;
  const ySouth = -yNorth;
  const xEast = plateWidth * 0.5 - t * 0.5;
  const xWest = -xEast;

  const addSegmentedWall = (axis, side, span, fixedPos) => {
    if (!isGroundFloor) {
      if (axis === "y") {
        walls.push(
          makeBaseBox(span, t, wallHeight).translate(0, fixedPos, baseZ + wallHeight * 0.5)
        );
      } else {
        walls.push(
          makeBaseBox(t, span, wallHeight).translate(fixedPos, 0, baseZ + wallHeight * 0.5)
        );
      }
      return;
    }

    const openingW = clamp(doorWidth, 1.2, span * 0.8);
    const openingH = clamp(doorHeight, 2, wallHeight * 0.96);
    const sideSpan = Math.max((span - openingW) * 0.5, 0.2);
    const lintelH = Math.max(wallHeight - openingH, 0.18);

    if (axis === "y") {
      walls.push(
        makeBaseBox(sideSpan, t, wallHeight).translate(
          -(openingW * 0.5 + sideSpan * 0.5),
          fixedPos,
          baseZ + wallHeight * 0.5
        )
      );
      walls.push(
        makeBaseBox(sideSpan, t, wallHeight).translate(
          openingW * 0.5 + sideSpan * 0.5,
          fixedPos,
          baseZ + wallHeight * 0.5
        )
      );
      walls.push(
        makeBaseBox(openingW, t, lintelH).translate(
          0,
          fixedPos,
          baseZ + openingH + lintelH * 0.5
        )
      );
    } else {
      walls.push(
        makeBaseBox(t, sideSpan, wallHeight).translate(
          fixedPos,
          -(openingW * 0.5 + sideSpan * 0.5),
          baseZ + wallHeight * 0.5
        )
      );
      walls.push(
        makeBaseBox(t, sideSpan, wallHeight).translate(
          fixedPos,
          openingW * 0.5 + sideSpan * 0.5,
          baseZ + wallHeight * 0.5
        )
      );
      walls.push(
        makeBaseBox(t, openingW, lintelH).translate(
          fixedPos,
          0,
          baseZ + openingH + lintelH * 0.5
        )
      );
    }

    if (side === "north" || side === "south") {
      windows.push(
        makeBaseBox(openingW * 0.78, ribbonDepth, Math.min(openingH * 0.62, windowHeight))
          .translate(
            0,
            fixedPos + (side === "north" ? ribbonDepth * 0.5 : -ribbonDepth * 0.5),
            baseZ + Math.min(openingH * 0.62, windowHeight) * 0.5 + 0.24
          )
      );
    } else {
      windows.push(
        makeBaseBox(ribbonDepth, openingW * 0.78, Math.min(openingH * 0.62, windowHeight))
          .translate(
            fixedPos + (side === "east" ? ribbonDepth * 0.5 : -ribbonDepth * 0.5),
            0,
            baseZ + Math.min(openingH * 0.62, windowHeight) * 0.5 + 0.24
          )
      );
    }
  };

  addSegmentedWall("y", "north", plateWidth, yNorth);
  addSegmentedWall("y", "south", plateWidth, ySouth);
  addSegmentedWall("x", "east", plateDepth, xEast);
  addSegmentedWall("x", "west", plateDepth, xWest);

  const skipWindows = lod === 0 && floorIndex % 2 !== 0;
  if (!skipWindows) {
    windows.push(
      makeBaseBox(plateWidth * 0.8, ribbonDepth, windowHeight).translate(
        0,
        yNorth + ribbonDepth * 0.5,
        windowZ
      ),
      makeBaseBox(plateWidth * 0.8, ribbonDepth, windowHeight).translate(
        0,
        ySouth - ribbonDepth * 0.5,
        windowZ
      ),
      makeBaseBox(ribbonDepth, plateDepth * 0.8, windowHeight).translate(
        xEast + ribbonDepth * 0.5,
        0,
        windowZ
      ),
      makeBaseBox(ribbonDepth, plateDepth * 0.8, windowHeight).translate(
        xWest - ribbonDepth * 0.5,
        0,
        windowZ
      )
    );
  }

  if (lod >= 2 && floorIndex % 2 === 0) {
    const mullionCount = clampInt(Math.min(plateWidth, plateDepth) / 4, 3, 9);
    const mullionW = 0.07;
    for (let i = 1; i <= mullionCount; i += 1) {
      const tx = -plateWidth * 0.35 + (plateWidth * 0.7 * i) / (mullionCount + 1);
      const ty = -plateDepth * 0.35 + (plateDepth * 0.7 * i) / (mullionCount + 1);
      mullions.push(
        makeBaseBox(mullionW, ribbonDepth, windowHeight).translate(
          tx,
          yNorth + ribbonDepth * 0.5,
          windowZ
        ),
        makeBaseBox(mullionW, ribbonDepth, windowHeight).translate(
          tx,
          ySouth - ribbonDepth * 0.5,
          windowZ
        ),
        makeBaseBox(ribbonDepth, mullionW, windowHeight).translate(
          xEast + ribbonDepth * 0.5,
          ty,
          windowZ
        ),
        makeBaseBox(ribbonDepth, mullionW, windowHeight).translate(
          xWest - ribbonDepth * 0.5,
          ty,
          windowZ
        )
      );
    }
  }

  const combined = [...walls, ...windows, ...mullions];
  return combined.map((shape) =>
    shape.rotate(rotationDeg, [0, 0, floorZ], [0, 0, 1])
  );
};

const makeFacadeFins = (cfg, totalHeight, style) => {
  const density = clamp(cfg.facadeFinDensity, 0, 1) * style.finMul;
  if (density <= 0.05) return [];

  const lod = clampInt(cfg.lod, 0, 2);
  const finCountBase = lod === 0 ? 8 : lod === 1 ? 14 : 20;
  const finCount = clampInt(finCountBase * density, 4, 28);
  const finThickness = 0.14;
  const finDepth = clamp(0.5 + density * 1.1, 0.45, 1.6);

  const width = cfg.footprintWidth * 0.56;
  const depth = cfg.footprintDepth * 0.56;
  const fins = [];

  for (let i = 0; i < finCount; i += 1) {
    const a = (Math.PI * 2 * i) / finCount;
    const x = Math.cos(a) * width;
    const y = Math.sin(a) * depth;
    const fin = makeBaseBox(finThickness, finDepth, totalHeight)
      .translate(x, y, totalHeight * 0.5)
      .rotate((a * 180) / Math.PI, [x, y, totalHeight * 0.5], [0, 0, 1]);
    fins.push(fin);
  }

  return fins;
};

export default function buildAlgorithmicTower(params = {}) {
  const cfg = {
    ...defaultParams,
    ...params,
  };

  const floors = clampInt(cfg.floors, 8, 140);
  const floorHeight = clamp(cfg.floorHeight, 2.6, 6.0);
  const slabThickness = clamp(cfg.slabThickness, 0.12, floorHeight * 0.35);
  const totalHeight = floors * floorHeight;
  const style = styleFactors(cfg.stylePreset, cfg.styleIntensity);

  const taperTopScale = clamp(cfg.taperTopScale, 0.35, 1.05);
  const baseTwist = cfg.twistTotalDeg * style.twistMul;
  const baseSetbackEvery = clampInt(cfg.setbackEvery, 0, 30);
  const baseSetbackAmount = clamp(cfg.setbackAmount, 0, 0.16) * style.taperMul;

  const asymmetry = clamp(cfg.asymmetry, 0, 1);
  const balconyDensity = clamp(cfg.balconyDensity, 0, 1) * style.balconyMul;
  const balconyBandEvery = clampInt(cfg.balconyBandEvery, 1, 12);
  const skyBandEvery = clampInt(cfg.skyBandEvery, 0, 30);
  const terraceBoost = clamp(cfg.terraceBoost, 0, 0.5) * style.terraceMul;

  const lod = clampInt(cfg.lod, 0, 2);
  const detailStride = lod === 0 ? 3 : lod === 1 ? 2 : 1;

  const solids = [];

  const core = makeBaseBox(
    clamp(cfg.coreWidth, 4, cfg.footprintWidth * 0.95),
    clamp(cfg.coreDepth, 4, cfg.footprintDepth * 0.95),
    totalHeight
  ).translate(0, 0, totalHeight * 0.5);
  solids.push(core);

  solids.push(...makePerimeterColumns(cfg, totalHeight));
  solids.push(...makeLowerSupportColumns(cfg, totalHeight));
  solids.push(...makeFacadeFins(cfg, totalHeight, style));

  for (let i = 0; i < floors; i += 1) {
    const floorT = floors <= 1 ? 0 : i / (floors - 1);
    const floorZ = i * floorHeight;

    const massNoise = (randAt(cfg.massSeed, i) - 0.5) * 2;
    const facadeNoise = (randAt(cfg.facadeSeed, i) - 0.5) * 2;
    const symmetryNoise = randAt(cfg.symmetrySeed, i);

    const taperScale = lerp(1, taperTopScale, floorT);
    const roughnessScale = 1 + massNoise * style.roughness;

    const setbackSteps = baseSetbackEvery > 0 ? Math.floor(i / baseSetbackEvery) : 0;
    const setbackScale = 1 - setbackSteps * baseSetbackAmount;

    const skyBandHit = skyBandEvery > 0 && i > 0 && i % skyBandEvery === 0;
    const skyBoost = skyBandHit ? 1 + terraceBoost : 1;

    const scale = clamp(taperScale * roughnessScale * setbackScale * skyBoost, 0.33, 1.35);
    const plateWidth = cfg.footprintWidth * scale;
    const plateDepth = cfg.footprintDepth * scale;

    let rotationDeg = baseTwist * floorT + facadeNoise * 2.2;
    if (style.altRotation !== 0 && i % 2 === 0) {
      rotationDeg += style.altRotation;
    }

    const slab = buildFloorPlate(cfg.footprintShape, plateWidth, plateDepth, slabThickness)
      .translate(0, 0, floorZ)
      .rotate(rotationDeg, [0, 0, floorZ], [0, 0, 1]);

    solids.push(slab);
    solids.push(
      ...makeWallAndWindowSystem({
        plateWidth,
        plateDepth,
        floorZ,
        floorHeight,
        slabThickness,
        wallThickness: cfg.wallThickness,
        windowBandRatio: cfg.windowBandRatio,
        windowRibbonDepth: cfg.windowRibbonDepth,
        rotationDeg,
        lod,
        floorIndex: i,
        isGroundFloor: i === 0,
        doorWidth: cfg.doorWidth,
        doorHeight: cfg.doorHeight,
      })
    );

    if (i % detailStride !== 0) continue;

    const balconyRnd = randAt(cfg.balconySeed, i);
    const inBand = i % balconyBandEvery === 0;
    const shouldBalcony = inBand || balconyRnd < balconyDensity;

    if (!shouldBalcony) continue;

    const asymmetryScale = clamp((symmetryNoise * (1 - asymmetry)) + asymmetry * balconyRnd, 0, 1);

    const sideSeed = randAt(cfg.symmetrySeed + 101, i);
    let sideMask = 0;
    if (sideSeed > 0.1) sideMask |= 1;
    if (sideSeed < 0.9) sideMask |= 2;
    if (randAt(cfg.symmetrySeed + 211, i) > asymmetry * 0.45) sideMask |= 4;
    if (randAt(cfg.symmetrySeed + 307, i) > asymmetry * 0.45) sideMask |= 8;

    if (sideMask === 0) sideMask = 1 | 2;

    const floorBalconyDepth = cfg.balconyDepth * (0.65 + balconyRnd * 0.7);

    const balconySegments = makeBalconySegments({
      plateWidth,
      plateDepth,
      floorZ,
      slabThickness,
      balconyDepth: floorBalconyDepth,
      sideMask,
      asymmetryScale,
    }).map((shape) => shape.rotate(rotationDeg, [0, 0, floorZ], [0, 0, 1]));

    solids.push(...balconySegments);
  }

  return makeCompound(solids);
}
