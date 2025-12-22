const modelModules = import.meta.glob("./**/*.{js,ts}", { eager: true });

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
    metadata: module.metadata || {},
  };
};

const models = Object.entries(modelModules).reduce((acc, [path, module]) => {
  if (/\/registry\.(js|ts)$/.test(path)) return acc;

  const slug = path
    .replace(/^.\//, "")
    .replace(/\.(js|ts)$/, "");

  acc.push(normaliseModule(slug, module));
  return acc;
}, []);

const modelMap = new Map(models.map((model) => [model.slug, model]));

export const defaultModelSlug = models[0]?.slug;

export const listModels = () => models;

export const getModel = (slug) => modelMap.get(slug);
