---
name: "leaflet-maps"
description: "Use when implementing the gpx-map component or any map-related feature. Covers Leaflet initialization, tile layers, polylines, markers, and event handling."
---

# Leaflet Maps — MotoRoute Reference

## Setup
Leaflet 1.9+ loaded via CDN `<script>` tag in `index.html`. No npm install.

## Tile Layers
| Name | URL Template |
|------|-------------|
| `osm` | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` |
| `topo` | `https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png` |
| `cyclosm` | `https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png` |

All free, no API key required.

## Map Component (`<gpx-map>`)
Lives in `components/gpx-map.js`.

### Public Methods
- `loadRoute(routeData)` — render polyline + markers, fit bounds
- `clearRoute()` — remove all layers
- `highlightPoint(index)` — show crosshair at trackpoint index
- `setTileLayer(layerName)` — switch tile provider
- `enableEditing()` — make markers draggable, enable click-to-add
- `disableEditing()` — lock markers

### Events Dispatched
- `point-hover` → `{ index }` — hovering on route polyline
- `waypoint-moved` → `{ index, lat, lng }` — marker dragged
- `waypoint-added` → `{ index, lat, lng }` — click to add point
- `waypoint-removed` → `{ index }` — right-click/long-press delete
- `split-requested` → `{ index }` — split trigger

### Markers
- Start: green marker
- End: red marker
- Waypoints: blue markers with name/description popups

### Performance
- For routes with >10,000 points, sample every Nth point for draggable markers
- Use Leaflet's built-in polyline simplification at low zoom
- `fitBounds()` on route load
