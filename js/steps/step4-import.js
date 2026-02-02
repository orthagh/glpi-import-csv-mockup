/**
 * Step 4: Import Execution & Report
 * Run the import with progress indication and display final report
 */

import { MockGlpi } from '../services/mock-glpi.js';

export class Step4Import {
    constructor(app) {
        this.app = app;
        this.isImporting = false;
        this.importComplete = false;
        this.isDryRun = false;
        this.searchQuery = '';
    }
    
    /**
     * Render step content
     */
    render() {
        const container = document.getElementById('wizard-content');
        
        // Auto-start import if flag is set
        if (this.app.state.autoStartImport && !this.isImporting && !this.importComplete) {
            this.app.state.autoStartImport = false;
            this.startImport(false);
            return;
        }

        // Auto-start dry run if flag is set
        if (this.app.state.autoStartDryRun && !this.isImporting && !this.importComplete) {
            this.app.state.autoStartDryRun = false;
            this.startImport(true);
            return;
        }
        
        if (this.importComplete && this.app.state.importResults) {
            container.innerHTML = this.renderReport();
        } else if (this.isImporting) {
            container.innerHTML = this.renderProgress();
        } else {
            container.innerHTML = this.renderSummary();
        }
        
        this.bindEvents();
    }
    
    /**
     * Render import summary before starting
     * @returns {string}
     */
    renderSummary() {
        const state = this.app.state;
        const mappedFields = state.mappings.filter(m => m.glpiField).length;
        
        return `
            <div class="step-content">
                <div class="text-center mb-4">
                    <div class="illustration illustration-large">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
                            <rect x="25" y="40" width="70" height="50" rx="4" fill="#e9ecef" stroke="#ced4da" stroke-width="2"/>
                            <rect x="35" y="50" width="50" height="6" rx="2" fill="#adb5bd"/>
                            <rect x="35" y="62" width="50" height="6" rx="2" fill="#adb5bd"/>
                            <rect x="35" y="74" width="30" height="6" rx="2" fill="#adb5bd"/>
                            <circle cx="95" cy="85" r="20" fill="#206bc4" stroke="white" stroke-width="3"/>
                            <path d="M88 85l5 5l10 -10" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h2 class="display-6 fw-bold mb-3">Ready to Import</h2>
                    <p class="text-muted">Review your settings and start the import</p>
                </div>
                
                <div class="import-summary">
                    <div class="import-summary-item">
                        <span class="text-muted">File</span>
                        <strong>${this.escapeHtml(state.file?.name || 'Unknown')}</strong>
                    </div>
                    <div class="import-summary-item">
                        <span class="text-muted">Target Type</span>
                        <strong>${state.glpiType || 'Not selected'}</strong>
                    </div>
                    <div class="import-summary-item">
                        <span class="text-muted">Rows to Import</span>
                        <strong>${state.csvData?.data.length || 0}</strong>
                    </div>
                    <div class="import-summary-item">
                        <span class="text-muted">Mapped Fields</span>
                        <strong>${mappedFields} of ${state.mappings.length}</strong>
                    </div>
                    <div class="import-summary-item">
                        <span class="text-muted">Reconciliation Keys</span>
                        <strong>${state.mappings.filter(m => m.isReconciliationKey).length}</strong>
                    </div>
                </div>
                
                <div class="text-center mt-4 d-flex justify-content-center gap-3">
                    <button class="btn btn-ghost-secondary" onclick="window.csvImportApp.wizard.prevStep()">
                        Back
                    </button>
                    <button class="btn btn-outline-primary" id="start-dry-run">
                        <i class="ti ti-test-pipe me-2"></i>
                        Dry Run
                    </button>
                    <button class="btn btn-success" id="start-import">
                        <i class="ti ti-player-play me-2"></i>
                        Start Import
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Render progress during import
     * @returns {string}
     */
    renderProgress() {
        return `
            <div class="step-content">
                <div class="text-center mb-4">
                    <h2 class="display-6 fw-bold mb-3">${this.isDryRun ? 'Simulating Import...' : 'Importing...'}</h2>
                    <p class="text-muted">Please wait while your data is being processed</p>
                </div>
                
                <div class="import-progress-container">
                    <div class="import-progress-info">
                        <span id="progress-text">Starting...</span>
                        <span id="progress-percent">0%</span>
                    </div>
                    <div class="progress progress-lg">
                        <div class="progress-bar progress-bar-striped progress-bar-animated" 
                             id="progress-bar" 
                             role="progressbar" 
                             style="width: 0%">
                        </div>
                    </div>
                </div>
                
                <div class="import-log-filters mb-2">
                    <div class="input-icon">
                        <span class="input-icon-addon">
                            <i class="ti ti-search"></i>
                        </span>
                        <input type="text" id="log-filter" class="form-control" placeholder="Filter by status, row, or message..." value="${this.searchQuery}">
                    </div>
                </div>
                
                <div class="import-log" id="import-log">
                    <div class="import-log-entry text-muted">Initializing import...</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render final import report
     * @returns {string}
     */
    renderReport() {
        const results = this.app.state.importResults;
        const total = results.success + results.warnings + results.errors;
        
        return `
            <div class="step-content">
                <div class="text-center mb-4">
                    <div class="illustration illustration-large">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
                            <circle cx="60" cy="60" r="50" fill="#e6fcf5" stroke="#2fb344" stroke-width="2"/>
                            <path d="M35 60l15 15l35 -35" stroke="#2fb344" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h2 class="display-6 fw-bold mb-3">${this.isDryRun ? 'Dry Run Complete' : 'Import Complete!'}</h2>
                    <p class="text-muted">${this.isDryRun ? 'Simulation complete for' : 'Processed'} ${total} items</p>
                </div>
                
                <div class="report-stats">
                    <div class="report-stat success">
                        <div class="report-stat-value">${results.success}</div>
                        <div class="report-stat-label">
                            <i class="ti ti-check me-1"></i>
                            Successful
                        </div>
                        <div class="mt-2 text-muted small">
                            ${results.created} Created &bull; ${results.updated} Updated
                        </div>
                    </div>
                    <div class="report-stat warning">
                        <div class="report-stat-value">${results.warnings}</div>
                        <div class="report-stat-label">
                            <i class="ti ti-alert-triangle me-1"></i>
                            Warnings
                        </div>
                    </div>
                    <div class="report-stat error">
                        <div class="report-stat-value">${results.errors}</div>
                        <div class="report-stat-label">
                            <i class="ti ti-x me-1"></i>
                            Errors
                        </div>
                    </div>
                </div>
                
                ${results.log.length > 0 ? `
                    <div class="mt-4">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <h4 class="mb-0">
                                <i class="ti ti-list me-2"></i>
                                Import Log
                            </h4>
                            <div class="input-icon" style="width: 300px;">
                                <span class="input-icon-addon">
                                    <i class="ti ti-search"></i>
                                </span>
                                <input type="text" id="log-filter" class="form-control" placeholder="Filter by status, row, or message..." value="${this.searchQuery}">
                            </div>
                        </div>
                        <div class="import-log" id="import-log" style="max-height: 300px;">
                            ${results.log.map(entry => `
                                <div class="import-log-entry ${entry.type}">
                                    <span class="log-status">[${entry.type.toUpperCase()}]</span><span class="text-muted">[Row ${entry.row}]</span> ${entry.message}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="text-center mt-4 d-flex justify-content-center gap-2">
                    <button class="btn btn-ghost-secondary" onclick="window.csvImportApp.reset()">
                        <i class="ti ti-refresh me-1"></i>
                        New Import
                    </button>
                    <button class="btn ${this.isDryRun ? 'btn-ghost-secondary' : 'btn-primary'}" id="export-report">
                        <i class="ti ti-download me-1"></i>
                        Export Report
                    </button>
                    ${this.isDryRun ? `
                        <button class="btn btn-success" id="start-real-import">
                            <i class="ti ti-player-play me-2"></i>
                            Start Real Import
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Bind event handlers
     */
    bindEvents() {
        // Start import button
        const startBtn = document.getElementById('start-import');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startImport(false));
        }

        // Dry run button
        const dryRunBtn = document.getElementById('start-dry-run');
        if (dryRunBtn) {
            dryRunBtn.addEventListener('click', () => this.startImport(true));
        }
        
        // Start real import from report
        const realImportBtn = document.getElementById('start-real-import');
        if (realImportBtn) {
            realImportBtn.addEventListener('click', () => this.startImport(false));
        }
        
        // Export report button
        const exportBtn = document.getElementById('export-report');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }
        
        // Log filter input
        const filterInput = document.getElementById('log-filter');
        if (filterInput) {
            filterInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.applyFilter();
            });
            // Apply filter immediately after render if searchQuery is set
            if (this.searchQuery) {
                this.applyFilter();
            }
        }
    }
    
    /**
     * Apply filter to log entries
     */
    applyFilter() {
        const entries = document.querySelectorAll('.import-log-entry');
        entries.forEach(entry => {
            const text = entry.textContent.toLowerCase();
            const type = entry.className.toLowerCase();
            
            if (text.includes(this.searchQuery) || type.includes(this.searchQuery)) {
                entry.style.display = '';
            } else {
                entry.style.display = 'none';
            }
        });
    }
    
    /**
     * Start the import process
     * @param {boolean} dryRun - Whether this is a simulation
     */
    async startImport(dryRun = false) {
        this.isDryRun = dryRun;
        this.isImporting = true;
        this.importComplete = false;
        this.render();
        
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const progressPercent = document.getElementById('progress-percent');
        const logContainer = document.getElementById('import-log');
        
        try {
            const results = await MockGlpi.simulateImport(
                {
                    data: this.app.state.csvData.data,
                    mappings: this.app.state.mappings,
                    glpiType: this.app.state.glpiType,
                    dryRun: this.isDryRun
                },
                (progress) => {
                    // Update progress UI
                    if (progressBar) {
                        progressBar.style.width = progress.percentage + '%';
                    }
                    if (progressText) {
                        progressText.textContent = `Processing row ${progress.current} of ${progress.total}`;
                    }
                    if (progressPercent) {
                        progressPercent.textContent = progress.percentage + '%';
                    }
                    if (logContainer && progress.lastLog) {
                        const entry = document.createElement('div');
                        entry.className = `import-log-entry ${progress.lastLog.type}`;
                        entry.innerHTML = `<span class="log-status">[${progress.lastLog.type.toUpperCase()}]</span><span class="text-muted">[Row ${progress.lastLog.row}]</span> ${progress.lastLog.message}`;
                        
                        
                        // Check if it matches current filter
                        if (this.searchQuery) {
                            const text = entry.textContent.toLowerCase();
                            const type = entry.className.toLowerCase();
                            if (!text.includes(this.searchQuery) && !type.includes(this.searchQuery)) {
                                entry.style.display = 'none';
                            }
                        }
                        
                        logContainer.appendChild(entry);
                        logContainer.scrollTop = logContainer.scrollHeight;
                    }
                }
            );
            
            this.app.state.importResults = results;
            this.isImporting = false;
            this.importComplete = true;
            this.render();
            
        } catch (error) {
            console.error('Import error:', error);
            this.isImporting = false;
            alert('Import failed: ' + error.message);
            this.render();
        }
    }
    
    /**
     * Export import report as CSV
     */
    exportReport() {
        const results = this.app.state.importResults;
        if (!results) return;
        
        // Create CSV content
        const headers = ['Row', 'Status', 'Message'];
        const rows = results.log.map(entry => [
            entry.row,
            entry.type,
            entry.message
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `import-report-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }
    
    /**
     * Escape HTML entities
     * @param {string} str
     * @returns {string}
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }
}
