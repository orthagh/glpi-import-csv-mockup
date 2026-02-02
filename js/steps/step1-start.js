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
                        <img src="assets/data-injection.svg" alt="Import CSV" class="img-fluid">
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

        // Sort by last used (descending)
        const sortedTemplates = [...templates].sort((a, b) => {
            return new Date(b.lastUsedAt) - new Date(a.lastUsedAt);
        });

        // Limit to top 5
        const displayTemplates = sortedTemplates.slice(0, 5);
        const hasMore = sortedTemplates.length > 5;
        
        return `
            <div class="template-list">
                <h4 class="mb-3">Last 5 Used Templates</h4>
                ${displayTemplates.map(t => `
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
                
                ${hasMore ? `
                    <div class="text-center mt-3">
                        <button class="btn btn-outline-secondary" onclick="alert('Not implemented in prototype')">
                            View all templates
                        </button>
                    </div>
                ` : ''}
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
