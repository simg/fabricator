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

const buildModel = (slug, params = {}) => {
  const model = getModel(slug);
  if (!model) throw new Error(`Model "${slug}" is not available`);
  return model.build(params);
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
