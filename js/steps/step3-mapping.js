/**
 * Step 3: Type Selection & Field Mapping
 * Select GLPI asset type and map CSV columns to GLPI fields
 */

import { MockGlpi } from '../services/mock-glpi.js';

export class Step3Mapping {
    constructor(app) {
        this.app = app;
        this.types = [];
        this.searchOptions = [];
        // Ensure static mappings are initialized
        if (!this.app.state.staticMappings) {
            this.app.state.staticMappings = [];
        }
    }
    
    /**
     * Render step content
     */
    async render() {
        const container = document.getElementById('wizard-content');
        
        // Load types
        this.types = await MockGlpi.getTypes();
        
        // Load search options for selected type
        if (this.app.state.glpiType) {
            this.searchOptions = await MockGlpi.getSearchOptions(this.app.state.glpiType);
        }
        
        container.innerHTML = `
            <div class="step-content">
                <div class="text-center mb-4">
                    <h2 class="display-6 fw-bold mb-3">Configure Mapping</h2>
                    <p class="text-muted">Select the asset type and map CSV columns to GLPI fields</p>
                </div>
                
                ${this.renderTypeSelector()}
                
                ${this.app.state.glpiType ? this.renderMappingList() : this.renderTypeHint()}
                
                ${this.app.state.glpiType ? this.renderSaveTemplate() : ''}
            </div>
        `;
        
        this.bindEvents();
    }
    
    /**
     * Render GLPI type selector (Fancy Style)
     * @returns {string}
     */
    renderTypeSelector() {
        return `
            <div class="mb-5 template-selection-container border-bottom pb-4">
                 <h4 class="mb-4 text-dark fs-3">
                    <i class="ti ti-table-alias me-2"></i>
                    Target Asset Type
                </h4>
                
                <div class="d-flex align-items-center">
                    <div class="flex-grow-1">
                        <select class="form-select" id="glpi-type">
                            <option value="">Select asset type...</option>
                            ${this.types.map(t => `
                                <option value="${t.id}" ${this.app.state.glpiType === t.id ? 'selected' : ''}>
                                    ${t.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    ${this.app.state.glpiType ? `
                        <div class="ms-3">
                            <span class="badge bg-blue-lt p-2">
                                <i class="ti ti-database me-1"></i>
                                ${this.app.state.csvData?.data?.length || 0} items to import
                            </span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Render hint to select type
     * @returns {string}
     */
    renderTypeHint() {
        return `
            <div class="empty-state">
                <div class="illustration">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
                        <circle cx="60" cy="60" r="55" fill="#fff3bf" stroke="#fab005" stroke-width="2"/>
                        <path d="M60 40 L80 75 L40 75 Z" fill="white" stroke="#fab005" stroke-width="2" stroke-linejoin="round"/>
                        <circle cx="60" cy="58" r="3" fill="#fab005"/>
                        <line x1="60" y1="63" x2="60" y2="68" stroke="#fab005" stroke-width="3" stroke-linecap="round"/>
                    </svg>
                </div>
                <p>Select an asset type above to configure field mappings</p>
            </div>
        `;
    }
    
    /**
     * Render mapping list (Without Selector)
     * @returns {string}
     */
    renderMappingList() {
        const mappings = this.app.state.mappings;
        
        return `
            <div class="mapping-list">
                <div class="d-flex justify-content-between align-items-center">
                    <h4 class="text-dark fs-3" 
                        ${!mappings.some(m => m.isReconciliationKey) ? `
                            data-bs-toggle="tooltip" 
                            data-bs-placement="right" 
                            title="Please select at least one reconciliation key to proceed"
                        ` : ''}>
                        <i class="ti ti-arrows-exchange me-2"></i>
                        Field Mappings
                        ${!mappings.some(m => m.isReconciliationKey) ? `
                            <i class="ti ti-alert-circle text-warning fs-5 ms-2"></i>
                        ` : ''}
                    </h4>
                </div>
                
                <!-- Header Row -->
                <div class="mapping-header-row">
                    <div>CSV Column</div>
                    <div></div>
                    <div>GLPI Field</div>
                    <div></div>
                </div>
                
                ${mappings.map((mapping, index) => this.renderMappingRow(mapping, index)).join('')}
                
                ${(this.app.state.staticMappings || []).map((mapping, index) => this.renderStaticFieldRow(mapping, index)).join('')}
                
                <div class="mt-3 mb-2 text-end">
                    <button class="btn btn-outline-secondary" id="add-static-field">
                        <i class="ti ti-plus"></i>
                        Add static field
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render a single static field row
     * @param {Object} mapping
     * @param {number} index
     * @returns {string}
     */
    renderStaticFieldRow(mapping, index) {
        return `
            <div class="mapping-row" style="background-color: var(--tblr-body-bg); border-left: 3px solid var(--tblr-secondary);">
                <div class="mapping-csv-col ms-3">
                     <div class="input-icon">
                        <span class="input-icon-addon">
                          <i class="ti ti-quote"></i>
                        </span>
                        <input type="text" class="form-control" 
                            placeholder="Static Value" 
                            value="${this.escapeHtml(mapping.value)}"
                            data-static-value-index="${index}">
                     </div>
                </div>
                
                <div class="mapping-arrow text-center">
                    <i class="ti ti-arrow-right text-muted"></i>
                </div>
                
                <div class="mapping-glpi-field">
                    <select class="form-select" data-static-field-index="${index}">
                        <option value="">Select GLPI field...</option>
                        ${this.searchOptions.map(opt => `
                            <option value="${opt.id}" 
                                ${mapping.glpiField == opt.id ? 'selected' : ''}
                                ${this.isFieldAlreadyMapped(opt.id, -1, index) ? 'disabled' : ''}>
                                ${opt.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="mapping-actions d-flex align-items-center gap-2">
                    <button class="btn btn-ghost-danger btn-icon" 
                        data-remove-static="${index}"
                        title="Remove static field">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Render a single mapping row
     * @param {Object} mapping
     * @param {number} index
     * @returns {string}
     */
    renderMappingRow(mapping, index) {
        return `
            <div class="mapping-row">
                <div class="mapping-csv-col text-muted ms-3">
                    <i class="ti ti-file-text me-2"></i>
                    <span>${this.escapeHtml(mapping.csvHeader)}</span>
                </div>
                
                <div class="mapping-arrow text-center">
                    <i class="ti ti-arrow-right text-muted"></i>
                </div>
                
                <div class="mapping-glpi-field">
                    <select class="form-select" data-mapping-index="${index}">
                        <option value="">-- Skip this column --</option>
                        ${this.searchOptions.map(opt => `
                            <option value="${opt.id}" 
                                ${mapping.glpiField === opt.id ? 'selected' : ''}
                                ${this.isFieldAlreadyMapped(opt.id, index, -1) ? 'disabled' : ''}>
                                ${opt.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="mapping-actions d-flex align-items-center gap-2">
                    <button class="btn btn-icon p-2 ${mapping.isReconciliationKey ? 'btn-primary' : 'btn-ghost-secondary'}" 
                        data-toggle-key="${index}" 
                        data-bs-toggle="tooltip" 
                        title="${mapping.isReconciliationKey ? 'Used as reconciliation key' : 'Click to use as reconciliation key'}">
                        <i class="ti ti-key"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Render save template section
     * @returns {string}
     */
    renderSaveTemplate() {
        const isEditing = this.app.state.mode === 'template' && this.app.state.selectedTemplate;
        const currentName = isEditing ? this.app.state.selectedTemplate.name : '';
        const currentComment = isEditing ? (this.app.state.selectedTemplate.comment || '') : '';
        
        return `
            <div class="save-template-form mt-4 pt-4 border-top">
                <div class="mb-3">
                    <label class="form-label">
                        <i class="ti ti-device-floppy me-1"></i>
                        ${isEditing ? 'Update Template' : 'Save as Template (optional)'}
                    </label>
                    <div class="row g-2">
                        <div class="col-md-4">
                            <input type="text" class="form-control" id="template-name" 
                                value="${this.escapeHtml(currentName)}"
                                placeholder="Template name...">
                        </div>
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="template-comment" 
                                value="${this.escapeHtml(currentComment)}"
                                placeholder="Comment (optional)...">
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-outline-secondary w-100" id="save-template" 
                                data-action="${isEditing ? 'update' : 'create'}">
                                <i class="ti ti-device-floppy me-1"></i>
                                ${isEditing ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Bind event handlers
     */
    bindEvents() {
        const container = document.getElementById('wizard-content');
        
        // Type selector
        const typeSelect = document.getElementById('glpi-type');
        if (typeSelect) {
            typeSelect.addEventListener('change', async (e) => {
                this.app.state.glpiType = e.target.value || null;
                
                // Reset mappings when type changes
                if (this.app.state.glpiType) {
                    this.searchOptions = await MockGlpi.getSearchOptions(this.app.state.glpiType);
                    
                    // Try to auto-map based on header names
                    this.autoMapFields();
                } else {
                    this.app.state.mappings.forEach(m => m.glpiField = null);
                }
                
                this.render();
                this.app.wizard.refreshButtons();
            });
        }
        
        // Mapping selects
        container.querySelectorAll('[data-mapping-index]').forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.mappingIndex);
                const value = e.target.value ? parseInt(e.target.value) : null;
                
                this.app.state.mappings[index].glpiField = value;
                this.render();
                this.app.wizard.refreshButtons();
            });
        });

        // Reconciliation key toggles
        container.querySelectorAll('[data-toggle-key]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.toggleKey);
                const mapping = this.app.state.mappings[index];
                
                mapping.isReconciliationKey = !mapping.isReconciliationKey;
                this.render();
                // Ensure buttons and tooltips are refreshed
                this.app.wizard.refreshButtons();
            });
        });

        // Initialize tooltips
        const tooltips = container.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(t => new bootstrap.Tooltip(t));
        
        // Save template button
        const saveBtn = document.getElementById('save-template');
        const templateNameInput = document.getElementById('template-name');
        const templateCommentInput = document.getElementById('template-comment');
        
        if (saveBtn && templateNameInput) {
            saveBtn.addEventListener('click', () => {
                const name = templateNameInput.value.trim();
                const comment = templateCommentInput ? templateCommentInput.value.trim() : '';
                
                if (!name) {
                    alert('Please enter a template name');
                    return;
                }
                
                const action = saveBtn.dataset.action;
                const templateData = {
                    name: name,
                    comment: comment,
                    glpiType: this.app.state.glpiType,
                    mappings: this.app.state.mappings.map(m => ({
                        csvHeader: m.csvHeader,
                        glpiField: m.glpiField,
                        isReconciliationKey: m.isReconciliationKey
                    })),
                    staticMappings: this.app.state.staticMappings || []
                };

                if (action === 'update' && this.app.state.selectedTemplate) {
                    this.app.templateStore.update(this.app.state.selectedTemplate.id, templateData);
                    // Update state to reflect changes
                    this.app.state.selectedTemplate.name = name;
                    this.app.state.selectedTemplate.comment = comment;
                } else {
                    const newTpl = this.app.templateStore.add(templateData);
                    if (!this.app.state.selectedTemplate) {
                         // We could switch mode, but for now just clear input
                    }
                }
                
                // Show feedback on button
                const originalHtml = saveBtn.innerHTML;
                const originalClass = saveBtn.className;
                
                saveBtn.innerHTML = '<i class="ti ti-check me-1"></i> Saved!';
                saveBtn.classList.remove('btn-ghost-secondary', 'btn-primary');
                saveBtn.classList.add('btn-success');
                
                setTimeout(() => {
                    saveBtn.innerHTML = originalHtml;
                    saveBtn.className = originalClass;
                }, 2000);
            });
        }

        // Static fields events
        const addStaticBtn = document.getElementById('add-static-field');
        if (addStaticBtn) {
            addStaticBtn.addEventListener('click', () => {
                if (!this.app.state.staticMappings) {
                    this.app.state.staticMappings = [];
                }
                this.app.state.staticMappings.push({
                    id: Date.now(),
                    glpiField: null,
                    value: ''
                });
                this.render();
            });
        }

        container.querySelectorAll('[data-static-field-index]').forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.staticFieldIndex);
                const value = e.target.value ? parseInt(e.target.value) : null;
                this.app.state.staticMappings[index].glpiField = value;
                this.render();
            });
        });

        container.querySelectorAll('[data-static-value-index]').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.staticValueIndex);
                this.app.state.staticMappings[index].value = e.target.value;
            });
        });

        container.querySelectorAll('[data-remove-static]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.removeStatic);
                this.app.state.staticMappings.splice(index, 1);
                this.render();
            });
        });
    }
    
    /**
     * Check if a GLPI field is already mapped
     * @param {number} fieldId
     * @param {number} excludeMappingIndex - Index to exclude in csv mappings (-1 if check from static)
     * @param {number} excludeStaticIndex - Index to exclude in static mappings (-1 if check from mapping)
     * @returns {boolean}
     */
    isFieldAlreadyMapped(fieldId, excludeMappingIndex = -1, excludeStaticIndex = -1) {
        // Check in CSV mappings
        const inMappings = this.app.state.mappings.some(
            (m, i) => i !== excludeMappingIndex && m.glpiField == fieldId
        );
        
        // Check in static mappings
        const inStatic = (this.app.state.staticMappings || []).some(
            (m, i) => i !== excludeStaticIndex && m.glpiField == fieldId
        );
        
        return inMappings || inStatic;
    }
    
    /**
     * Auto-map fields based on header name matching
     */
    autoMapFields() {
        this.app.state.mappings.forEach(mapping => {
            const headerLower = mapping.csvHeader.toLowerCase().trim();
            
            // Find a matching search option
            const match = this.searchOptions.find(opt => {
                const optName = opt.name.toLowerCase();
                const optField = opt.field.toLowerCase();
                
                return headerLower === optName || 
                       headerLower === optField ||
                       headerLower.includes(optName) ||
                       optName.includes(headerLower);
            });
            
            if (match && !this.isFieldAlreadyMapped(match.id, -1, -1)) {
                mapping.glpiField = match.id;
            }
        });
    }
    
    /**
     * Get icon for a type
     * @param {string} typeId
     * @returns {string}
     */
    getTypeIcon(typeId) {
        const type = this.types.find(t => t.id === typeId);
        return type?.icon || 'ti-file';
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
