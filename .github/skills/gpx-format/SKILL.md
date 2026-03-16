---
name: "gpx-format"
description: "Use when parsing, validating, or exporting GPX files. Defines the GPX XML structure, parsing rules, export rules, and the RouteData data model."
---

# GPX Format — MotoRoute Reference

## Data Model

```js
/** @typedef {Object} RouteData
 * @property {string} name
 * @property {string} [description]
 * @property {Track[]} tracks
 * @property {Waypoint[]} waypoints
 * @property {RouteMetadata} metadata
 */

/** @typedef {Object} Track
 * @property {string} [name]
 * @property {Segment[]} segments
 */

/** @typedef {Object} Segment
 * @property {TrackPoint[]} points
 */

/** @typedef {Object} TrackPoint
 * @property {number} lat
 * @property {number} lng
 * @property {number|null} ele
 * @property {string|null} time
 */

/** @typedef {Object} Waypoint
 * @property {number} lat
 * @property {number} lng
 * @property {number|null} ele
 * @property {string} name
 * @property {string} [description]
 */

/** @typedef {Object} RouteMetadata
 * @property {number} totalDistanceKm
 * @property {number} elevationGainM
 * @property {number} elevationLossM
 * @property {number} maxElevationM
 * @property {number} minElevationM
 * @property {number} estimatedTimeMin
 * @property {number} pointCount
 */
```

## Parsing Rules
1. Use native `DOMParser` — no external XML library
2. `<trkpt>` `lat` and `lon` attributes are REQUIRED — skip points without them
3. `<ele>` is OPTIONAL — set to `null` if missing
4. `<time>` is OPTIONAL — set to `null` if missing
5. Multiple `<trk>` → multiple entries in `RouteData.tracks[]`
6. Multiple `<trkseg>` within `<trk>` → multiple entries in `Track.segments[]`
7. `<wpt>` → `RouteData.waypoints[]`
8. Handle both namespaced and non-namespaced GPX XML

## Export Rules
1. Always GPX 1.1 with namespace `http://www.topografix.com/GPX/1/1`
2. Set `creator="MotoRoute"` on root `<gpx>` element
3. Include `<metadata>` with `<name>` and `<time>`
4. Include `<ele>` and `<time>` on trackpoints when available
5. Include all `<wpt>` with `<name>` and `<desc>`
6. Use 6 decimal places for lat/lng
7. Encode as UTF-8

## GPX 1.1 XML Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MotoRoute"
     xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Route Name</name>
    <time>2026-03-14T10:30:00Z</time>
  </metadata>
  <wpt lat="40.4168" lon="-3.7038">
    <ele>667</ele>
    <name>Waypoint Name</name>
    <desc>Description</desc>
  </wpt>
  <trk>
    <name>Track Name</name>
    <trkseg>
      <trkpt lat="40.4168" lon="-3.7038">
        <ele>667</ele>
        <time>2026-03-14T10:30:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>
```

## File Responsibilities
| File | Purpose |
|------|---------|
| `js/gpx-parser.js` | GPX XML → RouteData |
| `js/gpx-export.js` | RouteData → GPX XML + download |
