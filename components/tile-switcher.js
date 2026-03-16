/**
 * Tile Switcher Component
 * Allows switching between different map tile layers
 */

class TileSwitcher extends HTMLElement {
  constructor() {
    super();
    this.activeLayer = 'osm'; // Default active layer
  }
  
  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }
  
  render() {
    this.innerHTML = '';
    
    const container = document.createElement('div');
    container.className = 'tile-switcher';
    
    const layers = [
      { id: 'osm', label: 'OSM' },
      { id: 'topo', label: 'Topo' },
      { id: 'cyclosm', label: 'CyclOSM' }
    ];
    
    layers.forEach(layer => {
      const button = document.createElement('button');
      button.className = 'tile-button';
      button.dataset.layer = layer.id;
      button.textContent = layer.label;
      
      if (layer.id === this.activeLayer) {
        button.classList.add('active');
      }
      
      container.appendChild(button);
    });
    
    this.appendChild(container);
  }
  
  attachEventListeners() {
    const buttons = this.querySelectorAll('.tile-button');
    
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const layer = button.dataset.layer;
        
        // Update active state
        buttons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        this.activeLayer = layer;
        
        // Dispatch event for map to handle
        document.dispatchEvent(new CustomEvent('tile-change', {
          detail: { layer }
        }));
      });
    });
  }
}

customElements.define('tile-switcher', TileSwitcher);
