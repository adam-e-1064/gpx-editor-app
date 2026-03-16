---
name: "geospatial-utils"
description: "Use when implementing or testing route calculations — distance, elevation, reverse, trim, merge, split. Covers geo-utils.js and route-utils.js."
---

# Geospatial Utilities — MotoRoute Reference

## geo-utils.js (Pure Functions)
- **Haversine distance**: Calculate distance between two lat/lng points in meters
- **Bearing**: Calculate bearing between two points in degrees
- **Point-to-segment distance**: Find nearest point on a polyline segment (for click-on-route detection)

## route-utils.js (Pure Functions, depends on geo-utils.js)

### Route Operations
- **reverse(routeData)** — flip all segments, swap start/end
- **trim(routeData, startPct, endPct)** — cut route by percentage from each end
- **merge(routeA, routeB, mode)** — `mode: 'append'` connects end→start; `mode: 'separate'` keeps as distinct segments
- **split(routeData, index)** — divide into two independent tracks at point index

### Statistics
- `totalDistanceKm` — sum of Haversine distances between consecutive points
- `elevationGainM` — sum of positive elevation changes (filter noise with threshold)
- `elevationLossM` — sum of negative elevation changes
- `maxElevationM` / `minElevationM` — from trackpoint elevation values
- `estimatedTimeMin` — distance / average speed (user-configurable, default 60 km/h)
- `pointCount` — total trackpoints across all segments

## Performance
- For >10,000 points, consider sampling for UI operations (markers, chart)
- All computation functions are pure — no side effects, easily testable
