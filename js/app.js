/**
 * MotoRoute Main Application
 * Orchestrates components and manages state
 */

import '../components/file-import.js';
import '../components/gpx-map.js';
import '../components/route-stats.js';
import '../components/elevation-chart.js';
import '../components/tile-switcher.js';
import '../components/route-editor.js';
import { computeMetadata, reverseRoute, trimRoute, mergeRoutes, splitRoute } from './route-utils.js';
import { haversineDistance } from './geo-utils.js';
import { exportGPX } from './gpx-export.js';
import { saveRoute, loadRoute, getRecentRoutes, deleteRoute, savePreferences, loadPreferences } from './storage.js';

// Application state
const state = {
  route: null,
  originalRoute: null,
  recentRoutes: [],
  preferences: {},
  editing: false,
  editingSnapshot: null,
  splitMode: false,
  splitRoutes: null
};

/**
 * Initialize application
 */
function init() {
  console.log('MotoRoute initialized');
  
  // Get component references
  const gpxMap = document.querySelector('gpx-map');
  const routeStats = document.querySelector('route-stats');
  const elevationChart = document.querySelector('elevation-chart');
  const routeEditor = document.querySelector('route-editor');
  const statsSection = document.querySelector('#stats-section');
  const editorSection = document.querySelector('#editor-section');
  const loadingOverlay = document.querySelector('#loading-overlay');
  
  // Load preferences
  state.preferences = loadPreferences();
  
  // Apply tile layer preference
  if (state.preferences.tileLayer) {
    // Delay to ensure gpx-map component has initialized
    requestAnimationFrame(() => {
      if (gpxMap) {
        gpxMap.setTileLayer(state.preferences.tileLayer);
      }
    });
  }
  
  // Load and render recent routes
  renderRecentRoutes();
  
  // Initialize sidebar toggle for mobile
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      const isExpanded = !sidebar.classList.contains('collapsed');
      sidebarToggle.setAttribute('aria-expanded', String(isExpanded));
      sidebarToggle.querySelector('.sidebar-toggle-icon').textContent = isExpanded ? '▲' : '▼';
    });
  }
  
  // Clear sidebar collapsed state on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && sidebar && sidebar.classList.contains('collapsed')) {
      sidebar.classList.remove('collapsed');
      if (sidebarToggle) {
        sidebarToggle.setAttribute('aria-expanded', 'true');
        const icon = sidebarToggle.querySelector('.sidebar-toggle-icon');
        if (icon) icon.textContent = '▲';
      }
    }
  });
  
  // Listen for GPX loaded event
  document.addEventListener('gpx-loaded', (e) => {
    const { routeData, fileName, fromStorage } = e.detail;
    
    console.log('Route loaded:', fileName, routeData);
    
    // Show loading overlay
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
    }
    
    // Use setTimeout to allow loading overlay to render before heavy operations
    setTimeout(() => {
      // Store in state
      state.route = routeData;
      state.originalRoute = structuredClone(routeData);
      
      // Only save to localStorage for newly imported files (not when loading from storage)
      if (!fromStorage) {
        saveRoute(routeData);
      }
      
      // Load route on map
      if (gpxMap) {
        gpxMap.loadRoute(routeData);
      }
      
      // Show stats section and update stats
      if (statsSection && routeStats) {
        statsSection.style.display = 'block';
        routeStats.update(routeData.metadata);
      }
      
      // Show editor section
      if (editorSection) {
        editorSection.style.display = 'block';
      }
      
      // Prepare elevation profile data
      if (elevationChart) {
        const hasElevation = routeData.tracks.some(t => 
          t.segments.some(s => s.points.some(p => p.ele !== null))
        );
        
        if (hasElevation) {
          const profileData = prepareElevationProfile(routeData);
          elevationChart.loadProfile(profileData);
        } else {
          // Show warning for missing elevation data
          elevationChart.showWarning('No elevation data available');
        }
      }
      
      // Update recent routes list (only for newly imported files)
      if (!fromStorage) {
        renderRecentRoutes();
      }
      
      // Hide loading overlay
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
      }
    }, 50);
  });
  
  // Listen for GPX error event
  document.addEventListener('gpx-error', (e) => {
    const { message } = e.detail;
    console.error('GPX error:', message);
    // Hide loading overlay
    const loadingOverlay = document.querySelector('#loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
    // Error is already displayed by file-import component
  });
  
  // Listen for chart hover event - sync with map
  document.addEventListener('chart-hover', (e) => {
    const { index } = e.detail;
    
    if (gpxMap) {
      gpxMap.highlightPoint(index);
    }
  });
  
  // Listen for point hover event - sync with elevation chart
  document.addEventListener('point-hover', (e) => {
    const { index } = e.detail;
    
    if (elevationChart && state.route) {
      // Calculate cumulative distance at this point index
      const distance = calculateDistanceAtIndex(state.route, index);
      elevationChart.highlightDistance(distance);
    }
  });
  
  // Listen for tile change event
  document.addEventListener('tile-change', (e) => {
    const { layer } = e.detail;
    
    if (gpxMap) {
      gpxMap.setTileLayer(layer);
    }
    
    // Save tile preference
    state.preferences.tileLayer = layer;
    savePreferences(state.preferences);
  });
  
  // Listen for route edit toggle
  document.addEventListener('route-edit-toggle', () => {
    state.editing = !state.editing;
    
    // Mutual exclusion: exit split mode when entering edit mode
    if (state.editing && state.splitMode) {
      state.splitMode = false;
      if (gpxMap) gpxMap.disableSplitMode();
      if (routeEditor) routeEditor.setSplitMode(false);
    }
    
    if (gpxMap) {
      if (state.editing) {
        gpxMap.enableEditing();
      } else {
        gpxMap.disableEditing();
        state.editingSnapshot = null; // Clear snapshot when exiting edit mode
      }
    }
    
    if (routeEditor) {
      routeEditor.setEditMode(state.editing);
    }
  });
  
  // Listen for route reverse
  document.addEventListener('route-reverse', () => {
    if (!state.route) return;
    
    // Save snapshot for undo
    state.originalRoute = structuredClone(state.route);
    
    // Reverse the route
    state.route = reverseRoute(state.route);
    
    // Re-render everything
    refreshAllComponents();
  });
  
  // Listen for route trim
  document.addEventListener('route-trim', (e) => {
    if (!state.route) return;
    
    const { startPct, endPct } = e.detail;
    
    // Save snapshot for undo
    state.originalRoute = structuredClone(state.route);
    
    // Trim the route
    state.route = trimRoute(state.route, startPct, endPct);
    
    // Re-render everything
    refreshAllComponents();
  });
  
  // Listen for route undo
  document.addEventListener('route-undo', () => {
    const snapshot = state.editingSnapshot || state.originalRoute;
    if (snapshot) {
      state.route = structuredClone(snapshot);
      state.originalRoute = null;
      state.editingSnapshot = null;
      refreshAllComponents();
      if (routeEditor) {
        routeEditor.setUndoEnabled(false);
      }
    }
  });
  
  // Listen for route export
  document.addEventListener('route-export', () => {
    if (state.route) {
      exportGPX(state.route);
    }
  });
  
  // Listen for route merge
  document.addEventListener('route-merge', (e) => {
    if (!state.route) return;
    
    const { routeData, mode } = e.detail;
    
    // Save snapshot for undo
    state.originalRoute = structuredClone(state.route);
    
    // Merge the routes
    state.route = mergeRoutes(state.route, routeData, mode || 'append');
    
    // Re-render everything
    refreshAllComponents();
  });
  
  // Listen for route split toggle
  document.addEventListener('route-split-toggle', () => {
    state.splitMode = !state.splitMode;
    
    // Mutual exclusion: exit edit mode when entering split mode
    if (state.splitMode && state.editing) {
      state.editing = false;
      state.editingSnapshot = null;
      if (gpxMap) gpxMap.disableEditing();
      if (routeEditor) routeEditor.setEditMode(false);
    }
    
    if (gpxMap) {
      if (state.splitMode) {
        gpxMap.enableSplitMode();
      } else {
        gpxMap.disableSplitMode();
      }
    }
    
    if (routeEditor) {
      routeEditor.setSplitMode(state.splitMode);
    }
  });
  
  // Listen for split requested (from map click)
  document.addEventListener('split-requested', (e) => {
    if (!state.route) return;
    
    const { index } = e.detail;
    
    try {
      const [routeA, routeB] = splitRoute(state.route, index);
      state.splitRoutes = [routeA, routeB];
      
      // Save snapshot for undo
      state.originalRoute = structuredClone(state.route);
      
      // Load first part as current route
      state.route = routeA;
      refreshAllComponents();
      
      // Auto-export second part
      exportGPX(routeB, routeB.name);
      
      // Exit split mode
      state.splitMode = false;
      if (gpxMap) {
        gpxMap.disableSplitMode();
      }
      if (routeEditor) {
        routeEditor.setSplitMode(false);
      }
    } catch (err) {
      console.error('Split failed:', err.message);
    }
  });
  
  // Listen for 
  
  // Listen for waypoint moved (from map editing)
  document.addEventListener('waypoint-moved', (e) => {
    if (!state.route) return;
    
    const { index, lat, lng } = e.detail;
    
    // Save snapshot for undo (once per editing session)
    if (!state.editingSnapshot) {
      state.editingSnapshot = structuredClone(state.route);
    }
    
    // Update point in state
    updatePointInRoute(state.route, index, lat, lng);
    
    // Recompute metadata
    state.route.metadata = computeMetadata(state.route);
    
    // Update stats and chart (map already updated the polyline)
    if (routeStats) {
      routeStats.update(state.route.metadata);
    }
    
    if (elevationChart) {
      const hasElevation = state.route.tracks.some(t => 
        t.segments.some(s => s.points.some(p => p.ele !== null))
      );
      
      if (hasElevation) {
        const profileData = prepareElevationProfile(state.route);
        elevationChart.loadProfile(profileData);
      }
    }
    
    if (routeEditor) {
      routeEditor.setUndoEnabled(true);
    }
  });
  
  // Listen for waypoint added
  document.addEventListener('waypoint-added', (e) => {
    if (!state.route) return;
    
    const { index, lat, lng } = e.detail;
    
    // Save snapshot for undo
    if (!state.editingSnapshot) {
      state.editingSnapshot = structuredClone(state.route);
    }
    
    // Insert point in route
    insertPointInRoute(state.route, index, lat, lng);
    
    // Recompute metadata
    state.route.metadata = computeMetadata(state.route);
    
    // Re-render everything (need to add new edit marker)
    refreshAllComponents();
    
    if (routeEditor) {
      routeEditor.setUndoEnabled(true);
    }
  });
  
  // Listen for waypoint removed
  document.addEventListener('waypoint-removed', (e) => {
    if (!state.route) return;
    
    const { index } = e.detail;
    
    // Save snapshot for undo
    if (!state.editingSnapshot) {
      state.editingSnapshot = structuredClone(state.route);
    }
    
    // Remove point from route
    removePointFromRoute(state.route, index);
    
    // Recompute metadata
    state.route.metadata = computeMetadata(state.route);
    
    // Re-render everything (need to remove edit marker)
    refreshAllComponents();
    
    if (routeEditor) {
      routeEditor.setUndoEnabled(true);
    }
  });
}

/**
 * Render recent routes list
 */
function renderRecentRoutes() {
  const recentSection = document.querySelector('#recent-section');
  const recentList = document.querySelector('#recent-routes-list');
  if (!recentList) return;
  
  const recent = getRecentRoutes();
  if (recent.length === 0) {
    recentSection.style.display = 'none';
    return;
  }
  
  recentSection.style.display = 'block';
  recentList.innerHTML = ''; // Safe — we only add our own DOM elements below
  
  recent.forEach(route => {
    const item = document.createElement('div');
    item.className = 'recent-route-item';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Load route: ${route.name}`);
    
    const name = document.createElement('span');
    name.className = 'recent-route-name';
    name.textContent = route.name;
    item.appendChild(name);
    
    const meta = document.createElement('span');
    meta.className = 'recent-route-meta';
    meta.textContent = `${(route.distanceKm || 0).toFixed(1)} km · ${new Date(route.date).toLocaleDateString()}`;
    item.appendChild(meta);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'recent-route-delete';
    deleteBtn.textContent = '×';
    deleteBtn.setAttribute('aria-label', `Delete ${route.name}`);
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteRoute(route.id);
      renderRecentRoutes();
    });
    item.appendChild(deleteBtn);
    
    item.addEventListener('click', () => {
      const routeData = loadRoute(route.id);
      if (routeData && Array.isArray(routeData.tracks) && routeData.tracks.length > 0) {
        document.dispatchEvent(new CustomEvent('gpx-loaded', {
          detail: { routeData, fileName: route.name, fromStorage: true }
        }));
      } else {
        // Remove corrupted entry
        deleteRoute(route.id);
        renderRecentRoutes();
      }
    });
    
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
    
    recentList.appendChild(item);
  });
}

/**
 * Prepare elevation profile data from route data
 * @param {RouteData} routeData
 * @returns {Array<{distanceKm: number, elevationM: number}>}
 */
function prepareElevationProfile(routeData) {
  const profileData = [];
  let cumulativeDistanceM = 0;
  
  routeData.tracks.forEach(track => {
    track.segments.forEach(segment => {
      segment.points.forEach((point, i) => {
        // Calculate cumulative distance
        if (i > 0) {
          const prevPoint = segment.points[i - 1];
          cumulativeDistanceM += haversineDistance(
            prevPoint.lat, prevPoint.lng,
            point.lat, point.lng
          );
        }
        
        // Add to profile data (use 0 elevation if null)
        profileData.push({
          distanceKm: cumulativeDistanceM / 1000,
          elevationM: point.ele !== null ? point.ele : 0
        });
      });
    });
  });
  
  return profileData;
}

/**
 * Refresh all components with current route data
 */
function refreshAllComponents() {
  const gpxMap = document.querySelector('gpx-map');
  const routeStats = document.querySelector('route-stats');
  const elevationChart = document.querySelector('elevation-chart');
  const routeEditor = document.querySelector('route-editor');
  
  if (!state.route) return;
  
  // Reload map
  if (gpxMap) {
    gpxMap.loadRoute(state.route);
  }
  
  // Update stats
  if (routeStats) {
    routeStats.update(state.route.metadata);
  }
  
  // Update elevation chart
  if (elevationChart) {
    const hasElevation = state.route.tracks.some(t => 
      t.segments.some(s => s.points.some(p => p.ele !== null))
    );
    
    if (hasElevation) {
      const profileData = prepareElevationProfile(state.route);
      elevationChart.loadProfile(profileData);
    } else {
      elevationChart.clear();
    }
  }
  
  // Update undo button state
  if (routeEditor) {
    routeEditor.setUndoEnabled(!!(state.originalRoute || state.editingSnapshot));
  }
  
  // Re-enable editing if was editing
  if (state.editing && gpxMap) {
    gpxMap.enableEditing();
    if (routeEditor) {
      routeEditor.setEditMode(true);
    }
  }
}

/**
 * Calculate cumulative distance at a specific point index
 * @param {RouteData} routeData
 * @param {number} targetIndex
 * @returns {number} Distance in kilometers
 */
function calculateDistanceAtIndex(routeData, targetIndex) {
  let cumulativeDistanceM = 0;
  let currentIndex = 0;
  
  for (const track of routeData.tracks) {
    for (const segment of track.segments) {
      for (let i = 0; i < segment.points.length; i++) {
        if (i > 0) {
          const prevPoint = segment.points[i - 1];
          const point = segment.points[i];
          cumulativeDistanceM += haversineDistance(
            prevPoint.lat, prevPoint.lng,
            point.lat, point.lng
          );
        }
        
        if (currentIndex === targetIndex) {
          return cumulativeDistanceM / 1000;
        }
        
        currentIndex++;
      }
    }
  }
  
  return cumulativeDistanceM / 1000;
}

/**
 * Update a point in the route data
 * @param {RouteData} routeData
 * @param {number} targetIndex
 * @param {number} lat
 * @param {number} lng
 */
function updatePointInRoute(routeData, targetIndex, lat, lng) {
  let currentIndex = 0;
  
  for (const track of routeData.tracks) {
    for (const segment of track.segments) {
      for (let i = 0; i < segment.points.length; i++) {
        if (currentIndex === targetIndex) {
          segment.points[i].lat = lat;
          segment.points[i].lng = lng;
          return;
        }
        currentIndex++;
      }
    }
  }
}

/**
 * Insert a new point in the route data
 * @param {RouteData} routeData
 * @param {number} targetIndex
 * @param {number} lat
 * @param {number} lng
 */
function insertPointInRoute(routeData, targetIndex, lat, lng) {
  let currentIndex = 0;
  
  for (const track of routeData.tracks) {
    for (const segment of track.segments) {
      for (let i = 0; i < segment.points.length; i++) {
        if (currentIndex === targetIndex) {
          // Interpolate elevation from neighbors
          const prevPoint = i > 0 ? segment.points[i - 1] : null;
          const nextPoint = i < segment.points.length ? segment.points[i] : null;
          let ele = null;
          
          if (prevPoint?.ele !== null && nextPoint?.ele !== null) {
            ele = (prevPoint.ele + nextPoint.ele) / 2;
          }
          
          segment.points.splice(i, 0, { lat, lng, ele, time: null });
          return;
        }
        currentIndex++;
      }
    }
  }
}

/**
 * Remove a point from the route data
 * @param {RouteData} routeData
 * @param {number} targetIndex
 */
function removePointFromRoute(routeData, targetIndex) {
  let currentIndex = 0;
  
  for (const track of routeData.tracks) {
    for (const segment of track.segments) {
      for (let i = 0; i < segment.points.length; i++) {
        if (currentIndex === targetIndex) {
          segment.points.splice(i, 1);
          return;
        }
        currentIndex++;
      }
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

