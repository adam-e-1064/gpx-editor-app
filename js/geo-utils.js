/**
 * Geospatial Utility Functions
 * Pure functions for geographic calculations
 */

const EARTH_RADIUS_M = 6371000; // Earth radius in meters

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point (degrees)
 * @param {number} lng1 - Longitude of first point (degrees)
 * @param {number} lat2 - Latitude of second point (degrees)
 * @param {number} lng2 - Longitude of second point (degrees)
 * @returns {number} Distance in meters
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_M * c;
}

/**
 * Calculate bearing between two points
 * @param {number} lat1 - Latitude of first point (degrees)
 * @param {number} lng1 - Longitude of first point (degrees)
 * @param {number} lat2 - Latitude of second point (degrees)
 * @param {number} lng2 - Longitude of second point (degrees)
 * @returns {number} Bearing in degrees (0-360)
 */
export function bearing(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  
  const dLng = toRad(lng2 - lng1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  
  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
           Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
  
  const bearingDeg = toDeg(Math.atan2(y, x));
  
  return (bearingDeg + 360) % 360;
}
