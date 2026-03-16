/**
 * GPX Export Module
 * Serializes RouteData to GPX 1.1 XML and triggers download
 */

/**
 * Export route data as a GPX 1.1 file
 * @param {RouteData} routeData - Route data to export
 * @param {string} [filename] - Optional filename (without .gpx extension)
 */
export function exportGPX(routeData, filename) {
  const xml = serializeToGPX(routeData);
  downloadFile(xml, filename || routeData.name || 'route', 'application/gpx+xml');
}

/**
 * Serialize RouteData object to GPX 1.1 XML string
 * @param {RouteData} routeData
 * @returns {string} GPX XML string
 */
export function serializeToGPX(routeData) {
  const lines = [];
  
  // XML declaration
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  
  // GPX root element with namespace
  lines.push('<gpx version="1.1" creator="MotoRoute" xmlns="http://www.topografix.com/GPX/1/1">');
  
  // Metadata
  lines.push('  <metadata>');
  lines.push(`    <name>${escapeXml(routeData.name || 'Route')}</name>`);
  if (routeData.description) {
    lines.push(`    <desc>${escapeXml(routeData.description)}</desc>`);
  }
  lines.push(`    <time>${new Date().toISOString()}</time>`);
  lines.push('  </metadata>');
  
  // Waypoints
  if (routeData.waypoints && routeData.waypoints.length > 0) {
    routeData.waypoints.forEach(waypoint => {
      const lat = waypoint.lat.toFixed(6);
      const lng = waypoint.lng.toFixed(6);
      lines.push(`  <wpt lat="${lat}" lon="${lng}">`);
      
      if (waypoint.ele !== null) {
        lines.push(`    <ele>${waypoint.ele.toFixed(1)}</ele>`);
      }
      
      lines.push(`    <name>${escapeXml(waypoint.name)}</name>`);
      
      if (waypoint.description) {
        lines.push(`    <desc>${escapeXml(waypoint.description)}</desc>`);
      }
      
      lines.push('  </wpt>');
    });
  }
  
  // Tracks
  routeData.tracks.forEach(track => {
    lines.push('  <trk>');
    
    if (track.name) {
      lines.push(`    <name>${escapeXml(track.name)}</name>`);
    }
    
    track.segments.forEach(segment => {
      lines.push('    <trkseg>');
      
      segment.points.forEach(point => {
        const lat = point.lat.toFixed(6);
        const lng = point.lng.toFixed(6);
        lines.push(`      <trkpt lat="${lat}" lon="${lng}">`);
        
        if (point.ele !== null) {
          lines.push(`        <ele>${point.ele.toFixed(1)}</ele>`);
        }
        
        if (point.time !== null) {
          lines.push(`        <time>${escapeXml(point.time)}</time>`);
        }
        
        lines.push('      </trkpt>');
      });
      
      lines.push('    </trkseg>');
    });
    
    lines.push('  </trk>');
  });
  
  // Close GPX root element
  lines.push('</gpx>');
  
  return lines.join('\n');
}

/**
 * Escape XML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeXml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (c) => {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;'
    };
    return escapeMap[c];
  });
}

/**
 * Trigger file download
 * @param {string} content - File content
 * @param {string} filename - File name (without extension)
 * @param {string} mimeType - MIME type
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(filename)}.gpx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Sanitize filename — remove special characters, limit length
 * @param {string} name
 * @returns {string}
 */
function sanitizeFilename(name) {
  return name
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100) || 'route';
}
