/**
 * GPX Map Component
 * Renders routes on Leaflet map with markers and polyline
 */

import { haversineDistance } from '../js/geo-utils.js';

class GpxMap extends HTMLElement {
  constructor() {
    super();
    this.map = null;
    this.routeLayer = null;
    this.highlightMarker = null;
    this.currentTileLayer = null;
    this.allPoints = []; // Store all route points for highlighting
    this.editMarkers = []; // Store edit markers
    this.isEditing = false;
    this.splitMode = false;
    this.splitMarker = null; // Store split preview marker
    this.polyline = null; // Store polyline reference for editing
  }
  
  connectedCallback() {
    this.render();
    this.initMap();
  }
  
  disconnectedCallback() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
  
  render() {
    this.innerHTML = '<div id="map"></div>';
  }
  
  initMap() {
    const mapEl = this.querySelector('#map');
    
    // Initialize Leaflet map
    this.map = L.map(mapEl, {
      center: [40.4168, -3.7038], // Default: Madrid
      zoom: 6,
      zoomControl: true
    });
    
    // Add default OpenStreetMap tile layer
    this.currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);
    
    // Initialize layer group for route elements
    this.routeLayer = L.layerGroup().addTo(this.map);
  }
  
  /**
   * Load and render a route on the map
   * @param {RouteData} routeData
   */
  loadRoute(routeData) {
    this.clearRoute();
    
    if (!routeData || !routeData.tracks || routeData.tracks.length === 0) {
      return;
    }
    
    // Collect all points for polyline and bounds
    this.allPoints = [];
    const latLngs = [];
    
    routeData.tracks.forEach(track => {
      track.segments.forEach(segment => {
        segment.points.forEach(point => {
          this.allPoints.push(point);
          latLngs.push([point.lat, point.lng]);
        });
      });
    });
    
    if (latLngs.length === 0) {
      return;
    }
    
    // Create polyline
    this.polyline = L.polyline(latLngs, {
      color: '#2563eb',
      weight: 4,
      opacity: 0.7
    });
    
    // Add hover event to polyline
    this.polyline.on('mouseover', (e) => {
      const latlng = e.latlng;
      const index = this.findNearestPointIndex(this.allPoints, latlng);
      
      document.dispatchEvent(new CustomEvent('point-hover', {
        detail: { index }
      }));
    });
    
    // Add click event for adding waypoints when editing
    this.polyline.on('click', (e) => {
      if (this.isEditing) {
        const latlng = e.latlng;
        const index = this.findNearestPointIndex(this.allPoints, latlng);
        
        document.dispatchEvent(new CustomEvent('waypoint-added', {
          detail: { index, lat: latlng.lat, lng: latlng.lng }
        }));
      }
    });
    
    this.routeLayer.addLayer(this.polyline);
    
    // Add start marker (green)
    const startPoint = this.allPoints[0];
    const startMarker = L.marker([startPoint.lat, startPoint.lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    });
    startMarker.bindPopup('<b>Start</b>');
    this.routeLayer.addLayer(startMarker);
    
    // Add end marker (red)
    const endPoint = this.allPoints[this.allPoints.length - 1];
    const endMarker = L.marker([endPoint.lat, endPoint.lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    });
    endMarker.bindPopup('<b>End</b>');
    this.routeLayer.addLayer(endMarker);
    
    // Add waypoint markers (blue)
    if (routeData.waypoints && routeData.waypoints.length > 0) {
      routeData.waypoints.forEach(waypoint => {
        const marker = L.marker([waypoint.lat, waypoint.lng], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        });
        
        // Build popup content using DOM elements to prevent XSS
        const div = document.createElement('div');
        const nameEl = document.createElement('b');
        nameEl.textContent = waypoint.name;
        div.appendChild(nameEl);
        
        if (waypoint.description) {
          div.appendChild(document.createElement('br'));
          const descEl = document.createElement('span');
          descEl.textContent = waypoint.description;
          div.appendChild(descEl);
        }
        
        if (waypoint.ele !== null) {
          div.appendChild(document.createElement('br'));
          const eleEl = document.createElement('span');
          eleEl.textContent = `Elevation: ${Math.round(waypoint.ele)}m`;
          div.appendChild(eleEl);
        }
        
        marker.bindPopup(div);
        this.routeLayer.addLayer(marker);
      });
    }
    
    // Fit map to route bounds
    this.map.fitBounds(this.polyline.getBounds(), {
      padding: [50, 50]
    });
  }
  
  /**
   * Clear all route layers from map
   */
  clearRoute() {
    this.disableEditing();
    if (this.routeLayer) {
      this.routeLayer.clearLayers();
    }
    if (this.highlightMarker) {
      this.map.removeLayer(this.highlightMarker);
      this.highlightMarker = null;
    }
    this.allPoints = [];
    this.polyline = null;
  }
  
  /**
   * Highlight a specific point on the route
   * @param {number} index - Index of trackpoint to highlight
   */
  highlightPoint(index) {
    if (!this.allPoints || index < 0 || index >= this.allPoints.length) return;
    
    // Remove previous highlight marker
    if (this.highlightMarker) {
      this.map.removeLayer(this.highlightMarker);
      this.highlightMarker = null;
    }
    
    const point = this.allPoints[index];
    
    // Create a pulsing circle marker
    this.highlightMarker = L.circleMarker([point.lat, point.lng], {
      radius: 8,
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.6,
      weight: 2,
      className: 'pulse-marker'
    }).addTo(this.map);
  }
  
  /**
   * Switch to a different tile layer
   * @param {string} layerName - 'osm', 'topo', or 'cyclosm'
   */
  setTileLayer(layerName) {
    // Remove current tile layer
    if (this.currentTileLayer) {
      this.map.removeLayer(this.currentTileLayer);
    }
    
    // Define tile layer URLs and attributions
    const tileLayers = {
      osm: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      },
      topo: {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
        maxZoom: 17
      },
      cyclosm: {
        url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Style: <a href="https://www.cyclosm.org">CyclOSM</a>',
        maxZoom: 20
      }
    };
    
    // Get the selected layer config (default to OSM if invalid)
    const layerConfig = tileLayers[layerName] || tileLayers.osm;
    
    // Create and add new tile layer
    this.currentTileLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom
    }).addTo(this.map);
  }
  
  /**
   * Find the nearest point index to a given lat/lng
   * @param {TrackPoint[]} points
   * @param {L.LatLng} latlng
   * @returns {number}
   */
  findNearestPointIndex(points, latlng) {
    let minDist = Infinity;
    let nearestIndex = 0;
    
    points.forEach((point, index) => {
      const dist = haversineDistance(
        point.lat, point.lng,
        latlng.lat, latlng.lng
      );
      
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = index;
      }
    });
    
    return nearestIndex;
  }
  
  /**
   * Enable editing mode - make waypoints draggable and allow click-to-add
   */
  enableEditing() {
    if (this.isEditing || this.allPoints.length === 0) return;
    
    this.isEditing = true;
    
    // Sample points for large routes (max ~100 editable markers)
    const totalPoints = this.allPoints.length;
    const maxMarkers = 100;
    const step = totalPoints > maxMarkers ? Math.floor(totalPoints / maxMarkers) : 1;
    
    // Create draggable markers
    for (let i = 0; i < totalPoints; i += step) {
      const actualIndex = i;
      const point = this.allPoints[actualIndex];
      
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 6,
        fillColor: '#2563eb',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.8,
        className: 'edit-marker',
        draggable: false
      });
      
      // Make marker interactive for dragging
      marker.on('mousedown', (e) => {
        L.DomEvent.stopPropagation(e);
        this.startDragging(marker, actualIndex);
      });
      
      // Right-click or long-press to remove
      marker.on('contextmenu', (e) => {
        L.DomEvent.preventDefault(e);
        L.DomEvent.stopPropagation(e);
        
        document.dispatchEvent(new CustomEvent('waypoint-removed', {
          detail: { index: actualIndex }
        }));
      });
      
      this.editMarkers.push({ marker, actualIndex });
      this.routeLayer.addLayer(marker);
    }
  }
  
  /**
   * Start dragging a marker
   * @param {L.CircleMarker} marker
   * @param {number} actualIndex
   */
  startDragging(marker, actualIndex) {
    const map = this.map;
    
    const onMouseMove = (e) => {
      marker.setLatLng(e.latlng);
      // Update polyline with new position
      this.updatePolylinePoint(actualIndex, e.latlng);
    };
    
    const onMouseUp = (e) => {
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      
      // Dispatch waypoint-moved event
      const latlng = marker.getLatLng();
      document.dispatchEvent(new CustomEvent('waypoint-moved', {
        detail: { index: actualIndex, lat: latlng.lat, lng: latlng.lng }
      }));
      
      // Re-enable map dragging
      map.dragging.enable();
    };
    
    // Disable map dragging while dragging marker
    map.dragging.disable();
    
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
  }
  
  /**
   * Update a point in the polyline (for real-time visual feedback)
   * @param {number} index
   * @param {L.LatLng} latlng
   */
  updatePolylinePoint(index, latlng) {
    if (!this.polyline) return;
    
    const latLngs = this.polyline.getLatLngs();
    if (index >= 0 && index < latLngs.length) {
      latLngs[index] = latlng;
      this.polyline.setLatLngs(latLngs);
    }
    
    // Update the point in allPoints
    if (index >= 0 && index < this.allPoints.length) {
      this.allPoints[index].lat = latlng.lat;
      this.allPoints[index].lng = latlng.lng;
    }
  }
  
  /**
   * Disable editing mode - remove edit markers
   */
  disableEditing() {
    if (!this.isEditing) return;
    
    this.isEditing = false;
    
    // Clean up any active drag listeners
    this.map.off('mousemove');
    this.map.off('mouseup');
    this.map.dragging.enable();
    
    // Remove all edit markers
    this.editMarkers.forEach(({ marker }) => {
      this.routeLayer.removeLayer(marker);
    });
    this.editMarkers = [];
  }
  
  /**
   * Enable split mode - clicking on route shows split preview and triggers split
   */
  enableSplitMode() {
    if (this.splitMode || this.allPoints.length === 0) return;
    
    this.splitMode = true;
    
    // Change cursor on polyline
    if (this.polyline) {
      this.polyline.setStyle({ cursor: 'crosshair' });
      
      // Override the click handler for split mode
      this.polyline.off('click'); // Remove any existing click handlers
      this.polyline.on('click', (e) => {
        const latlng = e.latlng;
        const index = this.findNearestPointIndex(this.allPoints, latlng);
        
        // Show split preview marker
        this.showSplitPreview(latlng);
        
        // Dispatch split-requested event
        document.dispatchEvent(new CustomEvent('split-requested', {
          detail: { index }
        }));
      });
    }
  }
  
  /**
   * Disable split mode - restore normal polyline behavior
   */
  disableSplitMode() {
    if (!this.splitMode) return;
    
    this.splitMode = false;
    
    // Remove split preview marker
    if (this.splitMarker) {
      this.map.removeLayer(this.splitMarker);
      this.splitMarker = null;
    }
    
    // Restore cursor and click behavior
    if (this.polyline) {
      this.polyline.setStyle({ cursor: 'pointer' });
      
      // Restore original click handler
      this.polyline.off('click');
      
      // Re-add editing click handler if in edit mode
      if (this.isEditing) {
        this.polyline.on('click', (e) => {
          const latlng = e.latlng;
          const index = this.findNearestPointIndex(this.allPoints, latlng);
          
          document.dispatchEvent(new CustomEvent('waypoint-added', {
            detail: { index, lat: latlng.lat, lng: latlng.lng }
          }));
        });
      } else {
        // Re-add hover handler for normal mode
        this.polyline.on('mouseover', (e) => {
          const latlng = e.latlng;
          const index = this.findNearestPointIndex(this.allPoints, latlng);
          
          document.dispatchEvent(new CustomEvent('point-hover', {
            detail: { index }
          }));
        });
      }
    }
  }
  
  /**
   * Show split preview marker at clicked position
   * @param {L.LatLng} latlng
   */
  showSplitPreview(latlng) {
    // Remove previous split marker
    if (this.splitMarker) {
      this.map.removeLayer(this.splitMarker);
    }
    
    // Create red circle marker to indicate split point
    this.splitMarker = L.circleMarker([latlng.lat, latlng.lng], {
      radius: 10,
      fillColor: '#ef4444',
      color: '#ffffff',
      weight: 3,
      fillOpacity: 0.9,
      className: 'split-marker'
    }).addTo(this.map);
    
    this.splitMarker.bindPopup('<b>Split Point</b>').openPopup();
  }
}

customElements.define('gpx-map', GpxMap);
