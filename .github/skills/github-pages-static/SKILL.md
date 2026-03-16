---
name: "github-pages-static"
description: "Use when configuring deployment. MotoRoute deploys as static files to GitHub Pages — no build step, no CI required."
---

# GitHub Pages Deployment — MotoRoute Reference

## Setup
- `index.html` at repository root — GitHub Pages serves it directly
- Source: `main` branch, root `/`
- HTTPS provided automatically
- Custom domain optional (via CNAME file)

## No Build Step
There is no build command. Pushing to `main` deploys automatically. The site is purely static HTML + CSS + JS files.

## No CI Required
No GitHub Actions workflow needed for deployment. No `package.json`, no `node_modules`.

## Performance Targets
| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 2.0s |
| Lighthouse Performance | 90+ |
| Lighthouse Accessibility | 90+ |

## Static Asset Strategy
- Leaflet and pako loaded from CDN
- SVG icons in `assets/icons/`
- All CSS in `css/` directory
- All JS as ES modules in `js/` and `components/`

---
