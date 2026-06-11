# hairball

> npm: `@joburatti/hairball` (not yet published)

Interactive, on-device viewer for large Graphviz `.dot` files — built for the output of
django-extensions' `graph_models`, where the model graph is too big and too connected for a
static SVG export.

Everything runs in the browser: no backend, no upload. Works on any desktop OS.

## Features

- **WebGL rendering** (sigma.js) — stays smooth at thousands of nodes
- **ForceAtlas2 layout in a web worker** — the graph organizes itself live without freezing the UI; auto-stops on a time budget, restartable from the toolbar; "Tidy" resolves overlaps
- **Search** (`/` or `Ctrl+K`) with ranked matches and a camera flight to the picked model
- **Click a node** to highlight it and its neighbors, dim everything else, and open the inspector
- **Inspector sidebar** — model fields (PK/relation bold, blank gray, abstract italic, exactly as graph_models encodes them) plus incoming/outgoing relations with FK / M2M / 1:1 / inheritance / generic badges; click a relation to walk the graph
- **Per-app filtering** with the cluster colors, `only`/`all`/`none` shortcuts
- Drag-and-drop any `.dot` / `.gv` file; works with plain (non-Django) dot files too, minus field details

## Usage

```sh
npm install
npm run dev          # development server
```

### Portable single-file build

```sh
npm run build:single
```

emits a self-contained `dist/index.html` (~0.5 MB) that you can copy anywhere and open
directly via `file://` — no server needed.

### Generating a graph from Django

```sh
pip install django-extensions pydotplus
python manage.py graph_models -a -g > models.dot
```

(`-g` groups models by app, which drives coloring and filters here.)

### Synthetic test graphs

```sh
node scripts/generate-sample.mjs --apps 25 --models 1500 --seed 42 > samples/big.dot
```

## Development

```sh
npm test             # parser/pipeline unit tests (vitest)
npm run build        # regular multi-file build
node scripts/smoke-test.mjs   # headless browser end-to-end check (needs npx playwright install chromium)
```

Layout engine notes: graphs over 1000 nodes automatically use Barnes-Hut approximation;
the `linLog` toggle produces tighter clusters on dense graphs at the cost of slower
convergence.
