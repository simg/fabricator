import { drawCircle } from "replicad";

export const metadata = {
  name: "Hollow cylinder",
  description: "Tube with adjustable radius, height and wall thickness.",
};

export const controls = {
  radius: {
    label: "Outer radius",
    min: 10,
    max: 60,
    step: 1,
    default: 30,
  },
  height: {
    label: "Height",
    min: 10,
    max: 80,
    step: 1,
    default: 40,
  },
  wall: {
    label: "Wall thickness",
    min: 2,
    max: 15,
    step: 1,
    default: 5,
  },
};

export function build({
  radius = controls.radius.default,
  height = controls.height.default,
  wall = controls.wall.default,
} = {}) {
  const safeWall = Math.min(wall, radius - 1);
  const outer = drawCircle(radius).sketchOnPlane().extrude(height);
  const inner = drawCircle(Math.max(radius - safeWall, 1))
    .sketchOnPlane()
    .extrude(height);

  return outer.cut(inner);
}
