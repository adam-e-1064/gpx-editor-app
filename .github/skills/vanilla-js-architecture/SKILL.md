---
name: "vanilla-js-architecture"
description: "Use when working on app.js, module structure, state management, or inter-component communication. Defines MotoRoute's vanilla JS architecture with no framework or build step."
---

# Vanilla JS Architecture — MotoRoute Reference

## No Build Step
- All JS files are ES modules loaded via `<script type="module">`
- Dependencies loaded via CDN `<script>` tags (Leaflet, pako)
- No npm, no Node.js, no bundler, no transpiler

## Module Structure
```
js/
├── app.js           — orchestrator, state, event wiring
├── gpx-parser.js    — GPX XML → RouteData (pure)
├── gpx-export.js    — RouteData → GPX XML (pure)
├── route-utils.js   — reverse, trim, merge, split, stats (pure)
├── geo-utils.js     — Haversine, bearing, point-on-segment (pure)
└── storage.js       — localStorage wrapper (pure)
```

## State Management
Single state object in `app.js` — no library:
```js
const state = {
  route: null,
  originalRoute: null,
  recentRoutes: [],
  preferences: {}
};
```

## Communication Pattern
- **Data down**: `app.js` calls component methods (e.g., `map.loadRoute(data)`)
- **Events up**: Components dispatch `CustomEvent` on `document`
- `app.js` is the SOLE orchestrator — it listens for all events and coordinates components
- Components NEVER reference each other

## localStorage Schema
- `motoroute_recent` — JSON array of route summaries
- `motoroute_route_{id}` — serialized RouteData
- `motoroute_preferences` — user preferences (tileLayer, speed, units)

## Types
Use JSDoc `@typedef` annotations for type safety — no TypeScript, no build step.
