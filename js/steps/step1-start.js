/**
 * Step 1: Start / Template Selection
 * Choose between new import or using an existing template
 */

export class Step1Start {
    constructor(app) {
        this.app = app;
    }
    
    /**
     * Render step content
     */
    render() {
        const container = document.getElementById('wizard-content');
        const templates = this.app.templateStore.getAll();
        
        container.innerHTML = `
            <div class="step-content">
                <div class="text-center mb-4">
                    <div class="illustration">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
                            <circle cx="60" cy="60" r="55" fill="#e7f5ff" stroke="#339af0" stroke-width="2"/>
                            <rect x="35" y="35" width="50" height="60" rx="4" fill="white" stroke="#339af0" stroke-width="2"/>
                            <line x1="42" y1="50" x2="78" y2="50" stroke="#74c0fc" stroke-width="2" stroke-linecap="round"/>
                            <line x1="42" y1="58" x2="70" y2="58" stroke="#a5d8ff" stroke-width="2" stroke-linecap="round"/>
                            <line x1="42" y1="66" x2="75" y2="66" stroke="#a5d8ff" stroke-width="2" stroke-linecap="round"/>
                            <line x1="42" y1="74" x2="65" y2="74" stroke="#a5d8ff" stroke-width="2" stroke-linecap="round"/>
                            <path d="M75 25 L85 35 L75 35 Z" fill="#339af0"/>
                        </svg>
                    </div>
                    <h2 class="display-6 fw-bold mb-3">Import CSV Data</h2>
                    <p class="text-muted">Import data from CSV files into GLPI assets</p>
                </div>
                
                <div class="start-options">
                    <div class="option-card ${this.app.state.mode === 'new' ? 'selected' : ''}" data-mode="new">
                        <div class="option-card-icon">
                            <i class="ti ti-file-plus"></i>
                        </div>
                        <div class="option-card-title">New Import</div>
                        <div class="option-card-desc">Start a fresh import with new settings</div>
                    </div>
                    
                    <div class="option-card ${this.app.state.mode === 'template' ? 'selected' : ''}" data-mode="template">
                        <div class="option-card-icon">
                            <i class="ti ti-template"></i>
                        </div>
                        <div class="option-card-title">Use Template</div>
                        <div class="option-card-desc">Load a saved configuration</div>
                    </div>
                </div>
                
                ${this.app.state.mode === 'template' ? this.renderTemplateList(templates) : ''}
            </div>
        `;
        
        this.bindEvents();
    }
    
    /**
     * Render template list
     * @param {Array} templates
     * @returns {string}
     */
    renderTemplateList(templates) {
        if (templates.length === 0) {
            return `
                <div class="template-list">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="ti ti-folder-off"></i>
                        </div>
                        <p>No saved templates yet</p>
                        <p class="small">Templates will appear here after you save your first import configuration</p>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="template-list">
                <h4 class="mb-3">Saved Templates</h4>
                ${templates.map(t => `
                    <div class="template-item ${this.app.state.selectedTemplate?.id === t.id ? 'selected' : ''}" data-template-id="${t.id}">
                        <div class="template-item-icon">
                            <i class="ti ti-file-import"></i>
                        </div>
                        <div class="template-item-info">
                            <div class="template-item-name">${this.escapeHtml(t.name)}</div>
                            ${t.comment ? `<div class="text-muted small mb-1">${this.escapeHtml(t.comment)}</div>` : ''}
                            <div class="template-item-meta">
                                ${t.glpiType} &bull; ${t.mappings?.length || 0} mappings &bull; 
                                Last used: ${this.formatDate(t.lastUsedAt)}
                            </div>
                        </div>
                        <div class="template-item-actions">
                            <button class="btn btn-ghost-danger btn-icon p-2" data-delete-template="${t.id}" title="Delete template">
                                <i class="ti ti-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Bind event handlers
     */
    bindEvents() {
        const container = document.getElementById('wizard-content');
        
        // Mode selection
        container.querySelectorAll('.option-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.app.state.mode = mode;
                this.app.state.selectedTemplate = null;
                this.render();
                this.app.wizard.refreshButtons();
                
                // Auto advance
                if (mode === 'new') {
                    this.app.wizard.nextStep();
                }
            });
        });
        
        // Template selection
        container.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Ignore if clicking delete button
                if (e.target.closest('[data-delete-template]')) return;
                
                const templateId = e.currentTarget.dataset.templateId;
                const template = this.app.templateStore.getById(templateId);
                
                if (template) {
                    this.app.state.selectedTemplate = template;
                    this.render();
                    this.app.wizard.refreshButtons();
                    
                    // Auto advance
                    this.app.wizard.nextStep();
                }
            });
        });
        
        // Delete template
        container.querySelectorAll('[data-delete-template]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const templateId = e.currentTarget.dataset.deleteTemplate;
                
                if (confirm('Delete this template?')) {
                    this.app.templateStore.delete(templateId);
                    if (this.app.state.selectedTemplate?.id === templateId) {
                        this.app.state.selectedTemplate = null;
                    }
                    this.render();
                }
            });
        });
    }
    
    /**
     * Called when leaving this step
     * @returns {boolean}
     */
    onLeave() {
        // If using a template, load its settings
        if (this.app.state.mode === 'template' && this.app.state.selectedTemplate) {
            const template = this.app.state.selectedTemplate;
            this.app.state.glpiType = template.glpiType;
            this.app.state.mappings = [...template.mappings];
            this.app.state.staticMappings = template.staticMappings ? [...template.staticMappings] : [];
            this.app.templateStore.markUsed(template.id);
        }
        return true;
    }
    
    /**
     * Escape HTML entities
     * @param {string} str
     * @returns {string}
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    /**
     * Format date for display
     * @param {string} isoDate
     * @returns {string}
     */
    formatDate(isoDate) {
        try {
            return new Date(isoDate).toLocaleDateString();
        } catch {
            return 'Unknown';
        }
    }
}
