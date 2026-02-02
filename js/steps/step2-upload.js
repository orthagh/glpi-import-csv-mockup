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
                    <h2 class="display-6 fw-bold mb-3">Upload Your File</h2>
                    <p class="text-muted">Select a CSV file to import and configure parsing options</p>
                </div>
                
                ${this.renderTemplateDownload()}
                
                ${this.renderApiHint()}
                
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
        
        const dateFormats = [
            { value: 'Y-m-d', label: 'YYYY-MM-DD' },
            { value: 'd-m-Y', label: 'DD-MM-YYYY' },
            { value: 'm-d-Y', label: 'MM-DD-YYYY' },
            { value: 'd.m.Y', label: 'DD.MM.YYYY' },
            { value: 'd/m/Y', label: 'DD/MM/YYYY' }
        ];

        const decimalSeparators = [
            { value: '.', label: 'Point (.)' },
            { value: ',', label: 'Comma (,)' }
        ];
        
        return `
            <div class="format-options">
                <div class="mb-0">
                    <label class="form-label">Delimiter</label>
                    <select class="form-select" id="opt-delimiter">
                        ${delimiters.map(d => `
                            <option value="${d.value}" ${options.delimiter === d.value ? 'selected' : ''}>
                                ${d.label}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="mb-0">
                    <label class="form-label">Encoding</label>
                    <select class="form-select" id="opt-encoding">
                        ${encodings.map(e => `
                            <option value="${e.value}" ${options.encoding === e.value ? 'selected' : ''}>
                                ${e.label}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="mb-0">
                    <label class="form-label">Date Format</label>
                    <select class="form-select" id="opt-date-format">
                        ${dateFormats.map(f => `
                            <option value="${f.value}" ${options.dateFormat === f.value ? 'selected' : ''}>
                                ${f.label}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="mb-0">
                    <label class="form-label">Decimal Separator</label>
                    <select class="form-select" id="opt-decimal-separator">
                        ${decimalSeparators.map(s => `
                            <option value="${s.value}" ${options.decimalSeparator === s.value ? 'selected' : ''}>
                                ${s.label}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="mb-0">
                    <label class="form-label">Skip rows</label>
                    <input type="number" class="form-control" id="opt-skip" 
                        value="${options.skipRows}" min="0" max="100">
                </div>
                
                <div class="mb-0">
                    <label class="form-label">First row is header</label>
                    <div class="form-check form-switch mt-3">
                        <input class="form-check-input" type="checkbox" id="opt-header" 
                            ${options.hasHeader ? 'checked' : ''}>
                    </div>
                </div>

                <div class="mb-0">
                    <label class="form-label">Import Mode</label>
                    <div class="form-check form-switch mt-1">
                        <input class="form-check-input" type="checkbox" id="opt-allow-creation" 
                            ${options.allowCreation !== false ? 'checked' : ''}>
                        <label class="form-check-label" for="opt-allow-creation">Creation</label>
                    </div>
                    <div class="form-check form-switch mt-1">
                        <input class="form-check-input" type="checkbox" id="opt-allow-update" 
                            ${options.allowUpdate !== false ? 'checked' : ''}>
                        <label class="form-check-label" for="opt-allow-update">Update</label>
                    </div>
                </div>

                <div class="mb-0">
                     <label class="form-label">Related Items</label>
                     <div class="form-check form-switch mt-2">
                        <input class="form-check-input" type="checkbox" id="opt-is-relation" 
                            ${options.isRelation ? 'checked' : ''}>
                        <label class="form-check-label" for="opt-is-relation">Create if missing</label>
                    </div>
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
                                <button class="btn btn-outline-primary me-2" id="btn-fast-track-dry-run">
                                    <i class="ti ti-test-pipe me-1"></i>
                                    Dry Run
                                </button>
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
            const showApiBtn = document.getElementById('btn-show-api');
            if (showApiBtn) {
                showApiBtn.addEventListener('click', () => {
                    const container = document.getElementById('api-snippet-container');
                    if (container) {
                        container.classList.toggle('d-none');
                        const isHidden = container.classList.contains('d-none');
                        showApiBtn.innerHTML = isHidden 
                            ? '<i class="ti ti-code me-2"></i>Show Snippet' 
                            : '<i class="ti ti-code-off me-2"></i>Hide Snippet';
                    }
                });
            }

            const fastTrackBtn = document.getElementById('btn-fast-track');
            if (fastTrackBtn) {
                fastTrackBtn.addEventListener('click', () => {
                    this.app.state.autoStartImport = true;
                    this.app.wizard.goToStep(4);
                });
            }

            const downloadExampleBtn = document.getElementById('btn-download-example');
            if (downloadExampleBtn) {
                downloadExampleBtn.addEventListener('click', () => {
                    this.downloadTemplateExample();
                });
            }

            const fastTrackDryRunBtn = document.getElementById('btn-fast-track-dry-run');
            if (fastTrackDryRunBtn) {
                fastTrackDryRunBtn.addEventListener('click', () => {
                    this.app.state.autoStartDryRun = true;
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

        // New options
        const optDateFormat = document.getElementById('opt-date-format');
        const optDecimalSeparator = document.getElementById('opt-decimal-separator');
        const optAllowCreation = document.getElementById('opt-allow-creation');
        const optAllowUpdate = document.getElementById('opt-allow-update');
        const optIsRelation = document.getElementById('opt-is-relation');

        if (optDateFormat) {
            optDateFormat.addEventListener('change', (e) => {
                this.app.state.formatOptions.dateFormat = e.target.value;
            });
        }

        if (optDecimalSeparator) {
            optDecimalSeparator.addEventListener('change', (e) => {
                this.app.state.formatOptions.decimalSeparator = e.target.value;
            });
        }

        if (optAllowCreation) {
            optAllowCreation.addEventListener('change', (e) => {
                this.app.state.formatOptions.allowCreation = e.target.checked;
            });
        }

        if (optAllowUpdate) {
            optAllowUpdate.addEventListener('change', (e) => {
                this.app.state.formatOptions.allowUpdate = e.target.checked;
            });
        }

        if (optIsRelation) {
            optIsRelation.addEventListener('change', (e) => {
                this.app.state.formatOptions.isRelation = e.target.checked;
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
     * Render template download option
     * @returns {string}
     */
    renderTemplateDownload() {
        if (this.app.state.mode !== 'template' || !this.app.state.selectedTemplate || this.app.state.file) {
            return '';
        }

        const template = this.app.state.selectedTemplate;
        
        return `
            <div class="card mb-4">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between">
                        <div>
                            <div class="d-flex align-items-center mb-1">
                                <i class="ti ti-file-type-csv me-2 fs-2 text-primary"></i>
                                <h4 class="card-title mb-0">Using Template: ${this.escapeHtml(template.name)}</h4>
                            </div>
                            <div class="text-muted small">
                                This template expects specific columns. Download an example file to get started.
                            </div>
                        </div>
                        <button class="btn btn-outline-primary" id="btn-download-example">
                            <i class="ti ti-download me-2"></i>
                            Download Example CSV
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Download example CSV based on template mappings
     */
    downloadTemplateExample() {
        const template = this.app.state.selectedTemplate;
        const delimiter = this.app.state.formatOptions.delimiter || ';';
        
        if (!template || !template.mappings) return;

        // Extract headers from mappings
        // Filter out any mappings that might not have a CSV header (though they should)
        const headers = template.mappings
            .map(m => m.csvHeader)
            .filter(h => h);
            
        if (headers.length === 0) {
            alert('This template has no mapped columns.');
            return;
        }

        // Create CSV content
        // Quote headers if they contain the delimiter or quotes
        const csvContent = headers.map(h => {
            if (h.includes(delimiter) || h.includes('"') || h.includes('\n')) {
                return `"${h.replace(/"/g, '""')}"`;
            }
            return h;
        }).join(delimiter);

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_example.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Render API hint
     * @returns {string}
     */
    renderApiHint() {
        if (this.app.state.mode !== 'template' || !this.app.state.selectedTemplate || this.app.state.file) {
            return '';
        }

        const template = this.app.state.selectedTemplate;
        const type = this.escapeHtml(template.glpiType || 'Computer');
        
        // Syntax highlighting styles (Monokai-ish)
        const s = {
            cmd: 'color: #66d9ef; font-weight: bold;', // Blue
            flag: 'color: #f92672;',                   // Pink
            str: 'color: #e6db74;',                    // Yellow
            kw: 'color: #ae81ff;',                     // Purple
            base: 'color: #f8f8f2;'                    // White-ish
        };
        
        return `
            <div class="card mb-4" id="api-hint-card">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between">
                        <div>
                            <div class="d-flex align-items-center mb-1">
                                <i class="ti ti-api me-2 fs-2 text-primary"></i>
                                <h4 class="card-title mb-0">API Usage</h4>
                            </div>
                            <div class="text-muted small">
                                Automate your imports using this template via the API.
                            </div>
                        </div>
                        <button class="btn btn-outline-primary" id="btn-show-api">
                            <i class="ti ti-code me-2"></i>
                            Show Snippet
                        </button>
                    </div>
                    
                    <div id="api-snippet-container" class="mt-3 d-none">
                        <div class="bg-dark text-white p-3 rounded position-relative">
                            <button class="btn btn-sm btn-ghost-light position-absolute top-0 end-0 m-2 p-1" 
                                onclick="navigator.clipboard.writeText(this.nextElementSibling.textContent.trim())" 
                                title="Copy to clipboard">
                                <i class="ti ti-copy"></i>
                            </button>
                            <pre class="m-0 pe-4 small font-monospace" style="white-space: pre-wrap; ${s.base}"><span style="${s.cmd}">curl</span> <span style="${s.flag}">-X</span> <span style="${s.str}">'<span style="${s.kw}">POST</span>'</span> \\
  <span style="${s.str}">'http://your-glpi/api.php/Assets/${type}/import'</span> \\
  <span style="${s.flag}">-H</span> <span style="${s.str}">'accept: application/json'</span> \\
  <span style="${s.flag}">-H</span> <span style="${s.str}">'Authorization: Bearer YOUR_TOKEN'</span> \\
  <span style="${s.flag}">-F</span> <span style="${s.str}">"file=@data.csv"</span> \\
  <span style="${s.flag}">-H</span> <span style="${s.str}">'Content-Type: text/csv'</span> \\
  <span style="${s.flag}">-d</span> <span style="${s.str}">'{\n    "templates_id": "${template.id}"\n  }'</span></pre>
                        </div>
                        <div class="text-muted small mt-2">
                            <i class="ti ti-info-circle me-1"></i>
                            Replace tokens and URL with your instance details.
                        </div>
                    </div>
                </div>
            </div>
        `;
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
