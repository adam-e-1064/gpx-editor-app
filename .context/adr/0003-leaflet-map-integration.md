# 0003 — Leaflet Map Integration and Marker Strategy

**Status**: Accepted  
**Date**: 2026-03-15  
**Context**: MotoRoute needs to render GPX routes on an interactive map. We need a lightweight, CDN-loadable mapping library with markers, polylines, and tile layer support.

## Decision

Use **Leaflet 1.9.4** via CDN with OpenStreetMap as the default tile provider.

### Tile Layers (Phase 1)
- **OpenStreetMap** (default): `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Free, no API key, attribution required

### Marker Colors
- **Start**: Green marker
- **End**: Red marker  
- **Waypoints**: Blue markers with popups (name + description + elevation)

### Route Rendering
- **Polyline**: Blue (`#2563eb`), weight 4, opacity 0.7
- **Auto-fit**: `fitBounds()` with 50px padding on route load
- **Layer management**: All route elements in a single `L.LayerGroup` for easy clearing

### Event Dispatching
- `point-hover` — dispatched when user hovers over polyline (finds nearest trackpoint index)

## Consequences

### Positive
- **CDN-loaded** — no build step, 42KB gzipped
- **Free tile layer** — OSM requires no API key
- **Widely supported** — Leaflet is the de facto standard for web maps
- **Plugin ecosystem** — can add elevation profiles, fullscreen, geocoding later

### Negative
- **Tile rate limits** — OSM requests respect of tile usage policy (not an issue for personal use)
- **Marker icons** — using external CDN for colored markers (could self-host later)
- **No 3D** — Leaflet is 2D only (acceptable for Phase 1)

### Neutral
- **Layer control** — not implemented in Phase 1 (will add `<tile-switcher>` in Phase 2)
- **Edit mode** — draggable markers not enabled yet (Phase 3)

## Alternatives Considered

### Mapbox GL JS
**Rejected** because it requires an API key and token management, violating the zero-config constraint.

### Google Maps
**Rejected** for same reason (API key required, billing setup needed).

### OpenLayers
**Rejected** due to larger footprint (200KB+) and steeper learning curve. Leaflet is simpler for 2D route display.

## Implementation Notes

- Component: `components/gpx-map.js`
- Public methods: `loadRoute(routeData)`, `clearRoute()`, `highlightPoint(index)`
- Marker icons: Using `leaflet-color-markers` CDN for green/red/blue markers
- Performance: For routes >10,000 points, will add sampling in Phase 2
