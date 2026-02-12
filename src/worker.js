import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import opencascadeWasm from "replicad-opencascadejs/src/replicad_single.wasm?url";
import { setOC } from "replicad";
import { expose } from "comlink";
import { getModel, listModels } from "./models/registry";

// This is the logic to load the web assembly code into replicad
let loaded = false;
const init = async () => {
  if (loaded) return Promise.resolve(true);

  const OC = await opencascade({
    locateFile: () => opencascadeWasm,
  });

  loaded = true;
  setOC(OC);

  return true;
};
const started = init();

const normaliseShape = (shape) => {
  if (Array.isArray(shape)) {
    const solids = shape.filter(Boolean);
    if (solids.length === 0) {
      throw new Error("Model returned no geometry");
    }
    return solids.reduce((acc, solid) => {
      if (!acc) return solid;
      const fused = acc.fuse(solid);
      return fused || acc;
    }, null);
  }
  return shape;
};

const buildModel = (slug, params = {}) => {
  const model = getModel(slug);
  if (!model) throw new Error(`Model "${slug}" is not available`);
  const fn = model.build;

  // Support both (params) and (api, params) signatures
  const built =
    fn.length >= 2 ? fn(undefined, params) : fn(params);

  const shape = normaliseShape(built);
  if (!shape) throw new Error("Model did not return geometry");
  return shape;
};

const serialiseModels = () =>
  listModels().map((model) => ({
    slug: model.slug,
    controls: model.controls,
    metadata: model.metadata,
  }));

function createBlob(slug, params, format = "stl") {
  // note that you might want to do some caching for more complex models
  return started.then(() => {
    const shape = buildModel(slug, params);
    if (format === "step") return shape.blobSTEP();
    return shape.blobSTL();
  });
}

function createMesh(slug, params) {
  return started.then(() => {
    const shape = buildModel(slug, params);
    // This is how you get the data structure that the replica-three-helper
    // can synchronise with three BufferGeometry
    return {
      faces: shape.mesh(),
      edges: shape.meshEdges(),
    };
  });
}

// comlink is great to expose your functions within the worker as a simple API
// to your app.
expose({ createBlob, createMesh, serialiseModels });
