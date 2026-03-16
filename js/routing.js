/**
 * OSRM Road Routing Module
 * Provides road-following route calculation using the OSRM demo server
 */

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

/**
 * @typedef {Object} Coordinate
 * @property {number} lat - Latitude in degrees
 * @property {number} lng - Longitude in degrees
 */

/**
 * @typedef {Object} TrackPoint
 * @property {number} lat - Latitude in degrees
 * @property {number} lng - Longitude in degrees
 * @property {number|null} ele - Elevation in meters
 * @property {string|null} time - ISO timestamp
 */

/**
 * Convert waypoints array to OSRM coordinate string format
 * OSRM expects: lng,lat;lng,lat;... (note: longitude FIRST)
 * @param {Coordinate[]} waypoints - Array of coordinate objects
 * @returns {string} OSRM-formatted coordinate string
 */
function formatOSRMCoordinates(waypoints) {
  return waypoints
    .map(pt => `${pt.lng},${pt.lat}`)
    .join(';');
}

/**
 * Parse OSRM GeoJSON response to TrackPoint array
 * @param {Object} geojson - OSRM route response
 * @returns {TrackPoint[]|null} Array of track points, or null if invalid
 */
function parseOSRMResponse(geojson) {
  if (!geojson || !geojson.routes || geojson.routes.length === 0) {
    return null;
  }
  
  const route = geojson.routes[0];
  if (!route.geometry || !route.geometry.coordinates) {
    return null;
  }
  
  // GeoJSON coordinates are [lng, lat] format
  return route.geometry.coordinates.map(coord => ({
    lat: coord[1],
    lng: coord[0],
    ele: null,
    time: null
  }));
}

/**
 * Fetch road-following route from OSRM for given waypoints
 * @param {Coordinate[]} waypoints - Array of waypoint coordinates (minimum 2)
 * @returns {Promise<TrackPoint[]|null>} Road route as TrackPoint array, or null on error
 */
export async function fetchRoute(waypoints) {
  if (!waypoints || waypoints.length < 2) {
    console.error('fetchRoute: requires at least 2 waypoints');
    return null;
  }
  
  // Validate coordinates
  const invalid = waypoints.some(pt => 
    typeof pt.lat !== 'number' || typeof pt.lng !== 'number' ||
    !isFinite(pt.lat) || !isFinite(pt.lng) ||
    pt.lat < -90 || pt.lat > 90 || pt.lng < -180 || pt.lng > 180
  );

  if (invalid) {
    console.error('fetchRoute: invalid waypoint coordinates');
    return null;
  }
  
  const coordString = formatOSRMCoordinates(waypoints);
  const url = `${OSRM_BASE_URL}/${coordString}?overview=full&geometries=geojson`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`OSRM request failed: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok') {
      console.error(`OSRM error: ${data.code} - ${data.message || 'Unknown error'}`);
      return null;
    }
    
    return parseOSRMResponse(data);
  } catch (error) {
    console.error('OSRM network error:', error);
    return null;
  }
}

/**
 * Fetch route between two points (convenience wrapper)
 * @param {Coordinate} from - Starting point
 * @param {Coordinate} to - Ending point
 * @returns {Promise<TrackPoint[]|null>} Road route, or null on error
 */
export async function fetchRouteBetweenPair(from, to) {
  return fetchRoute([from, to]);
}

/**
 * Create straight-line fallback route between waypoints
 * Used when OSRM fails
 * @param {Coordinate[]} anchors - Anchor points
 * @returns {TrackPoint[]} Straight-line connected points
 */
function createFallbackRoute(anchors) {
  return anchors.map(anchor => ({
    lat: anchor.lat,
    lng: anchor.lng,
    ele: null,
    time: null
  }));
}

/**
 * Deduplicate consecutive points that are at the same location
 * @param {TrackPoint[]} points - Array of track points
 * @returns {TrackPoint[]} Deduplicated array
 */
function deduplicatePoints(points) {
  if (points.length === 0) return points;
  
  const EPSILON = 0.000001; // ~11cm precision
  const result = [points[0]];
  
  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    
    const isDuplicate = 
      Math.abs(curr.lat - prev.lat) < EPSILON &&
      Math.abs(curr.lng - prev.lng) < EPSILON;
    
    if (!isDuplicate) {
      result.push(curr);
    }
  }
  
  return result;
}

/**
 * Recalculate road route through all anchor points
 * Calls OSRM with all waypoints at once for efficiency
 * @param {Coordinate[]} anchors - Ordered array of anchor/waypoint coordinates
 * @returns {Promise<TrackPoint[]>} Full routed path through all anchors
 */
export async function recalculateSegments(anchors) {
  if (!anchors || anchors.length < 2) {
    console.warn('recalculateSegments: requires at least 2 anchors');
    return anchors ? createFallbackRoute(anchors) : [];
  }
  
  const routedPoints = await fetchRoute(anchors);
  
  if (!routedPoints) {
    console.warn('OSRM routing failed, falling back to straight lines');
    return createFallbackRoute(anchors);
  }
  
  return deduplicatePoints(routedPoints);
}

/**
 * Find the closest point in a route to a given point
 * @param {Coordinate} point - Point to find closest match for
 * @param {TrackPoint[]} route - Route to search
 * @returns {TrackPoint|null} Closest point, or null if route is empty
 */
function findClosestPoint(point, route) {
  if (!route || route.length === 0) return null;
  
  let closest = route[0];
  let minDist = Infinity;
  
  for (const routePoint of route) {
    const latDiff = point.lat - routePoint.lat;
    const lngDiff = point.lng - routePoint.lng;
    const distSq = latDiff * latDiff + lngDiff * lngDiff;
    
    if (distSq < minDist) {
      minDist = distSq;
      closest = routePoint;
    }
  }
  
  return closest;
}

/**
 * Interpolate elevation data from original route onto new routed points
 * For each new point, finds the closest original point and copies its elevation
 * @param {TrackPoint[]} newPoints - New routed points (without elevation)
 * @param {TrackPoint[]} originalPoints - Original route points (with elevation)
 * @returns {TrackPoint[]} New points with interpolated elevation
 */
export function interpolateElevations(newPoints, originalPoints) {
  if (!newPoints || newPoints.length === 0) return newPoints;
  if (!originalPoints || originalPoints.length === 0) return newPoints;
  
  return newPoints.map(newPoint => {
    const closest = findClosestPoint(newPoint, originalPoints);
    
    return {
      ...newPoint,
      ele: closest && closest.ele !== null ? closest.ele : null
    };
  });
}
