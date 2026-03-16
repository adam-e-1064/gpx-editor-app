/**
 * Route Editor Component
 * Provides UI controls for editing routes (reverse, trim, merge, split, export, undo)
 */

import { parseGPX } from '../js/gpx-parser.js';

class RouteEditor extends HTMLElement {
  constructor() {
    super();
    this.editMode = false;
    this.splitMode = false;
    this.boundHandlers = {};
  }
  
  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }
  
  disconnectedCallback() {
    // Clean up event listeners
    const editBtn = this.querySelector('[data-action="edit-toggle"]');
    const reverseBtn = this.querySelector('[data-action="reverse"]');
    const undoBtn = this.querySelector('[data-action="undo"]');
    const mergeBtn = this.querySelector('[data-action="merge"]');
    const splitBtn = this.querySelector('[data-action="split"]');
    const exportBtn = this.querySelector('[data-action="export"]');
    const applyBtn = this.querySelector('[data-action="apply-trim"]');
    const startSlider = this.querySelector('.trim-start');
    const endSlider = this.querySelector('.trim-end');
    const mergeInput = this.querySelector('.merge-file-input');
    
    if (editBtn && this.boundHandlers.editToggle) {
      editBtn.removeEventListener('click', this.boundHandlers.editToggle);
    }
    if (reverseBtn && this.boundHandlers.reverse) {
      reverseBtn.removeEventListener('click', this.boundHandlers.reverse);
    }
    if (undoBtn && this.boundHandlers.undo) {
      undoBtn.removeEventListener('click', this.boundHandlers.undo);
    }
    if (mergeBtn && this.boundHandlers.merge) {
      mergeBtn.removeEventListener('click', this.boundHandlers.merge);
    }
    if (splitBtn && this.boundHandlers.split) {
      splitBtn.removeEventListener('click', this.boundHandlers.split);
    }
    if (exportBtn && this.boundHandlers.export) {
      exportBtn.removeEventListener('click', this.boundHandlers.export);
    }
    if (applyBtn && this.boundHandlers.applyTrim) {
      applyBtn.removeEventListener('click', this.boundHandlers.applyTrim);
    }
    if (startSlider && this.boundHandlers.startSliderInput) {
      startSlider.removeEventListener('input', this.boundHandlers.startSliderInput);
    }
    if (endSlider && this.boundHandlers.endSliderInput) {
      endSlider.removeEventListener('input', this.boundHandlers.endSliderInput);
    }
    if (mergeInput && this.boundHandlers.mergeFileChange) {
      mergeInput.removeEventListener('change', this.boundHandlers.mergeFileChange);
    }
  }
  
  render() {
    const container = document.createElement('div');
    container.className = 'route-editor';
    
    // Editor controls
    const controls = document.createElement('div');
    controls.className = 'editor-controls';
    
    // Edit toggle button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-secondary';
    editBtn.setAttribute('data-action', 'edit-toggle');
    const editSpan = document.createElement('span');
    editSpan.textContent = 'Edit Route';
    editBtn.appendChild(editSpan);
    controls.appendChild(editBtn);
    
    // Reverse button
    const reverseBtn = document.createElement('button');
    reverseBtn.className = 'btn btn-secondary';
    reverseBtn.setAttribute('data-action', 'reverse');
    const reverseSpan = document.createElement('span');
    reverseSpan.textContent = 'Reverse';
    reverseBtn.appendChild(reverseSpan);
    controls.appendChild(reverseBtn);
    
    // Undo button
    const undoBtn = document.createElement('button');
    undoBtn.className = 'btn btn-secondary';
    undoBtn.setAttribute('data-action', 'undo');
    undoBtn.disabled = true;
    const undoSpan = document.createElement('span');
    undoSpan.textContent = 'Undo';
    undoBtn.appendChild(undoSpan);
    controls.appendChild(undoBtn);
    
    // Merge button
    const mergeBtn = document.createElement('button');
    mergeBtn.className = 'btn btn-secondary';
    mergeBtn.setAttribute('data-action', 'merge');
    const mergeSpan = document.createElement('span');
    mergeSpan.textContent = 'Merge';
    mergeBtn.appendChild(mergeSpan);
    controls.appendChild(mergeBtn);
    
    // Split button
    const splitBtn = document.createElement('button');
    splitBtn.className = 'btn btn-secondary';
    splitBtn.setAttribute('data-action', 'split');
    const splitSpan = document.createElement('span');
    splitSpan.textContent = 'Split';
    splitBtn.appendChild(splitSpan);
    controls.appendChild(splitBtn);
    
    // Export button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-export';
    exportBtn.setAttribute('data-action', 'export');
    const exportSpan = document.createElement('span');
    exportSpan.textContent = 'Export GPX';
    exportBtn.appendChild(exportSpan);
    controls.appendChild(exportBtn);
    
    // Hidden file input for merge
    const mergeInput = document.createElement('input');
    mergeInput.type = 'file';
    mergeInput.className = 'merge-file-input';
    mergeInput.accept = '.gpx';
    mergeInput.style.display = 'none';
    controls.appendChild(mergeInput);
    
    container.appendChild(controls);
    
    // Trim controls (hidden by default)
    const trimControls = document.createElement('div');
    trimControls.className = 'trim-controls';
    trimControls.style.display = 'none';
    
    const trimLabel = document.createElement('label');
    trimLabel.textContent = 'Trim Route';
    trimControls.appendChild(trimLabel);
    
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'trim-slider-container';
    
    const startSlider = document.createElement('input');
    startSlider.type = 'range';
    startSlider.className = 'trim-start';
    startSlider.min = 0;
    startSlider.max = 100;
    startSlider.value = 0;
    startSlider.step = 1;
    sliderContainer.appendChild(startSlider);
    
    const endSlider = document.createElement('input');
    endSlider.type = 'range';
    endSlider.className = 'trim-end';
    endSlider.min = 0;
    endSlider.max = 100;
    endSlider.value = 100;
    endSlider.step = 1;
    sliderContainer.appendChild(endSlider);
    
    trimControls.appendChild(sliderContainer);
    
    const labelsContainer = document.createElement('div');
    labelsContainer.className = 'trim-labels';
    
    const startLabel = document.createElement('span');
    startLabel.className = 'trim-start-label';
    startLabel.textContent = 'Start: 0%';
    labelsContainer.appendChild(startLabel);
    
    const endLabel = document.createElement('span');
    endLabel.className = 'trim-end-label';
    endLabel.textContent = 'End: 100%';
    labelsContainer.appendChild(endLabel);
    
    trimControls.appendChild(labelsContainer);
    
    const applyBtn = document.createElement('button');
    applyBtn.className = 'btn btn-primary btn-sm';
    applyBtn.setAttribute('data-action', 'apply-trim');
    const applySpan = document.createElement('span');
    applySpan.textContent = 'Apply Trim';
    applyBtn.appendChild(applySpan);
    trimControls.appendChild(applyBtn);
    
    container.appendChild(trimControls);
    
    this.appendChild(container);
  }
  
  attachEventListeners() {
    // Edit toggle
    const editBtn = this.querySelector('[data-action="edit-toggle"]');
    this.boundHandlers.editToggle = () => {
      document.dispatchEvent(new CustomEvent('route-edit-toggle'));
    };
    editBtn?.addEventListener('click', this.boundHandlers.editToggle);
    
    // Reverse
    const reverseBtn = this.querySelector('[data-action="reverse"]');
    this.boundHandlers.reverse = () => {
      document.dispatchEvent(new CustomEvent('route-reverse'));
    };
    reverseBtn?.addEventListener('click', this.boundHandlers.reverse);
    
    // Undo
    const undoBtn = this.querySelector('[data-action="undo"]');
    this.boundHandlers.undo = () => {
      document.dispatchEvent(new CustomEvent('route-undo'));
    };
    undoBtn?.addEventListener('click', this.boundHandlers.undo);
    
    // Merge
    const mergeBtn = this.querySelector('[data-action="merge"]');
    const mergeInput = this.querySelector('.merge-file-input');
    
    this.boundHandlers.merge = (e) => {
      this.mergeShiftKey = e.shiftKey;
      mergeInput?.click();
    };
    mergeBtn?.addEventListener('click', this.boundHandlers.merge);
    
    // Merge file input change
    this.boundHandlers.mergeFileChange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const routeData = parseGPX(text);
        
        // Determine merge mode: default to 'append', hold Shift for 'separate'
        const mode = this.mergeShiftKey ? 'separate' : 'append';
        this.mergeShiftKey = false;
        
        document.dispatchEvent(new CustomEvent('route-merge', {
          detail: { routeData, mode }
        }));
        
        // Reset file input
        e.target.value = '';
      } catch (err) {
        console.error('Merge failed:', err.message);
        // Could dispatch an error event here if needed
      }
    };
    mergeInput?.addEventListener('change', this.boundHandlers.mergeFileChange);
    
    // Split
    const splitBtn = this.querySelector('[data-action="split"]');
    this.boundHandlers.split = () => {
      document.dispatchEvent(new CustomEvent('route-split-toggle'));
    };
    splitBtn?.addEventListener('click', this.boundHandlers.split);
    
    // Export
    const exportBtn = this.querySelector('[data-action="export"]');
    this.boundHandlers.export = () => {
      document.dispatchEvent(new CustomEvent('route-export'));
    };
    exportBtn?.addEventListener('click', this.boundHandlers.export);
    
    // Trim sliders
    const startSlider = this.querySelector('.trim-start');
    const endSlider = this.querySelector('.trim-end');
    const startLabel = this.querySelector('.trim-start-label');
    const endLabel = this.querySelector('.trim-end-label');
    
    this.boundHandlers.startSliderInput = () => {
      let startVal = parseInt(startSlider.value, 10);
      const endVal = parseInt(endSlider.value, 10);
      if (startVal >= endVal - 5) {
        startVal = endVal - 5;
        startSlider.value = startVal;
      }
      startLabel.textContent = `Start: ${startVal}%`;
    };
    
    this.boundHandlers.endSliderInput = () => {
      let endVal = parseInt(endSlider.value, 10);
      const startVal = parseInt(startSlider.value, 10);
      if (endVal <= startVal + 5) {
        endVal = startVal + 5;
        endSlider.value = endVal;
      }
      endLabel.textContent = `End: ${endVal}%`;
    };
    
    startSlider?.addEventListener('input', this.boundHandlers.startSliderInput);
    endSlider?.addEventListener('input', this.boundHandlers.endSliderInput);
    
    // Apply trim
    const applyBtn = this.querySelector('[data-action="apply-trim"]');
    this.boundHandlers.applyTrim = () => {
      const startPct = parseInt(startSlider.value, 10);
      const endPct = 100 - parseInt(endSlider.value, 10);
      
      document.dispatchEvent(new CustomEvent('route-trim', {
        detail: { startPct, endPct }
      }));
      
      // Reset sliders
      startSlider.value = 0;
      endSlider.value = 100;
      startLabel.textContent = 'Start: 0%';
      endLabel.textContent = 'End: 100%';
    };
    applyBtn?.addEventListener('click', this.boundHandlers.applyTrim);
  }
  
  /**
   * Enable or disable the undo button
   * @param {boolean} enabled
   */
  setUndoEnabled(enabled) {
    const undoBtn = this.querySelector('[data-action="undo"]');
    if (undoBtn) {
      undoBtn.disabled = !enabled;
    }
  }
  
  /**
   * Set edit mode state and update button appearance
   * @param {boolean} active
   */
  setEditMode(active) {
    this.editMode = active;
    const editBtn = this.querySelector('[data-action="edit-toggle"]');
    const trimControls = this.querySelector('.trim-controls');
    
    if (editBtn) {
      if (active) {
        editBtn.classList.add('active');
        editBtn.querySelector('span').textContent = 'Stop Editing';
      } else {
        editBtn.classList.remove('active');
        editBtn.querySelector('span').textContent = 'Edit Route';
      }
    }
    
    // Show/hide trim controls
    if (trimControls) {
      trimControls.style.display = active ? 'block' : 'none';
    }
  }
  
  /**
   * Set split mode state and update button appearance
   * @param {boolean} active
   */
  setSplitMode(active) {
    this.splitMode = active;
    const splitBtn = this.querySelector('[data-action="split"]');
    
    if (splitBtn) {
      if (active) {
        splitBtn.classList.add('active');
        splitBtn.querySelector('span').textContent = 'Cancel Split';
      } else {
        splitBtn.classList.remove('active');
        splitBtn.querySelector('span').textContent = 'Split';
      }
    }
  }
}

customElements.define('route-editor', RouteEditor);
