# 0008 — OSRM Road Routing for Route Editing

**Status**: Accepted
**Date**: 2026-03-16
**Context**: Route editing previously moved individual trackpoints, creating "spike" polylines that didn't follow roads. Users need edited routes to follow actual road networks.
**Decision**: Integrate OSRM (Open Source Routing Machine) demo server for road-following route recalculation. Edit markers become "anchor points"; moving/adding/removing an anchor triggers a full route recalculation through OSRM. Elevation data is preserved by interpolating from the original route's nearest points.
**Consequences**: 
- Routes follow actual roads when editing
- Requires network connectivity during editing
- OSRM demo server has no SLA or rate limit guarantees
- Can be swapped to self-hosted OSRM or paid routing API later
- Slight latency on each edit operation (~200-500ms for OSRM response)
