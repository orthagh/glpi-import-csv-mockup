/**
 * Step 2: File Upload & Preview
 * Upload CSV file, configure format options, preview data
 */

import { CsvParser } from '../services/csv-parser.js';

export class Step2Upload {
    constructor(app) {
        this.app = app;
    }
    
    /**
     * Render step content
     */
    render() {
        const container = document.getElementById('wizard-content');
        const hasFile = this.app.state.file !== null;
        
        container.innerHTML = `
            <div class="step-content">
                <div class="text-center mb-4">
                    <h2 class="h3 mb-2">Upload Your File</h2>
                    <p class="text-muted">Select a CSV file to import and configure parsing options</p>
                </div>
                
                ${!hasFile ? this.renderDropzone() : this.renderFileInfo()}
                
                ${hasFile && this.app.state.mode !== 'template' ? this.renderFormatOptions() : ''}
                
                ${hasFile && this.app.state.mode === 'template' ? this.renderFastTrack() : ''}
                
                ${hasFile && this.app.state.mode !== 'template' ? this.renderPreview() : ''}
            </div>
        `;
        
        this.bindEvents();
    }
    
    /**
     * Render file dropzone
     * @returns {string}
     */
    renderDropzone() {
        return `
            <div class="dropzone" id="dropzone">
                <div class="dropzone-icon">
                    <i class="ti ti-cloud-upload"></i>
                </div>
                <div class="dropzone-text">
                    <strong>Drop your CSV file here</strong> or click to browse
                </div>
                <div class="dropzone-hint">
                    Supports .csv, .txt files up to 10MB
                </div>
                <input type="file" id="file-input" accept=".csv,.txt" class="d-none">
            </div>
        `;
    }
    
    /**
     * Render file info card
     * @returns {string}
     */
    renderFileInfo() {
        const file = this.app.state.file;
        const csvData = this.app.state.csvData;
        
        return `
            <div class="file-info-card">
                <div class="file-info-icon">
                    <i class="ti ti-file-check"></i>
                </div>
                <div class="file-info-details">
                    <div class="file-info-name">${this.escapeHtml(file.name)}</div>
                    <div class="file-info-meta">
                        ${this.formatFileSize(file.size)} &bull; 
                        ${csvData ? csvData.data.length + ' rows' : 'Parsing...'} &bull;
                        ${csvData ? csvData.headers.length + ' columns' : ''}
                    </div>
                </div>
                <button class="btn btn-ghost-secondary btn-icon" id="remove-file" title="Remove file">
                    <i class="ti ti-x"></i>
                </button>
            </div>
        `;
    }
    
    /**
     * Render format options
     * @returns {string}
     */
    renderFormatOptions() {
        const options = this.app.state.formatOptions;
        const delimiters = CsvParser.getDelimiters();
        const encodings = CsvParser.getEncodings();
        
        return `
            <div class="format-options">
                <div class="mb-0">
                    <label class="form-label">Delimiter</label>
                    <select class="form-select form-select-sm" id="opt-delimiter">
                        ${delimiters.map(d => `
                            <option value="${d.value}" ${options.delimiter === d.value ? 'selected' : ''}>
                                ${d.label}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="mb-0">
                    <label class="form-label">Encoding</label>
                    <select class="form-select form-select-sm" id="opt-encoding">
                        ${encodings.map(e => `
                            <option value="${e.value}" ${options.encoding === e.value ? 'selected' : ''}>
                                ${e.label}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="mb-0">
                    <label class="form-label">First row is header</label>
                    <div class="form-check form-switch mt-2">
                        <input class="form-check-input" type="checkbox" id="opt-header" 
                            ${options.hasHeader ? 'checked' : ''}>
                    </div>
                </div>
                
                <div class="mb-0">
                    <label class="form-label">Skip rows</label>
                    <input type="number" class="form-control form-control-sm" id="opt-skip" 
                        value="${options.skipRows}" min="0" max="100">
                </div>
            </div>
        `;
    }
    
    /**
     * Render CSV preview table
     * @returns {string}
     */
    renderPreview() {
        const csvData = this.app.state.csvData;
        
        if (!csvData || csvData.data.length === 0) {
            return `
                <div class="csv-preview">
                    <div class="alert alert-warning mt-3">
                        <i class="ti ti-alert-triangle me-2"></i>
                        No data found in file. Check your format options.
                    </div>
                </div>
            `;
        }
        
        // Show first 5 rows as preview
        const previewRows = csvData.data.slice(0, 5);
        const hasMoreRows = csvData.data.length > 5;
        
        return `
            <div class="csv-preview mt-4">
                <h4 class="mb-3">
                    <i class="ti ti-table me-2"></i>
                    Preview
                    <span class="text-muted fw-normal ms-2">(first ${previewRows.length} of ${csvData.data.length} rows)</span>
                </h4>
                <div class="table-responsive">
                    <table class="table table-bordered table-sm">
                        <thead>
                            <tr>
                                <th class="row-number">#</th>
                                ${csvData.headers.map((h, i) => `
                                    <th title="Column ${i + 1}">${this.escapeHtml(h)}</th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${previewRows.map((row, i) => `
                                <tr>
                                    <td class="row-number">${i + 1}</td>
                                    ${row.map(cell => `
                                        <td title="${this.escapeHtml(cell)}">${this.escapeHtml(cell)}</td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${hasMoreRows ? `
                    <div class="text-muted small mt-2">
                        <i class="ti ti-dots me-1"></i>
                        And ${csvData.data.length - 5} more rows
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Render Fast Track UI for templates
     * @returns {string}
     */
    renderFastTrack() {
        const canFastTrack = this.canFastTrack;
        
        return `
            <div class="card bg-primary-lt mt-4">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <i class="ti ti-template fs-1 text-primary"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h4 class="card-title m-0">Template Matched</h4>
                            <div class="text-muted small">
                                ${canFastTrack 
                                    ? 'File structure matches the selected template. You can skip mapping.' 
                                    : 'Some columns from the template are missing in this file. Please review mappings.'}
                            </div>
                        </div>
                        <div class="ms-3">
                            ${canFastTrack ? `
                                <button class="btn btn-primary" id="btn-fast-track">
                                    <i class="ti ti-player-play me-1"></i>
                                    Import Now
                                </button>
                            ` : `
                                <button class="btn btn-secondary" onclick="window.csvImportApp.wizard.nextStep()">
                                    Review Mappings
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
            
            <details class="mt-3">
                <summary class="text-muted small cursor-pointer">Show CSV Preview & Options</summary>
                
                <div class="mt-3">
                    ${this.renderFormatOptions()}
                </div>
                
                ${this.renderPreview()}
            </details>
        `;
    }

    /**
     * Bind event handlers
     */
    bindEvents() {
        // Fast track button
        setTimeout(() => {
            const fastTrackBtn = document.getElementById('btn-fast-track');
            if (fastTrackBtn) {
                fastTrackBtn.addEventListener('click', () => {
                    this.app.wizard.goToStep(4);
                });
            }
        }, 0);

        const container = document.getElementById('wizard-content');
        
        // Dropzone
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('file-input');
        
        if (dropzone && fileInput) {
            dropzone.addEventListener('click', () => fileInput.click());
            
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });
            
            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });
            
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFile(files[0]);
                }
            });
            
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFile(e.target.files[0]);
                }
            });
        }
        
        // Remove file button
        const removeBtn = document.getElementById('remove-file');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.app.state.file = null;
                this.app.state.csvData = null;
                this.render();
                this.app.wizard.refreshButtons();
            });
        }
        
        // Format options
        const optDelimiter = document.getElementById('opt-delimiter');
        const optEncoding = document.getElementById('opt-encoding');
        const optHeader = document.getElementById('opt-header');
        const optSkip = document.getElementById('opt-skip');
        
        if (optDelimiter) {
            optDelimiter.addEventListener('change', (e) => {
                this.app.state.formatOptions.delimiter = e.target.value;
                this.reparse();
            });
        }
        
        if (optEncoding) {
            optEncoding.addEventListener('change', (e) => {
                this.app.state.formatOptions.encoding = e.target.value;
                this.reparse();
            });
        }
        
        if (optHeader) {
            optHeader.addEventListener('change', (e) => {
                this.app.state.formatOptions.hasHeader = e.target.checked;
                this.reparse();
            });
        }
        
        if (optSkip) {
            optSkip.addEventListener('change', (e) => {
                this.app.state.formatOptions.skipRows = parseInt(e.target.value) || 0;
                this.reparse();
            });
        }
    }
    
    /**
     * Handle file selection
     * @param {File} file
     */
    async handleFile(file) {
        // Validate file type
        if (!file.name.match(/\.(csv|txt)$/i)) {
            alert('Please select a CSV or TXT file');
            return;
        }
        
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            alert('File is too large. Maximum size is 10MB.');
            return;
        }
        
        this.app.state.file = file;
        
        // Auto-detect delimiter from first chunk
        const reader = new FileReader();
        reader.onload = async (e) => {
            const sample = e.target.result.slice(0, 2000);
            const detectedDelimiter = CsvParser.detectDelimiter(sample);
            this.app.state.formatOptions.delimiter = detectedDelimiter;
            
            await this.parseFile();
        };
        reader.readAsText(file);
    }
    
    /**
     * Parse the current file with current options
     */
    async parseFile() {
        if (!this.app.state.file) return;
        
        try {
            const result = await CsvParser.parse(
                this.app.state.file,
                this.app.state.formatOptions
            );
            
            this.app.state.csvData = result;
            
            // If we have existing mappings (from template), reconcile them with new file headers
            if (this.app.state.mappings.length > 0 && result.headers) {
                 this.reconcileMappings(result.headers);
            } 
            // Initialize mappings if empty
            else if (this.app.state.mappings.length === 0 && result.headers) {
                this.app.state.mappings = result.headers.map((header, index) => ({
                    csvColumn: index,
                    csvHeader: header,
                    glpiField: null,
                    isReconciliationKey: false
                }));
            }
            
            this.render();
            this.app.wizard.refreshButtons();
        } catch (error) {
            console.error('Parse error:', error);
            alert('Failed to parse CSV file: ' + error.message);
        }
    }
    
    /**
     * Re-parse file with updated options
     */
    async reparse() {
        if (this.app.state.file) {
            // Reset mappings to regenerate with new headers
            this.app.state.mappings = [];
            await this.parseFile();
        }
    }
    
    /**
     * Escape HTML entities
     * @param {string} str
     * @returns {string}
     */
    escapeHtml(str) {
        if (str === null || str === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }
    
    /**
     * Reconcile template mappings with new file headers
     * @param {Array} headers 
     */
    reconcileMappings(headers) {
        let matchedCount = 0;
        let totalMapped = 0;
        
        this.app.state.mappings.forEach(mapping => {
            const index = headers.indexOf(mapping.csvHeader);
            
            if (mapping.glpiField) {
                totalMapped++;
                if (index !== -1) {
                    mapping.csvColumn = index;
                    matchedCount++;
                } else {
                    mapping.csvColumn = -1;
                    // Keep glpiField but it's now broken
                }
            } else if (index !== -1) {
                mapping.csvColumn = index;
            }
        });
        
        // Fast track possible if all previously mapped fields are found
        this.canFastTrack = totalMapped > 0 && matchedCount === totalMapped;
    }

    /**
     * Format file size
     * @param {number} bytes
     * @returns {string}
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}
