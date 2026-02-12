const modelModuleLoaders = import.meta.glob("./**/*.{js,ts}");

const toSlug = (path) =>
  path.replace(/^.\//, "").replace(/\.(js|ts)$/, "");

const normaliseModule = (slug, module) => {
  const build = module.build || module.default;
  if (typeof build !== "function") {
    throw new Error(
      `Model "${slug}" should export a build function or default export`
    );
  }

  return {
    slug,
    build,
    controls: module.controls || {},
    defaultParams: module.defaultParams || module.DEFAULT_CONFIG,
    metadata: module.metadata || {},
  };
};

const modelEntries = Object.entries(modelModuleLoaders)
  .filter(([path]) => !/\/registry\.(js|ts)$/.test(path))
  .map(([path, load]) => ({
    slug: toSlug(path),
    load,
  }))
  .sort((a, b) => a.slug.localeCompare(b.slug));

const modelMap = new Map(modelEntries.map((entry) => [entry.slug, entry]));
const modelCache = new Map();

export const defaultModelSlug = modelEntries[0]?.slug;

export const listModels = () => modelEntries.map(({ slug }) => ({ slug }));

export const hasModel = (slug) => modelMap.has(slug);

export const getModel = async (slug) => {
  if (!hasModel(slug)) return undefined;
  if (modelCache.has(slug)) return modelCache.get(slug);

  const loader = modelMap.get(slug).load;
  const modelPromise = loader().then((module) => normaliseModule(slug, module));
  modelCache.set(slug, modelPromise);
  return modelPromise;
};
