# 0006 — Phase 5: Polish + Persistence

**Status**: Accepted  
**Date**: 2026-03-15

## Context

MotoRoute needed production-ready polish before public launch:
- Users losing routes on page refresh (no persistence)
- No visual feedback during GPX parsing (100+ MB files can take seconds)
- Missing accessibility features (keyboard nav, screen readers, skip links)
- Unpolished mobile experience (no sidebar collapse on small screens)
- No handling of missing elevation data

## Decision

Implemented localStorage-based persistence and UX polish:

### 1. Storage Module (`js/storage.js`)
- Pure module with no DOM dependencies
- localStorage wrapper for routes and preferences
- Automatic LRU eviction when storage is full (max 10 recent routes)
- JSON serialization with error handling
- Schema:
  - `motoroute_recent` — route summaries (name, date, distance, point count)
  - `motoroute_route_{id}` — full RouteData objects
  - `motoroute_preferences` — user preferences (tile layer, speed, units)

### 2. Recent Routes UI
- New sidebar section showing last 10 loaded routes
- Click to reload, delete button per route
- Accessible (keyboard nav, ARIA labels, focus styles)
- Auto-hidden when empty

### 3. Loading States
- Overlay with CSS spinner during GPX parsing
- 50ms delay before showing to allow UI update
- Prevents UI freeze perception on large files

### 4. Elevation Warnings
- New `showWarning()` method in `<elevation-chart>`
- Canvas-rendered warning icon + text when no elevation data
- Better UX than blank/unclear state

### 5. Accessibility Improvements
- Skip link to main content (hidden until focused)
- ARIA roles on `<aside>`, `<main>`, `<section>`
- ARIA labels on all sections
- Visible focus styles (`:focus-visible` with 2px outline)
- Keyboard navigation for recent routes list
- All icon-only buttons have `aria-label`

### 6. Mobile Polish
- Collapsible sidebar toggle button (mobile only)
- Smooth expand/collapse animation
- Persists sidebar state during session
- Display: flex on sidebar header for toggle button alignment

### 7. Preference Persistence
- Tile layer selection saved to localStorage
- Auto-restored on app load
- Foundation for future preferences (speed, units, etc.)

## Implementation Notes

### State Flow
```
User loads GPX
  ↓
app.js saves to localStorage
  ↓
renderRecentRoutes() updates UI
  ↓
User clicks recent route
  ↓
loadRoute() retrieves from localStorage
  ↓
Dispatch 'gpx-loaded' event (same as file import)
```

### Mobile Sidebar Toggle
- CSS-only for collapsed state (max-height transition)
- JavaScript only for toggle button click handler
- ARIA `aria-expanded` attribute updated
- Icon rotates (▲ / ▼) to indicate state

### Loading Overlay
- Positioned absolutely in `.main-content`
- z-index 2000 (above map, below modals if added later)
- CSS animation for spinner (360° rotation)
- Semi-transparent white background for contrast

## Consequences

### Positive
- Routes persist across sessions — no data loss
- Improved perceived performance (loading feedback)
- WCAG 2.1 AA compliant for accessibility
- Better mobile UX with collapsible sidebar
- Graceful handling of missing elevation data

### Negative
- localStorage limit (5-10 MB depending on browser) — mitigated by LRU eviction
- No cross-device sync (localStorage is local) — acceptable for MVP
- 50ms delay before loading overlay may feel slow on small files — trade-off for preventing flash

### Future Considerations
- Add "Clear All Recent" button when route history grows
- Export/import preferences + recent routes for backup
- Service Worker + IndexedDB for larger storage capacity
- Cloud sync for cross-device access (post-MVP)
- Add user preference for auto-save on/off

## Testing Checklist
- [x] Recent routes persist after page reload
- [x] LRU eviction works when localStorage is full
- [x] Loading overlay shows/hides correctly
- [x] Elevation warning displays when data is missing
- [x] Skip link works with keyboard navigation
- [x] ARIA labels readable by screen reader
- [x] Sidebar toggle works on mobile viewport
- [x] Tile layer preference restores on load
- [x] Recent route delete removes from list and storage
- [x] Keyboard navigation works for recent routes list
