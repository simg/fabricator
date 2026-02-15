import { makeBaseBox, makeCompound, makeCylinder } from "replicad";

export const metadata = {
  name: "International Space Station (Photo Study)",
  description:
    "Stylized ISS model based on the provided photo, with truss, modules, and solar arrays.",
};

export const defaultParams = {
  trussLength: 340,
  trussWidth: 12,
  trussHeight: 10,
  moduleRadius: 17,
  moduleLength: 68,
  wingStations: 4,
  panelSegments: 4,
  panelLength: 58,
  panelWidth: 17,
  panelThickness: 1.4,
  panelGap: 3,
  wingRootOffset: 34,
};

export const controls = {
  trussLength: { label: "Truss Length", min: 220, max: 520, step: 10, default: 340 },
  moduleRadius: { label: "Module Radius", min: 10, max: 30, step: 1, default: 17 },
  moduleLength: { label: "Module Length", min: 40, max: 120, step: 2, default: 68 },
  wingStations: { label: "Wing Stations", min: 2, max: 5, step: 1, default: 4 },
  panelSegments: { label: "Panels Per Wing", min: 2, max: 6, step: 1, default: 4 },
  panelLength: { label: "Panel Length", min: 30, max: 110, step: 2, default: 58 },
  panelWidth: { label: "Panel Width", min: 10, max: 30, step: 1, default: 17 },
  wingRootOffset: { label: "Wing Root Offset", min: 24, max: 70, step: 2, default: 34 },
};

const clampInt = (value, min, max) =>
  Math.max(min, Math.min(max, Math.round(Number.isFinite(value) ? value : min)));

const buildModuleStack = (cfg) => {
  const node = makeCylinder(cfg.moduleRadius, cfg.moduleLength)
    .rotate(90, [0, 0, 0], [0, 1, 0])
    .translate(0, 0, -cfg.moduleRadius * 0.55);

  const labPort = makeCylinder(cfg.moduleRadius * 0.8, cfg.moduleLength * 0.72)
    .rotate(90, [0, 0, 0], [0, 1, 0])
    .translate(cfg.moduleLength * 0.78, 0, -cfg.moduleRadius * 0.55);

  const labStarboard = makeCylinder(cfg.moduleRadius * 0.8, cfg.moduleLength * 0.72)
    .rotate(90, [0, 0, 0], [0, 1, 0])
    .translate(-cfg.moduleLength * 0.78, 0, -cfg.moduleRadius * 0.55);

  const nadirNode = makeCylinder(cfg.moduleRadius * 0.58, cfg.moduleLength * 0.55)
    .translate(0, 0, -cfg.moduleRadius * 1.9);

  const zenithCupola = makeCylinder(cfg.moduleRadius * 0.36, cfg.moduleLength * 0.25).translate(
    0,
    0,
    cfg.moduleRadius * 0.2
  );

  const airlock = makeCylinder(cfg.moduleRadius * 0.28, cfg.moduleLength * 0.45)
    .rotate(90, [0, 0, 0], [0, 1, 0])
    .translate(cfg.moduleLength * 0.35, cfg.moduleRadius * 0.95, -cfg.moduleRadius * 1.25);

  return makeCompound([node, labPort, labStarboard, nadirNode, zenithCupola, airlock]);
};

const buildSolarWings = (cfg) => {
  const solids = [];

  const stations = clampInt(cfg.wingStations, 2, 5);
  const segments = clampInt(cfg.panelSegments, 2, 6);

  const stationSpacing = cfg.trussLength / (stations + 1);
  const wingRailThickness = Math.max(2, cfg.trussHeight * 0.24);

  for (let i = 0; i < stations; i += 1) {
    const x = -cfg.trussLength / 2 + stationSpacing * (i + 1);

    for (const direction of [-1, 1]) {
      const mast = makeBaseBox(4, 2, cfg.trussHeight * 0.9)
        .translate(x, direction * cfg.wingRootOffset, cfg.trussHeight * 0.15)
        .rotate(direction < 0 ? -8 : 8, [x, direction * cfg.wingRootOffset, 0], [1, 0, 0]);

      solids.push(mast);

      for (let p = 0; p < segments; p += 1) {
        const y =
          direction *
          (cfg.wingRootOffset + (p + 0.5) * cfg.panelWidth + p * cfg.panelGap);

        const blanket = makeBaseBox(
          cfg.panelLength,
          cfg.panelWidth,
          cfg.panelThickness
        )
          .translate(x, y, cfg.trussHeight * 0.7)
          .rotate(direction < 0 ? -3 : 3, [x, y, 0], [1, 0, 0]);

        const rail = makeBaseBox(cfg.panelLength, 1.4, wingRailThickness)
          .translate(x, y, cfg.trussHeight * 0.42)
          .rotate(direction < 0 ? -3 : 3, [x, y, 0], [1, 0, 0]);

        solids.push(blanket, rail);
      }
    }
  }

  return makeCompound(solids);
};

export default function buildISS(params = {}) {
  const cfg = {
    ...defaultParams,
    ...params,
  };

  const truss = makeBaseBox(cfg.trussLength, cfg.trussWidth, cfg.trussHeight).translate(
    0,
    0,
    cfg.moduleRadius * 0.25
  );

  const trussBoomPort = makeBaseBox(cfg.trussLength * 0.24, 4, 4).translate(
    -cfg.trussLength * 0.36,
    0,
    cfg.trussHeight * 1.05
  );

  const trussBoomStarboard = makeBaseBox(cfg.trussLength * 0.24, 4, 4).translate(
    cfg.trussLength * 0.36,
    0,
    cfg.trussHeight * 1.05
  );

  const radiatorPort = makeBaseBox(cfg.trussLength * 0.18, 11, 1.2)
    .translate(-cfg.trussLength * 0.2, cfg.wingRootOffset * 0.45, cfg.trussHeight * 1.35)
    .rotate(14, [0, 0, 0], [1, 0, 0]);

  const radiatorStarboard = makeBaseBox(cfg.trussLength * 0.18, 11, 1.2)
    .translate(cfg.trussLength * 0.1, -cfg.wingRootOffset * 0.5, cfg.trussHeight * 1.32)
    .rotate(-14, [0, 0, 0], [1, 0, 0]);

  const moduleStack = buildModuleStack(cfg);
  const solarWings = buildSolarWings(cfg);

  return makeCompound([
    truss,
    trussBoomPort,
    trussBoomStarboard,
    radiatorPort,
    radiatorStarboard,
    moduleStack,
    solarWings,
  ]);
}
