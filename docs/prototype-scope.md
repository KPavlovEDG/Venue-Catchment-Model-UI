# Prototype scope and requirements mapping

## Source priority

1. `UI UX Specifications: Performance Gap Analysis Dashboard` (version 0.1) - source of truth for UI behavior and grid schema.
2. `Venue-Catchment Model - WIP` (June 2026) - model rationale, user journeys, axes, data dictionary, and recommendation context.
3. `Grid View.html` and `Map View.html` - early visual references only; superseded where they conflict with the UI specification or model presentation.

The source files are not copied into this repository because they may contain internal material. This document records the implementation decisions needed by the prototype.

## Implemented requirements

| Requirement | Prototype implementation |
| --- | --- |
| Right-side venue profile drawer | Expanded 760 px drawer with an independent daypart selector, linked profile analysis, competitor detail popups, and operator comments |
| Excel-like header filters | Text search, unique-value selection, and numeric min/max filters in every eligible leaf header |
| Lean left command deck | Exactly four modules: geography, daypart, metric groups, and custom cohorts |
| Top global action bar | Product identity, working Map/Grid switcher, sync status, export, and recalculation |
| Four-tier grid schema | Category -> axis/subject -> segment -> field metric |
| 50 venues | Deterministic mock generator with realistic Australian venue, catchment, financial, asset, and loyalty values |
| Eight-axis comparison | Customer, affluence, occasion, food, beverage, gaming, accommodation, and event/function |
| 35 proportional attributes | Venue/catchment mixes and attribute-level competition data available in the column tree |
| Venue profile charts | Interactive SVG radar with multi-axis selection linked to a 35-attribute venue/catchment deep dive |
| Financial audit | EBIT, EBITDA growth, ROI, funds employed, and trading density |
| Automated recommendation | Two to five compact from/to attribute shifts and current/recommended competitor sets with overlap details |
| Custom selection workflow | Multi-row selection with named cohorts persisted to localStorage |
| Export | All model fields for the current filtered venue set exported as CSV |
| Operator context | Current/recommended positioning comments, author and update date persisted in-browser and reflected in the grid |
| Underlying metric traceability | Axis references in metric headers plus a left-panel axis filter |
| Spatial discovery | Leaflet map with macro/axis gap lenses, opportunity bands, realistic venue coordinates, catchment radius, competitor pressure, and attribute-level venue summaries |

## Deliberate prototype boundaries

- `Recalculate Model` simulates a FastAPI job and completion state.
- Cohorts are local to the browser; no user or server ownership exists yet.
- Data definitions marked TBD in source material are represented by the closest available catchment context fields and should be reconciled with the final backend data dictionary.
- No AG Grid Enterprise dependency or licence is required. TanStack Table provides the headless grid model and the UI implements the specified interactions.

## Expected backend boundaries

The first production integration should expose endpoints equivalent to:

```text
GET  /venues?regions=&daypart=
GET  /venues/{venueId}?daypart=
POST /model/recalculate
GET  /model/jobs/{jobId}
GET  /cohorts
POST /cohorts
GET  /exports/venues?format=csv
```

The API should return stable field identifiers matching `VenueRecord`, not UI-formatted strings. Currency, percentage, status, and date formatting remain front-end responsibilities.
