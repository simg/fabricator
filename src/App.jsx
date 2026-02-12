import React, { useEffect, useMemo, useState } from "react";
import FileSaver from "file-saver";
import { wrap } from "comlink";
import { Link, Route, Routes, useLocation, useParams } from "react-router-dom";

import ThreeContext from "./ThreeContext.jsx";
import ReplicadMesh from "./ReplicadMesh.jsx";
import { getModel, listModels } from "./models/registry";

import cadWorker from "./worker.js?worker";
const cad = wrap(new cadWorker());

const models = listModels();

const buildDefaultControls = (controls = {}) =>
  Object.entries(controls).reduce(
    (acc, [key, definition]) => ({
      ...acc,
      [key]: definition.default ?? 0,
    }),
    {}
  );

const cloneParams = (params = {}) => JSON.parse(JSON.stringify(params || {}));

function ModelControls({ controls, values, onChange }) {
  if (!controls || Object.keys(controls).length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "0.35rem",
      }}
    >
      {Object.entries(controls).map(([key, definition]) => (
        <label
          key={key}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 110px",
            gap: "0.35rem",
            alignItems: "center",
            padding: "0.25rem 0.35rem",
            border: "1px solid #e0e5ea",
            borderRadius: "0.4rem",
            background: "#f9fbfd",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
            {definition.label || key}
          </span>
          <input
            type="number"
            min={definition.min}
            max={definition.max}
            step={definition.step || 1}
            value={values[key]}
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontSize: "0.85rem",
              padding: "0.3rem 0.35rem",
            }}
            onChange={(event) => {
              const nextValue = Number(event.target.value);
              const clamped = Math.min(
                definition.max ?? nextValue,
                Math.max(definition.min ?? nextValue, nextValue)
              );
              onChange(key, clamped);
            }}
          />
        </label>
      ))}
    </div>
  );
}

function DefaultParamsForm({ params, onChange }) {
  const fields = flattenParams(params);

  if (!fields.length)
    return (
      <div style={{ color: "#6b6b6b", fontSize: "0.95rem" }}>
        No configurable parameters exposed.
      </div>
    );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "0.35rem",
      }}
    >
      {fields.map(({ path, value }) => {
        const label = path.join(" / ");
        const isBoolean = typeof value === "boolean";
        return (
          <label
            key={label}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 110px",
              gap: "0.35rem",
              alignItems: "center",
              padding: "0.25rem 0.35rem",
              border: "1px solid #e0e5ea",
              borderRadius: "0.4rem",
              background: "#f9fbfd",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
              {label}
            </span>
            {isBoolean ? (
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(event) => onChange(path, event.target.checked)}
              />
            ) : (
              <input
                type="number"
                value={value ?? 0}
                step="0.1"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "0.3rem 0.35rem",
                  fontSize: "0.85rem",
                }}
                onChange={(event) => onChange(path, Number(event.target.value))}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

const splitPath = (value = "") => value.split("/").filter(Boolean);

const encodeSegments = (segments = []) =>
  segments.map((segment) => encodeURIComponent(segment)).join("/");

const getFolderContents = (folderPath) => {
  const currentSegments = splitPath(folderPath);
  const folders = new Set();
  const modelEntries = [];

  models.forEach((model) => {
    const slugSegments = splitPath(model.slug);
    if (slugSegments.length < currentSegments.length) return;
    const matches = currentSegments.every(
      (segment, idx) => slugSegments[idx] === segment
    );
    if (!matches) return;

    const remaining = slugSegments.slice(currentSegments.length);
    if (remaining.length === 0) return;

    if (remaining.length === 1) {
      modelEntries.push({
        slug: model.slug,
        label: model.metadata?.name || remaining[0],
        description: model.metadata?.description,
      });
      return;
    }

    folders.add(remaining[0]);
  });

  return {
    folders: Array.from(folders).sort(),
    models: modelEntries.sort((a, b) => a.label.localeCompare(b.label)),
  };
};

const flattenParams = (params, prefix = []) =>
  Object.entries(params || {}).flatMap(([key, value]) => {
    const path = [...prefix, key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return flattenParams(value, path);
    }
    return [{ path, value }];
  });

const updateParamAtPath = (params, path, nextValue) => {
  if (path.length === 0) return nextValue;
  const [head, ...rest] = path;
  return {
    ...params,
    [head]:
      rest.length === 0
        ? nextValue
        : updateParamAtPath(params?.[head] || {}, rest, nextValue),
  };
};

function ModelViewer() {
  const { "*": modelSlugParam } = useParams();
  const modelSlug = modelSlugParam ? decodeURIComponent(modelSlugParam) : "";
  const pathSegments = splitPath(modelSlug);
  const breadcrumb = [
    { label: "Models", path: "/" },
    ...pathSegments.map((segment, idx) => {
      const partial = encodeSegments(pathSegments.slice(0, idx + 1));
      return {
        label: segment,
        path: partial ? `/model/${partial}` : "/",
      };
    }),
  ];
  const activeModel = useMemo(() => getModel(modelSlug), [modelSlug]);
  const usesControls =
    activeModel?.controls && Object.keys(activeModel.controls).length > 0;
  const hasDefaultParams =
    activeModel?.defaultParams &&
    Object.keys(activeModel.defaultParams).length > 0;
  const buildInitialParams = () => {
    if (usesControls) return buildDefaultControls(activeModel.controls);
    if (hasDefaultParams) return cloneParams(activeModel.defaultParams);
    return {};
  };
  const [appliedParams, setAppliedParams] = useState(() =>
    buildInitialParams()
  );
  const [draftParams, setDraftParams] = useState(() => buildInitialParams());
  const [mesh, setMesh] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [configOpen, setConfigOpen] = useState(true);

  useEffect(() => {
    const initial = buildInitialParams();
    setAppliedParams(initial);
    setDraftParams(initial);
    setConfigOpen(true);
  }, [activeModel, modelSlug]);

  useEffect(() => {
    if (!activeModel) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setMesh(null);

    cad
      .createMesh(modelSlug, appliedParams)
      .then((m) => {
        if (!cancelled) setMesh(m);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeModel, modelSlug, appliedParams]);

  const downloadModel = async (format = "stl") => {
    if (!activeModel) return;
    const blob = await cad.createBlob(modelSlug, appliedParams, format);
    const extension = format === "step" ? "step" : "stl";
    const safeSlug = modelSlug.replace(/[\\/]+/g, "-") || "model";
    FileSaver.saveAs(blob, `${safeSlug}.${extension}`);
  };

  const appliedKey = JSON.stringify(appliedParams);
  const draftKey = JSON.stringify(draftParams);
  const isDirty = appliedKey !== draftKey;

  if (!models.length) return <p>No models found in /src/models.</p>;
  if (!activeModel)
    return (
      <div style={{ padding: "1rem 0" }}>
        <h2 style={{ margin: "0 0 0.5rem" }}>404: Model not found</h2>
        <p style={{ margin: 0, color: "#6b6b6b" }}>
          No model registered for "<code>{modelSlug}</code>".
        </p>
      </div>
    );

  return (
    <div
      key={modelSlug}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        height: "100%",
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          {breadcrumb.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 ? <span style={{ color: "#8a8a8a" }}>/</span> : null}
              {idx === breadcrumb.length - 1 ? (
                <span style={{ fontWeight: 700 }}>{crumb.label}</span>
              ) : (
                <Link to={crumb.path}>{crumb.label}</Link>
              )}
            </React.Fragment>
          ))}
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: "0.4rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.9rem",
            }}
          >
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(event) => setShowGrid(event.target.checked)}
            />
            Show grid
          </label>
          <button
            onClick={() => downloadModel("stl")}
            disabled={loading}
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
          >
            Download STL
          </button>
          <button
            onClick={() => downloadModel("step")}
            disabled={loading}
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
          >
            Download STEP
          </button>
          <button
            onClick={() => {
              const initial = buildInitialParams();
              setAppliedParams(initial);
              setDraftParams(initial);
            }}
            disabled={loading}
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
          >
            Reset controls
          </button>
          {usesControls || hasDefaultParams ? (
            <button
              onClick={() => setConfigOpen((open) => !open)}
              style={{
                padding: "0.25rem 0.5rem",
                fontSize: "0.85rem",
              }}
            >
              {configOpen ? "Hide config" : "Show config"}
            </button>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            position: "relative",
            borderRadius: "0.75rem",
            border: "1px solid #e1e1e1",
            overflow: "hidden",
            background: "#f5f5f5",
          }}
        >
          {error && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "tomato",
                padding: "1rem",
                textAlign: "center",
              }}
            >
              Failed to generate model: {error.message}
            </div>
          )}
          {loading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25em",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.65), rgba(245,245,245,0.65))",
              }}
            >
              Loading...
            </div>
          )}
          {!loading && mesh ? (
            <ThreeContext showGrid={showGrid}>
              <ReplicadMesh edges={mesh.edges} faces={mesh.faces} />
            </ThreeContext>
          ) : null}
        </div>

        {configOpen && (usesControls || hasDefaultParams) ? (
          <aside
            style={{
              flex: "0 0 320px",
              maxWidth: "320px",
              padding: "0.5rem",
              border: "1px solid #d7d7d7",
              borderRadius: "0.75rem",
              background: "#f7f9fb",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              alignSelf: "stretch",
            }}
          >
            <button
              onClick={() => setAppliedParams(cloneParams(draftParams))}
              disabled={!isDirty || loading}
              style={{
                width: "100%",
                padding: "0.35rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                background: "#8fa9bb",
                color: "#fff",
                border: "1px solid #7d99ab",
                borderRadius: "0.35rem",
                opacity: !isDirty || loading ? 0.65 : 1,
              }}
            >
              Apply params
            </button>
            {usesControls ? (
              <ModelControls
                controls={activeModel.controls}
                values={draftParams}
                onChange={(key, value) =>
                  setDraftParams((current) => ({ ...current, [key]: value }))
                }
              />
            ) : null}
            {!usesControls && hasDefaultParams ? (
              <DefaultParamsForm
                params={draftParams}
                onChange={(path, value) =>
                  setDraftParams((current) =>
                    updateParamAtPath(current, path, value)
                  )
                }
              />
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function ModelBrowser() {
  const { "*": folderParam } = useParams();
  const folderPath = folderParam ? decodeURIComponent(folderParam) : "";
  const pathSegments = splitPath(folderPath);
  const { folders, models: modelEntries } = useMemo(
    () => getFolderContents(folderPath),
    [folderPath]
  );

  const breadcrumb = [
    { label: "Models", path: "/" },
    ...pathSegments.map((segment, idx) => {
      const partial = encodeSegments(pathSegments.slice(0, idx + 1));
      return {
        label: segment,
        path: partial ? `/browse/${partial}` : "/",
      };
    }),
  ];

  const folderHref = (segment) => {
    const next = encodeSegments([...pathSegments, segment]);
    return next ? `/browse/${next}` : "/";
  };

  const modelHref = (slug) => `/model/${encodeSegments(splitPath(slug)) || ""}`;

  const hasContents = folders.length > 0 || modelEntries.length > 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        height: "100%",
        minHeight: 0,
      }}
    >
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {breadcrumb.map((crumb, idx) => (
          <React.Fragment key={crumb.path}>
            {idx > 0 ? <span style={{ color: "#8a8a8a" }}>/</span> : null}
            {idx === breadcrumb.length - 1 ? (
              <span style={{ fontWeight: 700 }}>{crumb.label}</span>
            ) : (
              <Link to={crumb.path}>{crumb.label}</Link>
            )}
          </React.Fragment>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {folders.map((folder) => (
          <Link
            key={folder}
            to={folderHref(folder)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 0.85rem",
              border: "1px solid #e1e1e1",
              borderRadius: "0.65rem",
              background: "#fff",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <span aria-hidden="true">[DIR]</span>
            <div>
              <div style={{ fontWeight: 700 }}>{folder}</div>
              <div style={{ color: "#6b6b6b", fontSize: "0.9rem" }}>Folder</div>
            </div>
          </Link>
        ))}

        {modelEntries.map((model) => (
          <Link
            key={model.slug}
            to={modelHref(model.slug)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 0.85rem",
              border: "1px solid #e1e1e1",
              borderRadius: "0.65rem",
              background: "#fff",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <span aria-hidden="true">[M]</span>
            <div>
              <div style={{ fontWeight: 700 }}>{model.label}</div>
              {model.description ? (
                <div style={{ color: "#6b6b6b", fontSize: "0.9rem" }}>
                  {model.description}
                </div>
              ) : null}
            </div>
          </Link>
        ))}
      </div>

      {!hasContents ? (
        <div style={{ color: "#6b6b6b" }}>No folders or models here yet.</div>
      ) : null}
    </div>
  );
}

export default function ReplicadApp() {
  return (
    <main
      style={{
        padding: "1rem",
        height: "100vh",
        maxWidth: "100%",
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        background: "#f0f2f5",
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Routes>
          <Route path="/" element={<ModelBrowser />} />
          <Route path="/browse/*" element={<ModelBrowser />} />
          <Route path="/model/*" element={<ModelViewerWrapper />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </main>
  );
}

function ModelViewerWrapper() {
  const location = useLocation();
  return <ModelViewer key={location.pathname} />;
}

function NotFoundPage() {
  return (
    <div style={{ padding: "1rem 0" }}>
      <h2 style={{ margin: "0 0 0.5rem" }}>404: Page not found</h2>
      <p style={{ margin: 0, color: "#6b6b6b" }}>
        The page you are looking for does not exist.
      </p>
    </div>
  );
}
