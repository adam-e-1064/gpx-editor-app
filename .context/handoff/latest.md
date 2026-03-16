# Session Handoff — 2026-03-16

## What Was Done
- Implemented OSRM road-following routing for route editing
- Created `js/routing.js` — OSRM integration module
- Updated `components/gpx-map.js` — anchor-based editing model
- Updated `js/app.js` — async routing integration for move/add/remove
- Fixed event format consistency bug in `disableSplitMode()`
- Fixed anchor state preservation in `updateFromRouting()`
- Added coordinate validation in routing module
- Removed dead code (`updatePointInRoute`, `insertPointInRoute`, `removePointFromRoute`)

## Current State
- Phases 1-3 fully implemented
- Route editing now recalculates road-following paths via OSRM
- Edit markers are anchor points; dragging/adding/removing triggers OSRM routing
- Elevation data preserved via nearest-point interpolation
- Fallback to straight lines when OSRM unavailable
- All previous features intact (import, map, stats, chart, tile switching, trim, merge, split, export, undo, localStorage)

### Files
- `index.html` — page structure, Leaflet CDN
- `css/styles.css`, `css/components.css`, `css/responsive.css`
- `js/app.js` — orchestrator, state, event wiring, async routing integration
- `js/gpx-parser.js` — GPX XML → RouteData
- `js/gpx-export.js` — RouteData → GPX XML
- `js/geo-utils.js` — Haversine distance, bearing
- `js/route-utils.js` — reverse, trim, merge, split, metadata
- `js/routing.js` — OSRM road routing (NEW)
- `js/storage.js` — localStorage persistence
- `components/file-import.js` — drag & drop GPX import
- `components/gpx-map.js` — Leaflet map with anchor-based editing
- `components/route-stats.js` — stats display
- `components/elevation-chart.js` — Canvas elevation chart
- `components/tile-switcher.js` — map layer selector
- `components/route-editor.js` — edit controls UI

## Open Questions
- OSRM demo server has no SLA — consider self-hosting or paid API for production
- Race condition with rapid edits (multiple OSRM calls in flight) — not yet addressed
- No user-visible feedback when routing fails (only console log)

## Next Steps
- Add debouncing or request cancellation for rapid edit operations
- Add user-visible toast notifications for routing errors
- Consider caching OSRM responses for repeated segments
- Phase 4 remaining: polish, GitHub Pages deploy
