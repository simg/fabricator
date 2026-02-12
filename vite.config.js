import { defineConfig } from "vite";
import reactPlugin from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [reactPlugin()],
  base: command === "build" ? "/fabricator/" : "/",
  worker: {
    format: "es",
  },
  build: {
    outDir: "dist",
  },
  server: {
    port: 4444,
  },
}));
