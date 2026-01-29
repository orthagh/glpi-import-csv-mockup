/**
 * CSV Parser Service
 * Wrapper around PapaParse with encoding detection
 */

export class CsvParser {
    /**
     * Parse a CSV file
     * @param {File} file - The file to parse
     * @param {Object} options - Parsing options
     * @returns {Promise<Object>} Parsed result
     */
    static parse(file, options = {}) {
        return new Promise((resolve, reject) => {
            const config = {
                delimiter: options.delimiter || '',  // Auto-detect if empty
                header: false,  // We handle headers ourselves
                skipEmptyLines: true,
                encoding: options.encoding || 'UTF-8',
                preview: options.preview || 0,  // 0 = all rows
                complete: (results) => {
                    // Apply skipRows if specified
                    if (options.skipRows && options.skipRows > 0) {
                        results.data = results.data.slice(options.skipRows);
                    }
                    
                    // Extract headers if hasHeader is true
                    if (options.hasHeader && results.data.length > 0) {
                        results.headers = results.data[0];
                        results.data = results.data.slice(1);
                    } else {
                        // Generate column names like Column 1, Column 2, etc.
                        const colCount = results.data[0]?.length || 0;
                        results.headers = Array.from({ length: colCount }, (_, i) => `Column ${i + 1}`);
                    }
                    
                    resolve(results);
                },
                error: (error) => {
                    reject(error);
                }
            };
            
            Papa.parse(file, config);
        });
    }
    
    /**
     * Parse CSV text directly
     * @param {string} text - CSV text content
     * @param {Object} options - Parsing options
     * @returns {Object} Parsed result
     */
    static parseText(text, options = {}) {
        const config = {
            delimiter: options.delimiter || '',
            header: false,
            skipEmptyLines: true
        };
        
        const results = Papa.parse(text, config);
        
        // Apply skipRows
        if (options.skipRows && options.skipRows > 0) {
            results.data = results.data.slice(options.skipRows);
        }
        
        // Extract headers
        if (options.hasHeader && results.data.length > 0) {
            results.headers = results.data[0];
            results.data = results.data.slice(1);
        } else {
            const colCount = results.data[0]?.length || 0;
            results.headers = Array.from({ length: colCount }, (_, i) => `Column ${i + 1}`);
        }
        
        return results;
    }
    
    /**
     * Detect delimiter from sample text
     * @param {string} sample - Sample CSV text
     * @returns {string} Detected delimiter
     */
    static detectDelimiter(sample) {
        const delimiters = [',', ';', '\t', '|'];
        const counts = {};
        
        delimiters.forEach(d => {
            counts[d] = (sample.match(new RegExp('\\' + d, 'g')) || []).length;
        });
        
        // Return the delimiter with highest count
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    }
    
    /**
     * Get available encoding options
     * @returns {Array}
     */
    static getEncodings() {
        return [
            { value: 'UTF-8', label: 'UTF-8' },
            { value: 'ISO-8859-1', label: 'ISO-8859-1 (Latin-1)' },
            { value: 'Windows-1252', label: 'Windows-1252' }
        ];
    }
    
    /**
     * Get available delimiter options
     * @returns {Array}
     */
    static getDelimiters() {
        return [
            { value: ',', label: 'Comma (,)' },
            { value: ';', label: 'Semicolon (;)' },
            { value: '\t', label: 'Tab' },
            { value: '|', label: 'Pipe (|)' }
        ];
    }
}
