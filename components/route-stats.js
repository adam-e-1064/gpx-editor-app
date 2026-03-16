/**
 * Route Stats Component
 * Displays route metadata in a grid layout
 */

class RouteStats extends HTMLElement {
  connectedCallback() {
    // Initialize with empty state
    this.render();
  }
  
  /**
   * Update stats display with new metadata
   * @param {RouteMetadata} metadata - Route metadata object
   */
  update(metadata) {
    if (!metadata) return;
    
    // Clear existing content
    this.innerHTML = '';
    
    // Create stats grid container
    const grid = document.createElement('div');
    grid.className = 'stats-grid';
    
    // Helper to create stat item
    const createStatItem = (label, value) => {
      const item = document.createElement('div');
      item.className = 'stat-item';
      
      const labelEl = document.createElement('span');
      labelEl.className = 'stat-label';
      labelEl.textContent = label;
      
      const valueEl = document.createElement('span');
      valueEl.className = 'stat-value';
      valueEl.textContent = value;
      
      item.appendChild(labelEl);
      item.appendChild(valueEl);
      
      return item;
    };
    
    // Format time helper
    const formatTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      
      if (hours === 0) {
        return `${mins}min`;
      }
      
      return `${hours}h ${mins}min`;
    };
    
    // Create stat items
    grid.appendChild(createStatItem('Distance', `${metadata.totalDistanceKm.toFixed(1)} km`));
    grid.appendChild(createStatItem('Elevation Gain', `${metadata.elevationGainM.toLocaleString()} m`));
    grid.appendChild(createStatItem('Elevation Loss', `${metadata.elevationLossM.toLocaleString()} m`));
    grid.appendChild(createStatItem('Max Elevation', `${metadata.maxElevationM.toLocaleString()} m`));
    grid.appendChild(createStatItem('Min Elevation', `${metadata.minElevationM.toLocaleString()} m`));
    grid.appendChild(createStatItem('Est. Time', formatTime(metadata.estimatedTimeMin)));
    grid.appendChild(createStatItem('Points', metadata.pointCount.toLocaleString()));
    
    this.appendChild(grid);
  }
  
  render() {
    // Initial empty render
    this.innerHTML = '';
    const placeholder = document.createElement('p');
    placeholder.className = 'stats-placeholder';
    placeholder.textContent = 'Load a GPX file to see route statistics';
    this.appendChild(placeholder);
  }
}

customElements.define('route-stats', RouteStats);
