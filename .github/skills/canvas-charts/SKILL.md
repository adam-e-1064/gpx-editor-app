---
name: "canvas-charts"
description: "Use when implementing the elevation-chart component. Covers Canvas 2D API rendering for the interactive elevation profile."
---

# Canvas Charts — MotoRoute Reference

## Component
`<elevation-chart>` in `components/elevation-chart.js`

## Public Methods
- `loadProfile(points)` — takes `[{ distanceKm, elevationM }]`, renders chart
- `highlightDistance(km)` — show vertical crosshair at distance
- `clear()` — clear the canvas

## Events Dispatched
- `chart-hover` → `{ index }` — for map sync when hovering on chart

## Rendering Specs
- Canvas element, 100% width of container
- Height: 150px desktop, 120px mobile
- Filled area chart with gradient (green low → brown high)
- X-axis: cumulative distance (km)
- Y-axis: elevation (m)
- On hover: vertical line + tooltip (elevation + distance)
- Min/max elevation markers

## Canvas Techniques
- Use `devicePixelRatio` for crisp rendering on retina displays
- `CanvasRenderingContext2D` for all drawing (lineTo, fill, gradients)
- Mouse position → data point mapping for hover detection
- Point sampling for large datasets (>5,000 points)

## No Dependencies
Pure Canvas 2D API — no Chart.js or other charting library.
