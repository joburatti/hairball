# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**hairball** (npm: `@joburatti/hairball` — intentionally unpublished; the bare name is taken): a browser-only viewer for large Graphviz `.dot` files, built for django-extensions' `graph_models` output (Django model graphs, 100s–1000s of nodes). No backend: parsing, layout, and rendering all happen on-device. The distributable is a single self-contained HTML file that must keep working when opened via `file://`.

## Commands

```sh
npm run dev            # dev server
npm test               # vitest unit tests (parser pipeline)
npx vitest run src/dot/dot.test.ts -t 'merges'   # single test by file/name
npm run lint           # eslint
npm run build          # type-check (tsc -b) + regular build
npm run build:single   # type-check + single-file dist/index.html (vite mode "single")
node scripts/smoke-test.mjs        # headless-browser E2E against dist/index.html (build:single first)
npm run gen:sample -- --apps 25 --models 1500 --seed 42 > samples/big.dot   # synthetic graph_models fixture
```

The smoke test needs Playwright's Chromium (`npx playwright install chromium`); it launches with `channel: 'chromium'` (full build, not the headless shell).

## Architecture

Data flow: file text → `src/dot/parseDot.ts` (dotparser AST walk, tracks cluster context) → `src/dot/buildGraph.ts` (graphology `MultiGraph` with typed attributes from `src/types.ts`) → `src/layout/seed.ts` (app-sector circular seed) → stored in the zustand store → rendered by sigma.js (WebGL).

- **State hub**: `src/state/store.ts` (zustand). Everything flows through it: file loading, selection/hover, app filters, layout status. Sigma event handlers and React components both read/write it; non-React code uses `useStore.getState()` / `useStore.subscribe`.
- **Rendering**: `src/sigma/GraphView.tsx` owns the one Sigma instance. Highlight/dim/filter is done entirely through sigma node/edge reducers (`src/sigma/reducers.ts`) rebuilt from store state on each relevant change, then `sigma.refresh({ skipIndexation: true })` — node attributes are never mutated for display state. Camera moves live in `src/sigma/camera.ts` (module-level active-Sigma registry, separate file so GraphView only exports a component for fast refresh).
- **Layout**: `src/layout/useForceAtlas2.ts` owns the FA2 worker supervisor lifecycle. It must `kill()` before the graph is replaced (the supervisor auto-respawns on graph mutation and would orphan workers). Settings in `src/layout/fa2Settings.ts`; Barnes-Hut kicks in above 1000 nodes; auto-stop budget `min(20s, 50ms × order)`.

## Constraints that aren't obvious from the code

- **file:// portability is a hard requirement.** `graphology-layout-forceatlas2/worker` builds its worker from a stringified function via Blob URL — no separate chunk — which is why it survives `vite-plugin-singlefile`. Don't introduce anything that emits separate worker/wasm assets into the single build; verify with the smoke test, which specifically checks the worker animates under `file://`.
- **Parser choice is deliberate**: `graph_models` emits edge statements with two consecutive attribute lists (`[label="..."] [arrowhead=...]`), which is legal DOT. `@ts-graphviz/ast` rejects it; `dotparser` merges them. There's a regression test for this in `src/dot/dot.test.ts`.
- **graph_models format quirks** handled in the pipeline (and exercised by `scripts/generate-sample.mjs`): nodes are re-declared as header-only stubs outside their cluster (`buildGraph` merges, preferring richer label + non-null cluster); relation kinds are fingerprinted from arrowhead/arrowtail/style combos in `src/dot/edgeKind.ts`; node field flags come from HTML label markup (`<B>` = PK/relation, `<I>` = abstract, gray font = blank) parsed with `DOMParser` in `src/dot/htmlLabel.ts`.
- **Product decisions already made with the user** (don't relitigate): force-directed layout over Graphviz/WASM hierarchical dot (scale beats fidelity), model fields shown in the sidebar rather than rendered inside nodes.
- Filter-hidden nodes intentionally stay in the layout simulation so toggling apps doesn't shift positions.
