---
name: "web-components"
description: "Use when building UI components for MotoRoute. This project uses Web Components (Custom Elements v1) instead of React/Vue/Svelte."
---

# Web Components — MotoRoute Conventions

## Framework
MotoRoute uses **Custom Elements v1** with Light DOM (no Shadow DOM for most components).

## Component Pattern
```js
class MyComponent extends HTMLElement {
  connectedCallback() {
    // Called when element is added to DOM — render here
  }

  disconnectedCallback() {
    // Called when element is removed — clean up event listeners
  }

  static get observedAttributes() {
    return ['attr-name'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    // React to attribute changes
  }
}

customElements.define('my-component', MyComponent);
```

## Registration
- Components are registered in their own file via `customElements.define()`
- Files live in `components/` directory
- Each file exports one component: `<gpx-map>`, `<elevation-chart>`, `<route-stats>`, `<file-import>`, `<route-editor>`, `<tile-switcher>`

## Communication
- Components dispatch `CustomEvent` on `document` to communicate upward
- `app.js` listens for events and calls component methods to pass data downward
- Components NEVER reference each other directly

```js
// Dispatching (component → app.js)
document.dispatchEvent(new CustomEvent('gpx-loaded', {
  detail: { routeData, fileName }
}));

// Listening (app.js)
document.addEventListener('gpx-loaded', (e) => {
  map.loadRoute(e.detail.routeData);
  stats.update(e.detail.routeData.metadata);
});
```

## Events Used
| Event | Source | Detail |
|-------|--------|--------|
| `gpx-loaded` | `<file-import>` | `{ routeData, fileName }` |
| `gpx-error` | `<file-import>` | `{ message }` |
| `point-hover` | `<gpx-map>` | `{ index }` |
| `chart-hover` | `<elevation-chart>` | `{ index }` |
| `waypoint-moved` | `<gpx-map>` | `{ index, lat, lng }` |
| `waypoint-added` | `<gpx-map>` | `{ index, lat, lng }` |
| `waypoint-removed` | `<gpx-map>` | `{ index }` |
| `split-requested` | `<gpx-map>` | `{ index }` |
| `tile-change` | `<tile-switcher>` | `{ layer }` |
| `route-reverse` | `<route-editor>` | — |
| `route-trim` | `<route-editor>` | `{ start, end }` |
| `route-merge` | `<route-editor>` | `{ routeData }` |
| `route-split` | `<route-editor>` | `{ index }` |
| `route-undo` | `<route-editor>` | — |
| `route-export` | `<route-editor>` | — |

## DOM
Components use Light DOM (no Shadow DOM). Styles are in external CSS files.

## No Build Step
Components are ES modules loaded via `<script type="module">` — no bundler, no transpilation.
