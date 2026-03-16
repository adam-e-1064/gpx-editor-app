/**
 * Route Utility Functions
 * Pure functions for route calculations and metadata computation
 */

import { haversineDistance } from './geo-utils.js';

/**
 * Compute route metadata from RouteData
 * @param {RouteData} routeData - Route data object with tracks
 * @returns {RouteMetadata} Computed metadata
 */
export function computeMetadata(routeData) {
  const { tracks } = routeData;
  
  let totalDistanceM = 0;
  let elevationGainM = 0;
  let elevationLossM = 0;
  let maxElevationM = -Infinity;
  let minElevationM = Infinity;
  let pointCount = 0;
  
  const ELEVATION_NOISE_THRESHOLD = 1; // meters - ignore changes < 1m to filter GPS noise
  const DEFAULT_AVG_SPEED_KMH = 60; // km/h for estimated time
  
  tracks.forEach(track => {
    track.segments.forEach(segment => {
      const points = segment.points;
      pointCount += points.length;
      
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        
        // Track elevation extremes
        if (point.ele !== null) {
          maxElevationM = Math.max(maxElevationM, point.ele);
          minElevationM = Math.min(minElevationM, point.ele);
        }
        
        // Calculate distance and elevation changes
        if (i > 0) {
          const prevPoint = points[i - 1];
          
          // Distance calculation
          totalDistanceM += haversineDistance(
            prevPoint.lat, prevPoint.lng,
            point.lat, point.lng
          );
          
          // Elevation gain/loss with noise threshold
          if (point.ele !== null && prevPoint.ele !== null) {
            const elevChange = point.ele - prevPoint.ele;
            
            if (Math.abs(elevChange) > ELEVATION_NOISE_THRESHOLD) {
              if (elevChange > 0) {
                elevationGainM += elevChange;
              } else {
                elevationLossM += Math.abs(elevChange);
              }
            }
          }
        }
      }
    });
  });
  
  // Handle case where no elevation data exists
  if (!isFinite(maxElevationM)) maxElevationM = 0;
  if (!isFinite(minElevationM)) minElevationM = 0;
  
  // Convert distance to km
  const totalDistanceKm = totalDistanceM / 1000;
  
  // Estimate time based on average speed
  const estimatedTimeMin = (totalDistanceKm / DEFAULT_AVG_SPEED_KMH) * 60;
  
  return {
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    elevationGainM: Math.round(elevationGainM),
    elevationLossM: Math.round(elevationLossM),
    maxElevationM: Math.round(maxElevationM),
    minElevationM: Math.round(minElevationM),
    estimatedTimeMin: Math.round(estimatedTimeMin),
    pointCount
  };
}

/**
 * Reverse a route — flip all segments, swap start/end
 * @param {RouteData} routeData - Original route data
 * @returns {RouteData} New reversed route data (deep copy, does not mutate input)
 */
export function reverseRoute(routeData) {
  // Deep clone to avoid mutating the input
  const reversed = structuredClone(routeData);
  
  // Reverse tracks array
  reversed.tracks.reverse();
  
  // Reverse segments within each track
  reversed.tracks.forEach(track => {
    track.segments.reverse();
    
    // Reverse points within each segment
    track.segments.forEach(segment => {
      segment.points.reverse();
    });
  });
  
  // Reverse waypoints if they exist
  if (reversed.waypoints && reversed.waypoints.length > 0) {
    reversed.waypoints.reverse();
  }
  
  // Recompute metadata
  reversed.metadata = computeMetadata(reversed);
  
  return reversed;
}

/**
 * Trim a route by percentage from start and end
 * @param {RouteData} routeData - Original route data
 * @param {number} startPct - Percentage to cut from start (0-100)
 * @param {number} endPct - Percentage to cut from end (0-100)
 * @returns {RouteData} New trimmed route data (deep copy, does not mutate input)
 */
export function trimRoute(routeData, startPct, endPct) {
  // Flatten all points across all tracks/segments
  const allPoints = [];
  routeData.tracks.forEach(track => {
    track.segments.forEach(segment => {
      segment.points.forEach(point => {
        allPoints.push(point);
      });
    });
  });
  
  if (allPoints.length === 0) {
    return structuredClone(routeData);
  }
  
  // Calculate indices
  const totalPoints = allPoints.length;
  const startIndex = Math.floor(totalPoints * startPct / 100);
  const endIndex = Math.ceil(totalPoints * (100 - endPct) / 100);
  
  // Ensure valid range
  const validStartIndex = Math.max(0, Math.min(startIndex, totalPoints - 1));
  const validEndIndex = Math.max(validStartIndex + 1, Math.min(endIndex, totalPoints));
  
  // Slice the points
  const trimmedPoints = allPoints.slice(validStartIndex, validEndIndex);
  
  // Create new RouteData with single track and single segment
  const trimmed = {
    name: routeData.name ? `${routeData.name} (trimmed)` : 'Trimmed Route',
    description: routeData.description,
    tracks: [
      {
        name: 'Trimmed Track',
        segments: [
          {
            points: trimmedPoints
          }
        ]
      }
    ],
    waypoints: [],
    metadata: null
  };
  
  // Recompute metadata
  trimmed.metadata = computeMetadata(trimmed);
  
  return trimmed;
}

/**
 * Merge two routes
 * @param {RouteData} routeA - First route
 * @param {RouteData} routeB - Second route
 * @param {'append'|'separate'} mode - 'append' connects end of A to start of B in one segment; 'separate' keeps as distinct tracks
 * @returns {RouteData} New merged route data
 */
export function mergeRoutes(routeA, routeB, mode) {
  const merged = structuredClone(routeA);
  
  if (mode === 'append') {
    // Flatten all points from both routes, combine into single track/segment
    const allPointsA = [];
    routeA.tracks.forEach(t => t.segments.forEach(s => allPointsA.push(...s.points)));
    const allPointsB = [];
    routeB.tracks.forEach(t => t.segments.forEach(s => allPointsB.push(...s.points)));
    
    merged.tracks = [{
      name: merged.name || 'Merged Route',
      segments: [{ points: [...allPointsA, ...allPointsB] }]
    }];
  } else {
    // 'separate' — add routeB's tracks as additional tracks
    const clonedB = structuredClone(routeB);
    merged.tracks.push(...clonedB.tracks);
  }
  
  // Merge waypoints
  if (routeB.waypoints && routeB.waypoints.length > 0) {
    const clonedWaypoints = structuredClone(routeB.waypoints);
    merged.waypoints = [...(merged.waypoints || []), ...clonedWaypoints];
  }
  
  merged.name = `${routeA.name || 'Route A'} + ${routeB.name || 'Route B'}`;
  merged.metadata = computeMetadata(merged);
  
  return merged;
}

/**
 * Split route at a specific point index into two independent RouteData objects
 * @param {RouteData} routeData - Route to split
 * @param {number} splitIndex - Global point index to split at (this point goes to second route)
 * @returns {[RouteData, RouteData]} Array of two RouteData objects
 */
export function splitRoute(routeData, splitIndex) {
  // Flatten all points
  const allPoints = [];
  routeData.tracks.forEach(t => t.segments.forEach(s => allPoints.push(...s.points)));
  
  if (splitIndex <= 0 || splitIndex >= allPoints.length) {
    throw new Error('Split index out of range');
  }
  
  const pointsA = allPoints.slice(0, splitIndex);
  const pointsB = allPoints.slice(splitIndex);
  
  const routeA = {
    name: `${routeData.name || 'Route'} (Part 1)`,
    description: routeData.description,
    tracks: [{ name: 'Part 1', segments: [{ points: pointsA }] }],
    waypoints: [],
    metadata: null
  };
  routeA.metadata = computeMetadata(routeA);
  
  const routeB = {
    name: `${routeData.name || 'Route'} (Part 2)`,
    description: routeData.description,
    tracks: [{ name: 'Part 2', segments: [{ points: pointsB }] }],
    waypoints: [],
    metadata: null
  };
  routeB.metadata = computeMetadata(routeB);
  
  // Distribute waypoints to the closest route based on position
  // Simple approach: waypoints before splitIndex go to A, rest to B
  if (routeData.waypoints && routeData.waypoints.length > 0) {
    routeData.waypoints.forEach(waypoint => {
      // Find which route the waypoint is closer to by comparing to split point
      const lastPointA = pointsA[pointsA.length - 1];
      const firstPointB = pointsB[0];
      const distToA = haversineDistance(waypoint.lat, waypoint.lng, lastPointA.lat, lastPointA.lng);
      const distToB = haversineDistance(waypoint.lat, waypoint.lng, firstPointB.lat, firstPointB.lng);
      
      if (distToA < distToB) {
        routeA.waypoints.push(structuredClone(waypoint));
      } else {
        routeB.waypoints.push(structuredClone(waypoint));
      }
    });
  }
  
  return [routeA, routeB];
}
