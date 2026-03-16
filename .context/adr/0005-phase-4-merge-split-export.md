# 0005 — Phase 4: Merge Routes + Split Route + GPX Export

**Status**: Accepted  
**Date**: 2026-03-15

## Context

MotoRoute needed advanced route manipulation features to enable users to:
1. Combine multiple GPX files into a single route (merge)
2. Divide a route into two separate files at any point (split)
3. Export modified routes back to GPX format for use in GPS devices

These features complete the route editing toolkit and enable round-trip workflows: import → edit → merge/split → export.

## Decision

### Architecture

We implemented three core capabilities while maintaining the existing vanilla JS, Web Components, and event-driven architecture:

1. **GPX Export Module** (`js/gpx-export.js`)
   - Pure utility module that serializes RouteData to GPX 1.1 XML
   - Handles XML escaping, precision formatting (6 decimals for coordinates, 1 for elevation)
   - Triggers browser download without external libraries
   - Sanitizes filenames to prevent injection

2. **Route Utilities Extension** (`js/route-utils.js`)
   - `mergeRoutes(routeA, routeB, mode)`: Supports two merge modes
     - `'append'`: Flattens both routes into a single continuous track
     - `'separate'`: Preserves both routes as distinct tracks
   - `splitRoute(routeData, index)`: Splits at any trackpoint index
     - Returns two independent RouteData objects
     - Distributes waypoints between parts based on proximity
     - Preserves elevation and metadata

3. **Component Updates**
   - **route-editor.js**: Added Merge, Split, Export buttons
     - Merge button triggers hidden file input for second GPX selection
     - Uses `parseGPX()` to import merge candidate
     - Split button toggles split mode (visual feedback)
     - Export button triggers GPX download
   - **gpx-map.js**: Added split mode interaction
     - `enableSplitMode()`: Changes cursor, shows split marker on click
     - `disableSplitMode()`: Restores normal behavior
     - Displays red circle marker as split preview
   - **app.js**: Event orchestration for new features
     - Wires `route-merge`, `route-split-toggle`, `split-requested`, `route-export`
     - Manages split mode state
     - Auto-exports second part after split

### Data Flow

**Merge:**
```
User clicks Merge → Hidden file input → parseGPX() → route-merge event 
→ app.js calls mergeRoutes() → refreshAllComponents()
```

**Split:**
```
User clicks Split → Split mode enabled → User clicks on map → split-requested event
→ app.js calls splitRoute() → Load Part 1 + export Part 2 → Exit split mode
```

**Export:**
```
User clicks Export → route-export event → app.js calls exportGPX() 
→ Serialize to XML → Trigger download
```

### Security & Quality

- **XSS Prevention**: All user-visible XML content is escaped using `escapeXml()` helper
- **Filename Sanitization**: Remove special characters, limit length
- **Deep Copies**: Use `structuredClone()` to prevent reference mutations
- **Error Handling**: Try-catch blocks with user-friendly error messages
- **Precision**: 6 decimals for lat/lng (sub-meter), 1 decimal for elevation

### Testing Considerations

- Test merge with routes containing:
  - Different coordinate systems
  - Missing elevation data
  - Multiple tracks/segments
  - Waypoints
- Test split at edge cases (first point, last point, single-point routes)
- Test export with special characters in names/descriptions

## Consequences

### Positive

- **Complete Editing Workflow**: Users can now import, edit, combine, divide, and export routes
- **No External Dependencies**: Pure vanilla JS implementation, no XML libraries
- **Consistent Architecture**: Follows existing event-driven, component-based patterns
- **Security**: Comprehensive XSS prevention through escaping
- **Flexibility**: Merge modes support different use cases (continuous vs. multi-day routes)

### Negative

- **Complex State Management**: Split mode adds temporary state that must be carefully managed
- **File Input Limitation**: Merge requires user to manually select second file (cannot drag-drop multiple files)
- **No Multi-Split**: Can only split once per operation (must undo to split again)
- **Waypoint Distribution**: Simple proximity-based waypoint assignment during split may not always be semantically correct

### Future Improvements

- Add batch merge (select multiple files at once)
- Support split-to-many (divide route into N equal parts)
- Add merge preview showing both routes on map before committing
- Preserve GPX extensions (e.g., Garmin-specific tags)
- Add export options (GPX 1.0 vs 1.1, KML format)

## Implementation Notes

- Export uses Blob API and temporary `<a>` element for download trigger
- Split automatically exports second part to prevent data loss
- Merge mode can be changed via Shift key (UI improvement needed)
- Split marker uses red circle to differentiate from edit markers (blue) and route markers (green/red)
