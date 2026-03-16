/**
 * Elevation Chart Component
 * Displays an interactive elevation profile using Canvas 2D API
 */

class ElevationChart extends HTMLElement {
  constructor() {
    super();
    this.canvas = null;
    this.ctx = null;
    this.points = [];
    this.hoveredIndex = -1;
    this.resizeTimeout = null;
    
    // Chart dimensions (will be set on render)
    this.width = 0;
    this.height = 0;
    this.padding = { top: 10, right: 10, bottom: 30, left: 50 };
  }
  
  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }
  
  disconnectedCallback() {
    clearTimeout(this.resizeTimeout);
    window.removeEventListener('resize', this.handleResize);
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.handleMouseMove);
      this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    }
  }
  
  render() {
    this.innerHTML = '';
    
    const container = document.createElement('div');
    container.className = 'elevation-chart-container';
    
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'elevation-chart-canvas';
    
    container.appendChild(this.canvas);
    this.appendChild(container);
    
    this.ctx = this.canvas.getContext('2d');
    this.updateCanvasSize();
  }
  
  updateCanvasSize() {
    if (!this.canvas) return;
    
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    
    // Set display size
    const displayWidth = rect.width;
    const displayHeight = window.innerWidth < 768 ? 120 : 150; // Mobile vs desktop
    
    // Set actual size (accounting for device pixel ratio for crisp rendering)
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;
    
    // Set display size via CSS
    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;
    
    // Scale context to match device pixel ratio
    this.ctx.scale(dpr, dpr);
    
    // Store dimensions for drawing calculations
    this.width = displayWidth;
    this.height = displayHeight;
    
    // Redraw if we have data
    if (this.points.length > 0) {
      this.draw();
    }
  }
  
  attachEventListeners() {
    this.handleResize = this.debounce(() => {
      this.updateCanvasSize();
    }, 250);
    
    this.handleMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.handleHover(x, y);
    };
    
    this.handleMouseLeave = () => {
      this.hoveredIndex = -1;
      this.draw();
    };
    
    window.addEventListener('resize', this.handleResize);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
  }
  
  /**
   * Load elevation profile data and render chart
   * @param {Array<{distanceKm: number, elevationM: number}>} points
   */
  loadProfile(points) {
    if (!points || points.length === 0) {
      this.clear();
      return;
    }
    
    // Sample points if too many (>2000 for smooth rendering)
    // Keep track of original indices for event dispatching
    if (points.length > 2000) {
      const step = points.length / 2000;
      this.points = [];
      for (let i = 0; i < points.length; i += step) {
        const idx = Math.floor(i);
        this.points.push({ ...points[idx], originalIndex: idx });
      }
      // Always include last point
      if (this.points[this.points.length - 1].originalIndex !== points.length - 1) {
        this.points.push({ ...points[points.length - 1], originalIndex: points.length - 1 });
      }
    } else {
      this.points = points.map((p, i) => ({ ...p, originalIndex: i }));
    }
    
    this.hoveredIndex = -1;
    
    this.draw();
  }
  

  
  /**
   * Highlight a specific distance on the chart
   * @param {number} km - Distance in kilometers
   */
  highlightDistance(km) {
    // Find the closest point to the given distance
    let closestIndex = 0;
    let minDiff = Infinity;
    
    this.points.forEach((point, index) => {
      const diff = Math.abs(point.distanceKm - km);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });
    
    this.hoveredIndex = closestIndex;
    this.draw();
  }
  
  /**
   * Clear the chart
   */
  clear() {
    this.points = [];
    this.hoveredIndex = -1;
    
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }
  
  /**
   * Show warning message in place of chart
   * @param {string} message - Warning message to display
   */
  showWarning(message) {
    this.points = [];
    this.hoveredIndex = -1;
    
    if (!this.ctx) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw warning background
    this.ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw warning icon (triangle with exclamation mark)
    const centerX = this.width / 2;
    const centerY = this.height / 2 - 10;
    const iconSize = 24;
    
    this.ctx.strokeStyle = '#f59e0b';
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.lineWidth = 2;
    
    // Triangle
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - iconSize / 2);
    this.ctx.lineTo(centerX + iconSize / 2, centerY + iconSize / 2);
    this.ctx.lineTo(centerX - iconSize / 2, centerY + iconSize / 2);
    this.ctx.closePath();
    this.ctx.stroke();
    
    // Exclamation mark
    this.ctx.fillRect(centerX - 1.5, centerY - 8, 3, 10);
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY + 6, 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw warning text
    this.ctx.font = '14px -apple-system, sans-serif';
    this.ctx.fillStyle = '#92400e';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(message, centerX, centerY + iconSize);
  }
  
  /**
   * Draw the elevation profile
   */
  draw() {
    if (!this.ctx || this.points.length === 0) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    const chartWidth = this.width - this.padding.left - this.padding.right;
    const chartHeight = this.height - this.padding.top - this.padding.bottom;
    
    // Calculate min/max values
    const elevations = this.points.map(p => p.elevationM);
    const minElev = Math.min(...elevations);
    const maxElev = Math.max(...elevations);
    const elevRange = maxElev - minElev || 1;
    
    const maxDist = this.points[this.points.length - 1].distanceKm;
    
    // Scale functions
    const scaleX = (km) => this.padding.left + (km / maxDist) * chartWidth;
    const scaleY = (elev) => this.padding.top + chartHeight - ((elev - minElev) / elevRange) * chartHeight;
    
    // Draw filled area with gradient
    this.ctx.beginPath();
    this.ctx.moveTo(scaleX(0), scaleY(this.points[0].elevationM));
    
    this.points.forEach((point, i) => {
      if (i > 0) {
        this.ctx.lineTo(scaleX(point.distanceKm), scaleY(point.elevationM));
      }
    });
    
    // Close path to bottom
    this.ctx.lineTo(scaleX(maxDist), this.height - this.padding.bottom);
    this.ctx.lineTo(scaleX(0), this.height - this.padding.bottom);
    this.ctx.closePath();
    
    // Create gradient (green at low elevation → brown at high)
    const gradient = this.ctx.createLinearGradient(
      0,
      this.height - this.padding.bottom,
      0,
      this.padding.top
    );
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)'); // Green
    gradient.addColorStop(1, 'rgba(120, 53, 15, 0.5)'); // Brown
    
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // Draw line on top
    this.ctx.beginPath();
    this.ctx.moveTo(scaleX(0), scaleY(this.points[0].elevationM));
    
    this.points.forEach((point, i) => {
      if (i > 0) {
        this.ctx.lineTo(scaleX(point.distanceKm), scaleY(point.elevationM));
      }
    });
    
    this.ctx.strokeStyle = 'rgba(37, 99, 235, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Draw axes
    this.drawAxes(chartWidth, chartHeight, maxDist, minElev, maxElev);
    
    // Draw crosshair if hovering
    if (this.hoveredIndex >= 0 && this.hoveredIndex < this.points.length) {
      this.drawCrosshair(this.hoveredIndex, scaleX, scaleY);
    }
  }
  
  /**
   * Draw X and Y axes with labels
   */
  drawAxes(chartWidth, chartHeight, maxDist, minElev, maxElev) {
    this.ctx.strokeStyle = '#e5e7eb';
    this.ctx.lineWidth = 1;
    this.ctx.font = '11px -apple-system, sans-serif';
    this.ctx.fillStyle = '#6b7280';
    
    // Y-axis (elevation)
    this.ctx.beginPath();
    this.ctx.moveTo(this.padding.left, this.padding.top);
    this.ctx.lineTo(this.padding.left, this.height - this.padding.bottom);
    this.ctx.stroke();
    
    // Y-axis labels (3-4 labels)
    const elevStep = Math.ceil((maxElev - minElev) / 3);
    for (let i = 0; i <= 3; i++) {
      const elev = minElev + (elevStep * i);
      const y = this.padding.top + chartHeight - ((elev - minElev) / (maxElev - minElev || 1)) * chartHeight;
      
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`${Math.round(elev)}m`, this.padding.left - 5, y);
    }
    
    // X-axis (distance)
    this.ctx.beginPath();
    this.ctx.moveTo(this.padding.left, this.height - this.padding.bottom);
    this.ctx.lineTo(this.width - this.padding.right, this.height - this.padding.bottom);
    this.ctx.stroke();
    
    // X-axis labels (4-5 labels)
    const distStep = Math.ceil(maxDist / 4);
    for (let i = 0; i <= 4; i++) {
      const dist = distStep * i;
      if (dist > maxDist) break;
      
      const x = this.padding.left + (dist / maxDist) * chartWidth;
      
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(`${dist}km`, x, this.height - this.padding.bottom + 5);
    }
  }
  
  /**
   * Draw crosshair and tooltip at hovered point
   */
  drawCrosshair(index, scaleX, scaleY) {
    const point = this.points[index];
    const x = scaleX(point.distanceKm);
    const y = scaleY(point.elevationM);
    
    // Vertical crosshair line
    this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([3, 3]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(x, this.padding.top);
    this.ctx.lineTo(x, this.height - this.padding.bottom);
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
    
    // Draw point marker
    this.ctx.fillStyle = '#ef4444';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 4, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw tooltip
    const tooltipText = `${point.distanceKm.toFixed(1)}km, ${Math.round(point.elevationM)}m`;
    this.ctx.font = '12px -apple-system, sans-serif';
    const textWidth = this.ctx.measureText(tooltipText).width;
    const tooltipPadding = 6;
    const tooltipWidth = textWidth + tooltipPadding * 2;
    
    // Check if tooltip would go past right edge
    let tooltipX = x + 10;
    if (tooltipX + tooltipWidth > this.width - this.padding.right) {
      // Flip to left side of crosshair
      tooltipX = x - tooltipWidth - 10;
    }
    
    const tooltipY = y - 20;
    
    // Tooltip background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(
      tooltipX - tooltipPadding,
      tooltipY - tooltipPadding - 12,
      tooltipWidth,
      24
    );
    
    // Tooltip text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(tooltipText, tooltipX, tooltipY);
  }
  
  /**
   * Handle mouse hover to find nearest point
   */
  handleHover(mouseX, mouseY) {
    if (this.points.length === 0) return;
    
    const chartWidth = this.width - this.padding.left - this.padding.right;
    
    // Check if mouse is within chart bounds
    if (mouseX < this.padding.left || mouseX > this.width - this.padding.right ||
        mouseY < this.padding.top || mouseY > this.height - this.padding.bottom) {
      this.hoveredIndex = -1;
      this.draw();
      return;
    }
    
    // Find nearest point based on X position
    const maxDist = this.points[this.points.length - 1].distanceKm;
    const hoverDist = ((mouseX - this.padding.left) / chartWidth) * maxDist;
    
    let nearestIndex = 0;
    let minDiff = Infinity;
    
    this.points.forEach((point, index) => {
      const diff = Math.abs(point.distanceKm - hoverDist);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIndex = index;
      }
    });
    
    if (nearestIndex !== this.hoveredIndex) {
      this.hoveredIndex = nearestIndex;
      this.draw();
      
      // Dispatch event for map sync using original index
      const originalIndex = this.points[nearestIndex].originalIndex ?? nearestIndex;
      document.dispatchEvent(new CustomEvent('chart-hover', {
        detail: { index: originalIndex }
      }));
    }
  }
  
  /**
   * Debounce helper for resize events
   */
  debounce(func, wait) {
    return (...args) => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
}

customElements.define('elevation-chart', ElevationChart);
