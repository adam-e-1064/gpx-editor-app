# 0001 — Web Components Architecture for MotoRoute

**Status**: Accepted  
**Date**: 2026-03-15  
**Context**: MotoRoute is a zero-build static GPX toolkit that needs to run directly in browsers without any build tooling. We need a component architecture that is native, performant, and requires no dependencies beyond Leaflet.

## Decision

Use **Custom Elements v1 (Web Components)** with Light DOM instead of a framework like React, Vue, or Svelte.

### Component Communication Pattern
- **Events up**: Components dispatch `CustomEvent` on `document` to communicate state changes upward
- **Data down**: `app.js` (orchestrator) calls public methods on components to pass data downward
- **No direct coupling**: Components never reference each other directly

### Key Components (Phase 1)
- `<file-import>` — GPX file drag & drop and parsing
- `<gpx-map>` — Leaflet map with route rendering

### Module Structure
All JavaScript is ES modules loaded via `<script type="module">`:
- `components/` — Web Component definitions
- `js/` — Pure utility functions (geo-utils, gpx-parser)
- `js/app.js` — Sole orchestrator, manages state and event wiring

## Consequences

### Positive
- **No build step** — files can be edited and refreshed immediately
- **Native browser APIs** — no frameworks to learn, update, or debug
- **CDN deployment** — works on GitHub Pages with zero configuration
- **Small footprint** — only Leaflet as external dependency
- **Standards-compliant** — uses platform primitives that will be supported indefinitely

### Negative
- **More verbose** than frameworks (manual DOM construction, event wiring)
- **No reactive data binding** — state changes require manual updates
- **Limited tooling** — no devtools extensions like React DevTools
- **Team learning curve** — if developers are only familiar with React/Vue

### Neutral
- **Light DOM** — styling is global (CSS files), no Shadow DOM encapsulation
- **Event-driven** — all inter-component communication via CustomEvents on `document`

## Alternatives Considered

### React/Vue/Svelte
**Rejected** because they require build tooling (Webpack, Vite) and npm dependencies, violating the zero-build constraint.

### jQuery
**Rejected** as it doesn't provide component boundaries or modern patterns (ES modules, custom elements).

### Vanilla JS with no component structure
**Rejected** because it would lead to monolithic, hard-to-maintain code. Web Components provide native encapsulation.

## Implementation Notes

- Component files live in `components/` directory
- Each component registers itself via `customElements.define()`
- Components are imported by `app.js` (side-effect import triggers registration)
- All components use `connectedCallback()` for initialization and `disconnectedCallback()` for cleanup
