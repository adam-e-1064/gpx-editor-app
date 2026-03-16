# 0002 — GPX Parser Implementation Strategy

**Status**: Accepted  
**Date**: 2026-03-15  
**Context**: MotoRoute needs to parse GPX 1.0/1.1 XML files in the browser without external libraries. The RouteData model must support tracks, segments, waypoints, and route statistics.

## Decision

Use native **DOMParser** API with zero external dependencies for GPX parsing.

### Parsing Rules
1. **Required attributes**: `<trkpt>` must have `lat` and `lon` — skip points that lack them
2. **Optional elements**: `<ele>` and `<time>` set to `null` if missing (never omit from data model)
3. **Namespace handling**: Try `querySelectorAll()` first (works for non-namespaced XML), fall back to `getElementsByTagNameNS()` if needed
4. **Multiple tracks/segments**: Preserve structure exactly as authored in GPX (don't flatten)
5. **Validation**: Throw descriptive errors if no valid tracks/trackpoints found

### RouteData Model
```js
{
  name: string,
  description?: string,
  tracks: Track[],
  waypoints: Waypoint[],
  metadata: RouteMetadata
}
```

### Metadata Calculation
- **Distance**: Sum of Haversine distances between consecutive points
- **Elevation gain/loss**: Sum positive/negative changes with 1m noise threshold
- **Estimated time**: `(distance / 60 km/h) * 60` minutes (default speed, will be user-configurable in Phase 3)

## Consequences

### Positive
- **Zero dependencies** — no XML parsing library needed
- **Browser-native** — DOMParser is universally supported
- **Semantic model** — RouteData preserves GPX structure (tracks → segments → points)
- **Null handling** — optional fields are `null`, not `undefined` or missing (consistent)

### Negative
- **Verbose** — DOMParser API requires more code than a dedicated GPX library
- **No schema validation** — we trust GPX is well-formed (could add stricter checks later)
- **Elevation noise** — 1m threshold may not suit all GPS devices (should be configurable)

### Neutral
- **Haversine only** — no geodesic distance calculation (acceptable for <1000km routes)
- **No GPX extensions** — ignores Garmin/Strava-specific extensions (can add later if needed)

## Alternatives Considered

### gpxparser.js library
**Rejected** because it adds 20KB overhead and we only need basic parsing. DOMParser is sufficient and native.

### XML2JS or similar
**Rejected** for same reason — unnecessary dependency when browser provides DOMParser.

### Fetch from URL
**Rejected** for Phase 1 (local file only). Will add in Phase 4 (cloud storage integration).

## Implementation Notes

- File: `js/gpx-parser.js`
- Export: `parseGPX(xmlString)` → `RouteData`
- Validation: Always check for `lat`/`lon` attributes before creating trackpoint
- Metadata: Calculate distance/elevation in a separate pure function (`calculateMetadata()`)
