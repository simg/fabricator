# Fabricator

This is my personal lightweight Replicad model viewer built with React, Vite, and @react-three/fiber. Drop or add models under `src/models` (including nested folders and TypeScript files), then browse them at `/model/<slug>`. The viewer generates meshes in a web worker, supports adjustable model controls, optional grid display, and lets you export STL or STEP versions of the currently rendered model.

Built with Replicad at its core, this project can also be used as a tool for Agentic Parametric Fabrication: an early version of an AI fabricator where autonomous agents can generate, iterate, and validate CAD ideas through code before manufacturing.

Try asking your Agent to design you a 3d printed model from a sketch or a photograph!

## How to run locally

```sh
git clone git@github.com:simg/fabricator.git
pnpm install
pnpm start
```
