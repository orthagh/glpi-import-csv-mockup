/**
 * Mock GLPI Data Service
 * Provides simulated GLPI types and search options
 */

let cachedData = null;

export class MockGlpi {
    /**
     * Load search options data
     * @returns {Promise<Object>}
     */
    static async loadData() {
        if (cachedData) {
            return cachedData;
        }
        
        try {
            const response = await fetch('./data/search-options.json');
            cachedData = await response.json();
            return cachedData;
        } catch (error) {
            console.error('Failed to load search options:', error);
            return { types: [], searchOptions: {} };
        }
    }
    
    /**
     * Get all available GLPI types
     * @returns {Promise<Array>}
     */
    static async getTypes() {
        const data = await this.loadData();
        return data.types || [];
    }
    
    /**
     * Get search options for a specific type
     * @param {string} typeId - Type ID (e.g., 'Computer')
     * @returns {Promise<Array>}
     */
    static async getSearchOptions(typeId) {
        const data = await this.loadData();
        return data.searchOptions?.[typeId] || [];
    }
    
    /**
     * Get required fields for a type
     * @param {string} typeId
     * @returns {Promise<Array>}
     */
    static async getRequiredFields(typeId) {
        const options = await this.getSearchOptions(typeId);
        return options.filter(opt => opt.required);
    }
    
    /**
     * Simulate an import operation
     * @param {Object} params - Import parameters
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Object>} Import results
     */
    static async simulateImport(params, onProgress) {
        const { data, mappings, glpiType } = params;
        const totalRows = data.length;
        
        const results = {
            success: 0,
            warnings: 0,
            errors: 0,
            log: []
        };
        
        for (let i = 0; i < totalRows; i++) {
            const row = data[i];
            
            // Simulate processing time
            await this.delay(50 + Math.random() * 100);
            
            // Simulate random outcomes
            const outcome = Math.random();
            
            if (outcome > 0.15) {
                // Success (85% of the time)
                results.success++;
                results.log.push({
                    type: 'success',
                    row: i + 1,
                    message: `Created ${glpiType}: ${row[0] || 'Item ' + (i + 1)}`
                });
            } else if (outcome > 0.05) {
                // Warning (10% of the time)
                results.warnings++;
                results.log.push({
                    type: 'warning',
                    row: i + 1,
                    message: `Partial import for row ${i + 1}: Some fields skipped`
                });
            } else {
                // Error (5% of the time)
                results.errors++;
                results.log.push({
                    type: 'error',
                    row: i + 1,
                    message: `Failed to import row ${i + 1}: Validation error`
                });
            }
            
            // Report progress
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: totalRows,
                    percentage: Math.round(((i + 1) / totalRows) * 100),
                    lastLog: results.log[results.log.length - 1]
                });
            }
        }
        
        return results;
    }
    
    /**
     * Utility delay function
     * @param {number} ms
     * @returns {Promise}
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
