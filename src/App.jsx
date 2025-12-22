import React, { useEffect, useMemo, useState } from "react";
import FileSaver from "file-saver";
import { wrap } from "comlink";
import { Navigate, Route, Routes, useParams } from "react-router-dom";

import ThreeContext from "./ThreeContext.jsx";
import ReplicadMesh from "./ReplicadMesh.jsx";
import { defaultModelSlug, getModel, listModels } from "./models/registry";

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

function ModelControls({ controls, values, onChange }) {
  if (!controls || Object.keys(controls).length === 0) return null;

  return (
    <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
      {Object.entries(controls).map(([key, definition]) => (
        <label key={key} style={{ display: "grid", gap: "0.35rem" }}>
          <span style={{ fontWeight: 600 }}>{definition.label || key}</span>
          <input
            type="number"
            min={definition.min}
            max={definition.max}
            step={definition.step || 1}
            value={values[key]}
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

function ModelViewer() {
  const { "*": modelSlugParam } = useParams();
  const modelSlug = modelSlugParam ? decodeURIComponent(modelSlugParam) : "";
  const activeModel = useMemo(() => getModel(modelSlug), [modelSlug]);
  const [controls, setControls] = useState(() =>
    buildDefaultControls(activeModel?.controls)
  );
  const [mesh, setMesh] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const hasControls =
    activeModel?.controls && Object.keys(activeModel.controls).length > 0;

  useEffect(() => {
    setControls(buildDefaultControls(activeModel?.controls));
  }, [activeModel]);

  useEffect(() => {
    if (!activeModel) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setMesh(null);

    cad
      .createMesh(modelSlug, controls)
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
  }, [activeModel, modelSlug, controls]);

  const downloadModel = async (format = "stl") => {
    if (!activeModel) return;
    const blob = await cad.createBlob(modelSlug, controls, format);
    const extension = format === "step" ? "step" : "stl";
    const safeSlug = modelSlug.replace(/[\\/]+/g, "-") || "model";
    FileSaver.saveAs(blob, `${safeSlug}.${extension}`);
  };

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
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontWeight: 700 }}>
          {activeModel.metadata?.name || activeModel.slug}
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <label
            style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(event) => setShowGrid(event.target.checked)}
            />
            Show grid
          </label>
          <button onClick={() => downloadModel("stl")} disabled={loading}>
            Download STL
          </button>
          <button onClick={() => downloadModel("step")} disabled={loading}>
            Download STEP
          </button>
          <button
            onClick={() =>
              setControls(buildDefaultControls(activeModel?.controls))
            }
            disabled={loading}
          >
            Reset controls
          </button>
        </div>
      </div>

      {hasControls ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            border: "1px solid #e1e1e1",
            borderRadius: "0.75rem",
            background: "#fff",
          }}
        >
          <ModelControls
            controls={activeModel.controls}
            values={controls}
            onChange={(key, value) =>
              setControls((current) => ({ ...current, [key]: value }))
            }
          />
        </div>
      ) : null}

      <section
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
      </section>
    </div>
  );
}

export default function ReplicadApp() {
  return (
    <main
      style={{
        padding: "1rem",
        height: "100vh",
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
          <Route
            path="/"
            element={
              defaultModelSlug ? (
                <Navigate to={`/model/${defaultModelSlug}`} replace />
              ) : (
                <p>No models available.</p>
              )
            }
          />
          <Route path="/model/*" element={<ModelViewer />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </main>
  );
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
