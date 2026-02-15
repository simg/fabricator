import { draw, Sketcher, makeCompound, sketchParametricFunction } from "replicad";

export const metadata = {
  name: "Mini Hand Backscratcher",
  description:
    "Mini backscratcher with spline palm, five curved fingers, and bent neck.",
};

export const defaultParams = {
  handThickness: 4.8,
  palmLength: 28,
  palmWidth: 23,
  neckLength: 92,
  neckRadius: 3.0,
  neckRise: 22,
  handPitchDeg: -28,
  fingerLength: 15,
  fingerCurl: 7.5,
};

export const controls = {
  handThickness: { label: "Hand Thickness", min: 3, max: 9, step: 0.1, default: 4.8 },
  palmLength: { label: "Palm Length", min: 18, max: 40, step: 0.5, default: 28 },
  palmWidth: { label: "Palm Width", min: 14, max: 34, step: 0.5, default: 23 },
  fingerLength: { label: "Finger Length", min: 8, max: 24, step: 0.5, default: 15 },
  fingerCurl: { label: "Finger Curl", min: 3, max: 16, step: 0.2, default: 7.5 },
  neckLength: { label: "Neck Length", min: 55, max: 160, step: 1, default: 92 },
  neckRadius: { label: "Neck Radius", min: 1.8, max: 5.2, step: 0.1, default: 3.0 },
  neckRise: { label: "Neck Rise", min: 0, max: 45, step: 1, default: 22 },
  handPitchDeg: { label: "Hand Pitch", min: -50, max: 8, step: 1, default: -28 },
};

const q = (sketch, end, control) => sketch.bezierCurveTo(end, [control]);

const makePalm = (cfg) => {
  const wristHalf = cfg.palmWidth * 0.16;
  const hp = cfg.palmWidth * 0.5;
  const px = cfg.palmLength;

  let s = draw([0, -wristHalf]);
  s = q(s, [px * 0.35, -hp * 0.63], [px * 0.08, -hp * 0.72]);
  s = q(s, [px * 0.74, -hp * 0.48], [px * 0.56, -hp * 0.6]);
  s = q(s, [px * 0.95, -hp * 0.18], [px * 0.86, -hp * 0.32]);
  s = q(s, [px * 0.92, hp * 0.2], [px * 1.02, hp * 0.02]);
  s = q(s, [px * 0.62, hp * 0.5], [px * 0.82, hp * 0.42]);
  s = q(s, [px * 0.2, hp * 0.56], [px * 0.42, hp * 0.6]);
  s = q(s, [0, wristHalf], [px * 0.05, hp * 0.45]);
  s = q(s, [0, -wristHalf], [-2, 0]);

  return s.close().sketchOnPlane("XY").extrude(cfg.handThickness);
};

const makeFinger = (cfg, def) => {
  const rootX = cfg.palmLength * 0.82;
  const rootY = def.y * (cfg.palmWidth * 0.5);
  const length = cfg.fingerLength * def.lengthScale;
  const curl = cfg.fingerCurl * def.curlScale;
  const radius = cfg.handThickness * def.radiusScale;

  const path = sketchParametricFunction(
    (t) => {
      const x = length * t;
      const z = -curl * t * t;
      return [x, z];
    },
    {
      plane: "XZ",
      origin: [rootX, rootY, cfg.handThickness * 0.75],
    },
    { pointsCount: 56 }
  );

  const profile = (plane, origin) =>
    new Sketcher(plane, origin)
      .movePointerTo([-radius, -radius * 0.75])
      .hLine(radius * 2)
      .vLine(radius * 1.5)
      .hLine(-radius * 2)
      .close();

  return path
    .sweepSketch(profile)
    .rotate(def.splayDeg, [rootX, rootY, cfg.handThickness * 0.75], [0, 0, 1]);
};

const makeNeck = (cfg) => {
  const path = sketchParametricFunction(
    (t) => {
      const x = -cfg.neckLength * (1 - t);
      const u = 1 - t;
      const z = -cfg.neckRise * (u * u * (1.4 - 0.4 * u));
      return [x, z];
    },
    { plane: "XZ", origin: [0, 0, cfg.handThickness * 0.52] },
    { pointsCount: 80 }
  );

  const profile = (plane, origin) =>
    new Sketcher(plane, origin)
      .movePointerTo([-cfg.neckRadius, -cfg.neckRadius * 0.8])
      .hLine(cfg.neckRadius * 2)
      .vLine(cfg.neckRadius * 1.6)
      .hLine(-cfg.neckRadius * 2)
      .close();

  return path.sweepSketch(profile);
};

export default function buildMiniHandBackscratcher(params = {}) {
  const cfg = { ...defaultParams, ...params };

  const palm = makePalm(cfg).rotate(cfg.handPitchDeg, [0, 0, cfg.handThickness * 0.45], [0, 1, 0]);

  const fingerDefs = [
    { y: -0.33, lengthScale: 0.74, curlScale: 0.9, radiusScale: 0.14, splayDeg: -12 },
    { y: -0.17, lengthScale: 0.93, curlScale: 1.0, radiusScale: 0.15, splayDeg: -5 },
    { y: 0.0, lengthScale: 1.0, curlScale: 1.05, radiusScale: 0.155, splayDeg: 0 },
    { y: 0.17, lengthScale: 0.95, curlScale: 1.0, radiusScale: 0.15, splayDeg: 5 },
    { y: 0.32, lengthScale: 0.84, curlScale: 0.9, radiusScale: 0.14, splayDeg: 11 },
  ];

  const fingers = fingerDefs.map((f) =>
    makeFinger(cfg, f).rotate(cfg.handPitchDeg, [0, 0, cfg.handThickness * 0.45], [0, 1, 0])
  );

  const neck = makeNeck(cfg);

  return makeCompound([neck, palm, ...fingers]);
}
