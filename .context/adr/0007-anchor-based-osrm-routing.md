# 0007 — Anchor-Based OSRM Routing for Route Editing

**Status**: Accepted  
**Date**: 2026-03-16

## Context

Route editing in MotoRoute had a critical UX issue: when users dragged waypoints to adjust the route, the map would create "spike" polylines instead of following roads. This happened because the editing model directly moved individual track points without recalculating the road path.

For a motorcycle route planning app, routes MUST follow actual roads. The spike behavior made editing nearly unusable — users couldn't meaningfully adjust routes without destroying the road-following path.

## Decision

Implemented anchor-based routing using the OSRM (Open Source Routing Machine) public API:

### 1. Routing Module (`js/routing.js`)
Created a new module with OSRM integration:
- `fetchRoute(waypoints)` — Get road-following path through waypoints
- `recalculateSegments(anchors)` — Recalculate full route through all anchor points
- `interpolateElevations(newPoints, originalPoints)` — Preserve elevation data when route changes
- Uses OSRM demo server: `https://router.project-osrm.org/route/v1/driving`
- Fallback to straight lines if OSRM fails (network issues, no road found)
- Deduplicates consecutive identical points

### 2. Anchor-Based Editing Model (`components/gpx-map.js`)
Changed editing from "move individual points" to "move anchor points with routing between them":

**New properties:**
- `this.anchors[]` — Array of `{lat, lng, originalIndex}` anchor objects
- Anchors are sampled from the route (max ~100, same as before)
- First and last points are ALWAYS anchors (can't be removed)

**Modified `enableEditing()`:**
- Builds anchors array from sampled route points
- Creates markers for anchors (not raw track points)
- Right-click to remove anchor (except first/last)

**Modified `startDragging()`:**
- Dispatches `waypoint-moved` with anchor context:
  ```js
  { anchorIndex, lat, lng, prevAnchor, nextAnchor }
  ```
- Still updates polyline during drag for immediate visual feedback

**Click-to-add waypoints:**
- Finds which segment (between which anchors) was clicked
- Dispatches `waypoint-added` with `{ afterAnchorIndex, lat, lng }`

**New methods:**
- `updateFromRouting(newPoints)` — Apply routing results without re-fitting bounds
- `getAnchors()` — Export anchors for app.js to use in routing

### 3. App.js Integration
Updated event handlers to use async routing:

**`route-edit-toggle` handler:**
- Stores `state.originalEditPoints = flattenAllPoints(state.route)` when entering edit mode
- Used for elevation interpolation after routing

**`waypoint-moved` handler (now async):**
1. Save undo snapshot
2. Get anchors from map, update moved anchor position
3. Call `recalculateSegments(anchors)` for road-following path
4. Call `interpolateElevations()` to preserve elevation data
5. Replace route with single track/segment from routed points
6. Update map via `gpxMap.updateFromRouting()`
7. Update stats and elevation chart
8. Show loading cursor during routing

**`waypoint-added` handler (now async):**
- Insert new anchor after clicked segment
- Recalculate and update (same flow as waypoint-moved)

**`waypoint-removed` handler (now async):**
- Remove anchor from anchors array
- Recalculate and update (same flow as waypoint-moved)

**New helper:**
- `flattenAllPoints(routeData)` — Flatten route to single array for elevation interpolation

### 4. Elevation Preservation
Original elevation data is preserved during editing:
1. When entering edit mode, store `originalEditPoints` (all points with elevation)
2. After OSRM routing (returns points without elevation), call `interpolateElevations(newPoints, originalEditPoints)`
3. For each new point, find closest original point and copy its elevation
4. Not perfect (OSRM might choose different roads), but preserves relative elevation profile

### 5. UX Improvements
- Loading cursor during routing (async operations take 100-500ms)
- Immediate visual feedback during drag (polyline updates live)
- Clear error logging if routing fails (fallback to straight lines)
- No bounds re-fitting during routing updates (keeps current view stable)

## Consequences

### Positive
✅ **Routes follow actual roads** — Core UX issue resolved  
✅ **Elevation data preserved** — No data loss during editing  
✅ **Network resilience** — Fallback to straight lines if OSRM fails  
✅ **Familiar UX** — Drag-to-edit works like Google Maps / Strava route builder  
✅ **Performance** — Single OSRM request for all anchors (not per-segment)  

### Negative
⚠️ **Dependency on OSRM demo server** — Public server, no SLA, could go down or rate-limit  
⚠️ **Network required** — Editing doesn't work offline (fallback is not great)  
⚠️ **Elevation interpolation is approximate** — OSRM may choose different roads than original  
⚠️ **Multi-track routes become single-track** — Editing flattens multi-segment structure  

### Future Improvements
- Add configurable OSRM server URL (allow self-hosting)
- Cache routing requests (deduplicate identical anchor sets)
- Show network errors to user (currently silent failure → straight lines)
- Support offline mode with cached road network (very complex)
- Preserve multi-track structure during editing (complex — need segment-aware anchors)

## Validation
Manual testing:
1. Load a GPX route with ~500 points
2. Toggle edit mode → ~100 anchor markers appear
3. Drag an anchor → route recalculates via OSRM, follows roads ✅
4. Click polyline → new anchor inserted, route recalculates ✅
5. Right-click anchor (not first/last) → anchor removed, route recalculates ✅
6. Right-click first/last anchor → nothing happens (protected) ✅
7. Check elevation chart → elevation data preserved ✅
8. Undo → restores pre-edit route ✅

## Implementation Notes
- Total changes: 2 files modified (`gpx-map.js`, `app.js`)
- No new dependencies (uses existing `fetch` API)
- `routing.js` was already created in prior work (exports were ready to use)
- Edit markers now represent anchors, not raw track points
- Event payloads changed: `index` → `anchorIndex`, `afterAnchorIndex`
- All event handlers are now async (uses `async`/`await`)
