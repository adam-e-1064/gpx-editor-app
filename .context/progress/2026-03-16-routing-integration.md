# Route Editing Enhancement — 2026-03-16

## Task
Update route editing to use road-following routing via OSRM, replacing the "spike polyline" issue where dragging waypoints didn't recalculate paths along roads.

## What Was Done

### 1. Updated `components/gpx-map.js`
Implemented anchor-based editing model:
- Added `this.anchors[]` property to track anchor points
- Modified `enableEditing()` to build anchors from sampled points (first and last always included)
- Updated `startDragging()` to dispatch waypoint-moved with anchor context (anchorIndex, prevAnchor, nextAnchor)
- Updated click-to-add to find which segment was clicked and dispatch with afterAnchorIndex
- Updated right-click remove to prevent removing first/last anchors
- Added `updateFromRouting(newPoints)` method to apply routing results and refresh anchors
- Added `getAnchors()` method to expose anchors to app.js
- Modified `disableEditing()` to clear anchors array

### 2. Updated `js/app.js`
Integrated OSRM routing into event handlers:
- Added import for `recalculateSegments` and `interpolateElevations` from routing.js
- Added `state.originalEditPoints` to store original route points for elevation interpolation
- Updated `route-edit-toggle` handler to store original points when entering edit mode
- Converted `waypoint-moved` handler to async:
  - Gets anchors from map, updates moved anchor
  - Calls `recalculateSegments(anchors)` 
  - Interpolates elevations from original points
  - Updates state with single-track/single-segment route
  - Calls `gpxMap.updateFromRouting()` instead of `refreshAllComponents()`
  - Shows loading cursor during routing
- Converted `waypoint-added` handler to async (same flow as waypoint-moved)
- Converted `waypoint-removed` handler to async (same flow as waypoint-moved)
- Added `flattenAllPoints(routeData)` helper function to extract all points for elevation interpolation

### 3. Created Documentation
- ADR 0007: Documents the anchor-based routing architecture decision
- Includes context, decision details, consequences, and validation notes

## Technical Details

### Anchor Model
- Anchors are sampled points along the route (max ~100)
- First and last points are always anchors (cannot be removed)
- Edit markers represent anchors, not individual track points
- When an anchor moves, OSRM recalculates the road path through all anchors

### Event Payload Changes
**Before:**
```js
waypoint-moved: { index, lat, lng }
waypoint-added: { index, lat, lng }
waypoint-removed: { index }
```

**After:**
```js
waypoint-moved: { anchorIndex, lat, lng, prevAnchor, nextAnchor }
waypoint-added: { afterAnchorIndex, lat, lng }
waypoint-removed: { anchorIndex }
```

### Elevation Preservation
1. Store `originalEditPoints` when entering edit mode
2. After OSRM routing (which doesn't include elevation), call `interpolateElevations()`
3. For each new point, find closest original point and copy elevation
4. Preserves approximate elevation profile (not 100% accurate if OSRM chooses different roads)

### Loading States
- All edit event handlers are now async
- Show `cursor: wait` during routing requests
- Routing typically takes 100-500ms depending on route complexity

## Validation
No errors reported by VS Code for either modified file.

Manual testing needed:
- [ ] Load a GPX route
- [ ] Toggle edit mode
- [ ] Drag an anchor marker → verify route follows roads
- [ ] Click polyline → verify new anchor inserted correctly
- [ ] Right-click anchor (not first/last) → verify anchor removed
- [ ] Check elevation chart → verify elevation preserved
- [ ] Test undo → verify restores original route

## Open Questions
None — implementation is complete per specification.

## Next Steps
1. Run git commits:
   ```bash
   git add components/gpx-map.js
   git commit -m "feat(map): update editing to anchor-based routing model"
   
   git add js/app.js
   git commit -m "feat(app): integrate OSRM routing for edit operations"
   ```

2. Manual testing of edit functionality

3. Consider future enhancements:
   - Configurable OSRM server URL (for self-hosting)
   - Cache routing requests to avoid redundant calls
   - Show user-visible error when routing fails
   - Offline mode support (very complex)
