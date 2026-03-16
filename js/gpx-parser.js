/**
 * GPX Parser
 * Converts GPX XML to RouteData object
 */

import { computeMetadata } from './route-utils.js';

/**
 * Parse GPX XML string into RouteData object
 * @param {string} xmlString - GPX XML content
 * @returns {RouteData} Parsed route data
 * @throws {Error} If parsing fails or no valid trackpoints found
 */
export function parseGPX(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid XML format');
  }
  
  // Extract metadata name
  let routeName = 'Untitled Route';
  const metadataName = xmlDoc.querySelector('metadata > name');
  const trackName = xmlDoc.querySelector('trk > name');
  if (metadataName && metadataName.textContent.trim()) {
    routeName = metadataName.textContent.trim();
  } else if (trackName && trackName.textContent.trim()) {
    routeName = trackName.textContent.trim();
  }
  
  // Extract description
  const metadataDesc = xmlDoc.querySelector('metadata > desc');
  const description = metadataDesc ? metadataDesc.textContent.trim() : undefined;
  
  // Parse tracks
  const tracks = [];
  const trackElements = xmlDoc.querySelectorAll('trk');
  
  trackElements.forEach(trkEl => {
    const trackNameEl = trkEl.querySelector('name');
    const trackName = trackNameEl ? trackNameEl.textContent.trim() : undefined;
    
    const segments = [];
    const segmentElements = trkEl.querySelectorAll('trkseg');
    
    segmentElements.forEach(segEl => {
      const points = [];
      const pointElements = segEl.querySelectorAll('trkpt');
      
      pointElements.forEach(ptEl => {
        const lat = parseFloat(ptEl.getAttribute('lat'));
        const lon = parseFloat(ptEl.getAttribute('lon'));
        
        // Skip points without valid lat/lon
        if (isNaN(lat) || isNaN(lon)) {
          return;
        }
        
        const eleEl = ptEl.querySelector('ele');
        const timeEl = ptEl.querySelector('time');
        
        // Validate elevation
        const rawEle = eleEl ? parseFloat(eleEl.textContent) : null;
        const ele = (rawEle !== null && !isNaN(rawEle)) ? rawEle : null;
        
        points.push({
          lat,
          lng: lon,
          ele,
          time: timeEl ? timeEl.textContent.trim() : null
        });
      });
      
      if (points.length > 0) {
        segments.push({ points });
      }
    });
    
    if (segments.length > 0) {
      tracks.push({
        name: trackName,
        segments
      });
    }
  });
  
  // Parse waypoints
  const waypoints = [];
  const waypointElements = xmlDoc.querySelectorAll('wpt');
  
  waypointElements.forEach(wptEl => {
    const lat = parseFloat(wptEl.getAttribute('lat'));
    const lon = parseFloat(wptEl.getAttribute('lon'));
    
    if (isNaN(lat) || isNaN(lon)) {
      return;
    }
    
    const eleEl = wptEl.querySelector('ele');
    const nameEl = wptEl.querySelector('name');
    const descEl = wptEl.querySelector('desc');
    
    // Validate elevation
    const rawEle = eleEl ? parseFloat(eleEl.textContent) : null;
    const ele = (rawEle !== null && !isNaN(rawEle)) ? rawEle : null;
    
    waypoints.push({
      lat,
      lng: lon,
      ele,
      name: nameEl ? nameEl.textContent.trim() : 'Waypoint',
      description: descEl ? descEl.textContent.trim() : undefined
    });
  });
  
  // Validate: must have at least one track with points
  if (tracks.length === 0) {
    throw new Error('No valid tracks found in GPX file');
  }
  
  const totalPoints = tracks.reduce((sum, track) => 
    sum + track.segments.reduce((segSum, seg) => segSum + seg.points.length, 0), 0
  );
  
  if (totalPoints === 0) {
    throw new Error('No valid trackpoints found in GPX file');
  }
  
  // Build initial RouteData object
  const routeData = {
    name: routeName,
    description,
    tracks,
    waypoints
  };
  
  // Calculate metadata using route-utils
  routeData.metadata = computeMetadata(routeData);
  
  return routeData;
}
