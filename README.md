# Venue Catchment Model UI

Interactive front-end prototype for the ALH Hotels Venue Recommendation and Catchment Optimisation Engine.

The prototype turns a dense performance-gap dataset into an operational cohort-building workspace. It is intentionally front-end only: all 50 venues and model outputs are deterministic mock data, and backend actions are simulated behind UI-ready boundaries.

## Run locally

Prerequisites: Node.js 22+ and pnpm 11+.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

Published prototype: <https://kpavlovedg.github.io/Venue-Catchment-Model-UI/>

Quality checks:

```bash
pnpm lint
pnpm build
pnpm preview
```

## Prototype capabilities

- Grid View with a strict four-tier column hierarchy and 304 available leaf columns
- Interactive Map View with macro/axis gap lenses, priority filtering, catchment radii, and competitor-pressure overlays
- 50 realistic, deterministic venue records across 8 axes and 35 profile attributes
- Excel-style per-column search, value selection, and numeric range filters
- Multi-region geography filtering and five temporal daypart model slices
- Metric-group visibility tree for Basic Facts, profiles, gaps, recommendations, competition, proportional results, and axis-filtered underlying metrics
- Multi-row selection and browser-persisted custom cohorts
- CSV export of all model fields for the currently filtered venue set
- Simulated model recalculation state and sync timestamp
- 760 px venue profile drawer with an independent daypart, interactive radar, linked attribute deep dive, competitor details, financial audit, and persisted operator comments

FastAPI integration, server-side cohort persistence, authentication, and production data ingestion are outside this prototype scope.

## Project structure

```text
src/
  app/                    Application state and orchestration
  components/             Global shell and command deck
  data/                   Canonical axis schema and mock-data generator
  features/
    grid/                  Four-tier TanStack grid and column filters
    map/                   Leaflet opportunity map and venue summary panel
    venue-profile/         Venue drawer and SVG radar chart
  styles/                 Shared visual system
  types/                  Domain and TanStack metadata contracts
  utils/                  CSV export
docs/
  prototype-scope.md      Requirements mapping and integration boundaries
```

## Technical direction

React, Vite, and TypeScript provide the application shell. TanStack Table is used instead of AG Grid Enterprise to avoid a prototype-time licence dependency while retaining full control over nested headers, filtering, visibility, and selection. Leaflet powers the spatial view, while the profile chart remains native SVG.

The canonical domain schema in `src/data/schema.ts` drives both generated data and UI columns. A future FastAPI response should conform to the interfaces in `src/types/domain.ts`; replacing `generateVenues()` with a query layer should not require redesigning the grid or venue profile.

## GitHub Pages deployment

Every push to `main` runs `.github/workflows/deploy-pages.yml`, builds the Vite application, and publishes `dist` to GitHub Pages. The project-specific base path is configured in `vite.config.ts`.
