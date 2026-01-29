/**
 * Template Store Service
 * Manages saving and loading import templates from localStorage
 */

const STORAGE_KEY = 'glpi_csv_import_templates';

export class TemplateStore {
    constructor() {
        this.templates = this.load();
    }
    
    /**
     * Load templates from localStorage
     * @returns {Array}
     */
    load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load templates:', e);
            return [];
        }
    }
    
    /**
     * Save templates to localStorage
     */
    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.templates));
        } catch (e) {
            console.error('Failed to save templates:', e);
        }
    }
    
    /**
     * Get all templates
     * @returns {Array}
     */
    getAll() {
        return this.templates;
    }
    
    /**
     * Get a template by ID
     * @param {string} id
     * @returns {Object|null}
     */
    getById(id) {
        return this.templates.find(t => t.id === id) || null;
    }
    
    /**
     * Add a new template
     * @param {Object} template
     * @returns {Object} The created template with ID
     */
    add(template) {
        const newTemplate = {
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
            ...template
        };
        
        this.templates.push(newTemplate);
        this.save();
        
        return newTemplate;
    }
    
    /**
     * Update an existing template
     * @param {string} id
     * @param {Object} updates
     * @returns {Object|null}
     */
    update(id, updates) {
        const index = this.templates.findIndex(t => t.id === id);
        if (index === -1) return null;
        
        this.templates[index] = {
            ...this.templates[index],
            ...updates,
            lastUsedAt: new Date().toISOString()
        };
        
        this.save();
        return this.templates[index];
    }
    
    /**
     * Delete a template
     * @param {string} id
     * @returns {boolean}
     */
    delete(id) {
        const index = this.templates.findIndex(t => t.id === id);
        if (index === -1) return false;
        
        this.templates.splice(index, 1);
        this.save();
        return true;
    }
    
    /**
     * Mark a template as used (update lastUsedAt)
     * @param {string} id
     */
    markUsed(id) {
        this.update(id, {});
    }
    
    /**
     * Generate a unique ID
     * @returns {string}
     */
    generateId() {
        return 'tpl_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
}
