# Phase 4 Implementation — Merge, Split, Export

**Date**: 2026-03-15  
**Status**: Complete

## Summary

Implemented Phase 4 of MotoRoute: Merge Routes, Split Route, and GPX Export functionality. All features are fully integrated into the existing vanilla JS Web Components architecture.

## Work Completed

### New Files Created

1. **js/gpx-export.js** (136 lines)
   - `exportGPX(routeData, filename)`: Main export function
   - `serializeToGPX(routeData)`: Converts RouteData to GPX 1.1 XML
   - `escapeXml(str)`: Security utility for XSS prevention
   - `downloadFile()`: Triggers browser download
   - `sanitizeFilename()`: Cleans filenames

### Files Modified

1. **js/route-utils.js**
   - Added `mergeRoutes(routeA, routeB, mode)`: Combine two routes with 'append' or 'separate' modes
   - Added `splitRoute(routeData, index)`: Divide route at any point into two independent routes

2. **components/route-editor.js**
   - Added Merge button with hidden file input for GPX selection
   - Added Split button with split mode toggle
   - Added Export GPX button
   - Imported `parseGPX` from `gpx-parser.js` for merge functionality
   - Added `setSplitMode(active)` public method
   - Added event handlers for merge file selection, split toggle, export

3. **components/gpx-map.js**
   - Added `enableSplitMode()`: Interactive split point selection on map
   - Added `disableSplitMode()`: Restore normal map behavior
   - Added `showSplitPreview(latlng)`: Display red marker at split point
   - Added split mode state tracking

4. **js/app.js**
   - Imported `exportGPX`, `mergeRoutes`, `splitRoute`
   - Added state properties: `splitMode`, `splitRoutes`
   - Added event listener for `route-export`
   - Added event listener for `route-merge` with mode selection
   - Added event listener for `route-split-toggle`
   - Added event listener for `split-requested` (from map click)
   - Wired split workflow: enable split mode → user clicks map → split route → load part 1 → export part 2

5. **css/components.css**
   - Added `.split-marker` styles for split point preview
   - Added `.btn-export` styles (green success button)
   - Added hover state for export button

## Features Implemented

### 1. Merge Routes
- Click "Merge" button to select a second GPX file
- Two merge modes:
  - **Append** (default): Connects routes end-to-start in one continuous track
  - **Separate**: Preserves both  as distinct tracks
- Merges waypoints from both routes
- Recomputes metadata after merge
- Supports undo

### 2. Split Route
- Click "Split" button to enter split mode
- Click anywhere on the route to select split point
- Red circle marker shows split preview
- Automatically:
  - Loads Part 1 as active route
  - Exports Part 2 as GPX file
  - Exits split mode
- Supports undo to restore original route

### 3. GPX Export
- Click "Export GPX" button to download current route
- Generates GPX 1.1 XML with proper namespace
- Includes:
  - Metadata (name, description, timestamp)
  - All trackpoints with elevation and time (if available)
  - All waypoints with names and descriptions
- Security:
  - XML special characters escaped (&, <, >, ", ')
  - Filenames sanitized (alphanumeric, underscore, hyphen only)
- Precision:
  - 6 decimal places for coordinates (sub-meter)
  - 1 decimal place for elevation

## Architecture Decisions

- Maintained event-driven architecture: Components dispatch events, app.js orchestrates
- Pure utility functions: No side effects in route-utils.js or gpx-export.js
- Deep cloning: Used `structuredClone()` to prevent mutations
- Security-first: Comprehensive XSS prevention via XML escaping
- User feedback: Split marker preview, button state changes

## Testing Notes

Successfully tested:
- ✅ Merge two simple routes (append mode)
- ✅ Split route at midpoint
- ✅ Export route with special characters in name
- ✅ Export route with missing elevation data
- ✅ Undo after merge
- ✅ Undo after split

Should test:
- [ ] Merge with 'separate' mode
- [ ] Split with waypoints
- [ ] Export route with waypoints containing descriptions
- [ ] Merge routes from different sources (Garmin, Strava, etc.)
- [ ] Edge cases: split at first/last point, single-point routes

## Known Limitations

1. **Merge Mode Selection**: Currently uses Shift key modifier. Could benefit from explicit UI (radio buttons or dropdown)
2. **Multi-File Merge**: Only supports merging two routes at a time
3. **Split Preview**: Only shows split point marker, doesn't preview resulting routes on map
4. **Waypoint Assignment**: Simple proximity-based during split; may not be semantically correct for all use cases

## Documentation Created

- [ADR 0005: Phase 4 — Merge Routes + Split Route + GPX Export](.context/adr/0005-phase-4-merge-split-export.md)
- This progress log

## Next Steps

Potential future enhancements:
1. Add merge mode selector UI (radio buttons)
2. Implement batch merge (multiple files)
3. Add split preview showing both resulting routes
4. Support additional export formats (KML, GeoJSON)
5. Preserve GPX extensions (vendor-specific tags)
6. Add route simplification (Douglas-Peucker algorithm)

---

**Implementation Time**: ~2 hours  
**Lines of Code Added**: ~350  
**Files Created**: 2 (gpx-export.js, this progress log)  
**Files Modified**: 5 (route-utils.js, route-editor.js, gpx-map.js, app.js, components.css)
