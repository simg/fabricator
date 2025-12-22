import { drawRoundedRectangle } from "replicad";

export const metadata = {
  name: "Rounded box",
  description: "Shell made from a rounded rectangle with adjustable wall thickness.",
};

export const controls = {
  thickness: {
    label: "Thickness",
    min: 1,
    max: 10,
    step: 0.5,
    default: 5,
  },
};

export function build({ thickness = controls.thickness.default } = {}) {
  return drawRoundedRectangle(30, 50)
    .sketchOnPlane()
    .extrude(20)
    .shell(thickness, (face) => face.inPlane("XY", 20));
}
