/**
 * Storage Module
 * localStorage wrapper for route persistence and user preferences
 */

const KEYS = {
  RECENT: 'motoroute_recent',
  ROUTE_PREFIX: 'motoroute_route_',
  PREFERENCES: 'motoroute_preferences'
};

const MAX_RECENT = 10;

/**
 * Save a route to localStorage
 * @param {RouteData} routeData
 * @returns {string} Route ID
 */
export function saveRoute(routeData) {
  const id = `route_${Date.now()}`;
  
  // Save route data
  try {
    localStorage.setItem(KEYS.ROUTE_PREFIX + id, JSON.stringify(routeData));
  } catch (e) {
    // localStorage might be full — remove oldest route and retry
    const recent = getRecentRoutes();
    if (recent.length > 0) {
      deleteRoute(recent[recent.length - 1].id);
      try {
        localStorage.setItem(KEYS.ROUTE_PREFIX + id, JSON.stringify(routeData));
      } catch {
        console.warn('Unable to save route: storage full');
        return null;
      }
    }
    return null;
  }
  
  // Update recent routes list
  const recent = getRecentRoutes();
  const summary = {
    id,
    name: routeData.name || 'Untitled Route',
    date: new Date().toISOString(),
    distanceKm: routeData.metadata?.totalDistanceKm || 0,
    pointCount: routeData.metadata?.pointCount || 0
  };
  
  recent.unshift(summary);
  
  // Keep only MAX_RECENT
  while (recent.length > MAX_RECENT) {
    const removed = recent.pop();
    localStorage.removeItem(KEYS.ROUTE_PREFIX + removed.id);
  }
  
  localStorage.setItem(KEYS.RECENT, JSON.stringify(recent));
  return id;
}

/**
 * Load a route from localStorage
 * @param {string} id - Route ID
 * @returns {RouteData|null}
 */
export function loadRoute(id) {
  const data = localStorage.getItem(KEYS.ROUTE_PREFIX + id);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Get list of recent routes (summaries only)
 * @returns {Array<{id, name, date, distanceKm, pointCount}>}
 */
export function getRecentRoutes() {
  const data = localStorage.getItem(KEYS.RECENT);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Delete a route from localStorage
 * @param {string} id - Route ID
 */
export function deleteRoute(id) {
  localStorage.removeItem(KEYS.ROUTE_PREFIX + id);
  const recent = getRecentRoutes().filter(r => r.id !== id);
  localStorage.setItem(KEYS.RECENT, JSON.stringify(recent));
}

/**
 * Save user preferences
 * @param {Object} prefs
 */
export function savePreferences(prefs) {
  localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(prefs));
}

/**
 * Load user preferences
 * @returns {Object}
 */
export function loadPreferences() {
  const data = localStorage.getItem(KEYS.PREFERENCES);
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}
