# 0004 — Phase 2 Interactive Components Architecture

**Status**: Accepted
**Date**: 2026-03-15
**Context**: Phase 1 provided basic GPX import and map visualization. Phase 2 adds interactive features: route statistics display, elevation profile chart, and tile layer switching. These features require coordination between multiple components while maintaining the vanilla JS, no-build architecture.

**Decision**: 
Implemented four new Web Components and refactored metadata calculation:

1. **`<route-stats>` Component** - Displays route metadata in a grid layout
   - Uses programmatic DOM construction (createElement + textContent) for security
   - Public `update(metadata)` method receives RouteMetadata object
   - No innerHTML for user-derived data to prevent XSS

2. **`<elevation-chart>` Component** - Canvas-based elevation profile
   - Canvas 2D API with devicePixelRatio scaling for retina displays
   - Methods: `loadProfile(points)`, `highlightDistance(km)`, `clear()`
   - Point sampling (max 2000 points) for performance
   - Dispatches `chart-hover` event for map synchronization
   - Debounced resize handler for responsive redrawing
   - Gradient fill (green → brown) representing elevation range

3. **`<tile-switcher>` Component** - Toggle between tile layers
   - Three tile providers: OSM (default), OpenTopoMap, CyclOSM
   - Dispatches `tile-change` event on selection
   - Active state management with visual highlight

4. **`gpx-map` Component Updates**
   - Added `setTileLayer(layerName)` for dynamic tile switching
   - Improved `highlightPoint(index)` with pulsing circle marker
   - Stores `currentTileLayer` reference for proper cleanup
   - Stores `allPoints` array for hover interaction

5. **Pure Utilities Extraction** - `route-utils.js`
   - Extracted `computeMetadata()` from `gpx-parser.js`
   - Single source of truth for metadata calculation
   - 1m elevation noise threshold to filter GPS inaccuracies
   - Default 60 km/h average speed for time estimates

**Communication Pattern**:
- Chart hover → `chart-hover` event → `gpx-map.highlightPoint(index)`
- Map hover → `point-hover` event → `elevation-chart.highlightDistance(km)`
- Tile switch → `tile-change` event → `gpx-map.setTileLayer(layer)`
- All events dispatched on `document`, `app.js` orchestrates

**Consequences**:

✅ **Benefits**:
- Bidirectional hover sync between map and elevation chart enhances UX
- Separation of concerns: each component has single responsibility
- Canvas rendering provides high performance for large GPX files (10k+ points)
- Point sampling prevents performance degradation with massive datasets
- Tile switching adds value without external API keys
- Consistent event-based architecture scales to future features

⚠️ **Trade-offs**:
- Canvas API is more complex than SVG but gives better performance
- Manual resize handling required (no auto-scaling like SVG viewBox)
- Point sampling may lose detail in extremely dense routes (acceptable for visualization)
- Multiple tile layers increase page weight slightly (mitigated by lazy loading)

📋 **Future Considerations**:
- Phase 3 may add route editing (waypoint dragging, split, merge)
- Consider Web Workers for metadata computation on very large files (>50k points)
- Could add more tile layers (satellite, terrain) as user settings
- Tooltip positioning on chart may need adjustment on narrow screens
