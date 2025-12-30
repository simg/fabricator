# A sample app built with replicad!

This is a lightweight Replicad model viewer built with React, Vite, and @react-three/fiber. Drop or add models under `src/models` (including nested folders and TypeScript files), then browse them at `/model/<slug>`. The viewer generates meshes in a web worker, supports adjustable model controls, optional grid display, and lets you export STL or STEP versions of the currently rendered model.

## How to run locally

```sh
git clone git@github.com:simg/fabricator.git
pnpm install
pnpm start
```
