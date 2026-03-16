/**
 * File Import Component
 * Handles GPX file drag & drop and file picker
 */

import { parseGPX } from '../js/gpx-parser.js';

class FileImport extends HTMLElement {
  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }
  
  disconnectedCallback() {
    this.removeEventListeners();
  }
  
  render() {
    this.innerHTML = `
      <div class="drop-zone" id="drop-zone">
        <svg class="drop-zone-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <div class="drop-zone-text">Drop a GPX file here</div>
        <div class="drop-zone-subtext">or</div>
        <button type="button" class="drop-zone-button" id="file-picker-btn">
          Choose a file
        </button>
        <input type="file" accept=".gpx" class="file-input" id="file-input" />
      </div>
      <div id="status-message"></div>
    `;
  }
  
  attachEventListeners() {
    this.dropZone = this.querySelector('#drop-zone');
    this.fileInput = this.querySelector('#file-input');
    this.filePickerBtn = this.querySelector('#file-picker-btn');
    this.statusMessage = this.querySelector('#status-message');
    
    // Drag & drop events
    this.onDragEnter = this.handleDragEnter.bind(this);
    this.onDragOver = this.handleDragOver.bind(this);
    this.onDragLeave = this.handleDragLeave.bind(this);
    this.onDrop = this.handleDrop.bind(this);
    
    this.dropZone.addEventListener('dragenter', this.onDragEnter);
    this.dropZone.addEventListener('dragover', this.onDragOver);
    this.dropZone.addEventListener('dragleave', this.onDragLeave);
    this.dropZone.addEventListener('drop', this.onDrop);
    
    // File picker
    this.onFilePickerClick = () => this.fileInput.click();
    this.onFileChange = this.handleFileSelect.bind(this);
    
    this.filePickerBtn.addEventListener('click', this.onFilePickerClick);
    this.fileInput.addEventListener('change', this.onFileChange);
  }
  
  removeEventListeners() {
    if (this.dropZone) {
      this.dropZone.removeEventListener('dragenter', this.onDragEnter);
      this.dropZone.removeEventListener('dragover', this.onDragOver);
      this.dropZone.removeEventListener('dragleave', this.onDragLeave);
      this.dropZone.removeEventListener('drop', this.onDrop);
    }
    if (this.filePickerBtn) {
      this.filePickerBtn.removeEventListener('click', this.onFilePickerClick);
    }
    if (this.fileInput) {
      this.fileInput.removeEventListener('change', this.onFileChange);
    }
  }
  
  handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    this.dropZone.classList.add('dragover');
  }
  
  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Only remove dragover if we're leaving the drop zone entirely
    if (!this.dropZone.contains(e.relatedTarget)) {
      this.dropZone.classList.remove('dragover');
    }
  }
  
  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.dropZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  }
  
  handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  }
  
  processFile(file) {
    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      this.showError('Please select a valid GPX file');
      return;
    }
    
    // Read file
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const xmlString = e.target.result;
        const routeData = parseGPX(xmlString);
        
        // Dispatch success event
        document.dispatchEvent(new CustomEvent('gpx-loaded', {
          detail: {
            routeData,
            fileName: file.name
          }
        }));
        
        this.showSuccess(file.name);
      } catch (error) {
        this.showError(error.message);
        
        // Dispatch error event
        document.dispatchEvent(new CustomEvent('gpx-error', {
          detail: {
            message: error.message
          }
        }));
      }
    };
    
    reader.onerror = () => {
      this.showError('Failed to read file');
    };
    
    reader.readAsText(file);
  }
  
  showSuccess(fileName) {
    // Build DOM elements to prevent XSS from malicious filenames
    this.statusMessage.innerHTML = '';
    
    const container = document.createElement('div');
    container.className = 'file-loaded';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'file-loaded-icon');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('d', 'M5 13l4 4L19 7');
    
    svg.appendChild(path);
    container.appendChild(svg);
    
    const textSpan = document.createElement('span');
    textSpan.className = 'file-loaded-text';
    textSpan.textContent = `Loaded: ${fileName}`;
    container.appendChild(textSpan);
    
    this.statusMessage.appendChild(container);
  }
  
  showError(message) {
    this.statusMessage.innerHTML = `
      <div class="file-error">
        <span class="file-error-text">Error: ${message}</span>
      </div>
    `;
  }
}

customElements.define('file-import', FileImport);
