/**
 * CSV Import Wizard - Main Application Controller
 * Entry point that initializes and coordinates all modules
 */

import { Wizard } from './wizard.js';
import { TemplateStore } from './services/template-store.js';
import { Step1Start } from './steps/step1-start.js';
import { Step2Upload } from './steps/step2-upload.js';
import { Step3Mapping } from './steps/step3-mapping.js';
import { Step4Import } from './steps/step4-import.js';

class App {
    constructor() {
        /** @type {Object} Shared state across all steps */
        this.state = {
            // Step 1
            mode: 'new', // 'new' or 'template'
            selectedTemplate: null,
            
            // Step 2
            file: null,
            csvData: null,
            formatOptions: {
                delimiter: ',',
                encoding: 'UTF-8',
                hasHeader: true,
                skipRows: 0,
                allowCreation: true,
                allowUpdate: true,
                isRelation: false,
                dateFormat: 'Y-m-d',
                decimalSeparator: '.'
            },
            
            // Step 3
            glpiType: null,
            mappings: [],
            
            // Step 4
            importResults: null
        };
        
        this.templateStore = new TemplateStore();
        this.wizard = null;
        this.steps = [];
    }
    
    /**
     * Initialize the application
     */
    init() {
        // Initialize step handlers
        this.steps = [
            new Step1Start(this),
            new Step2Upload(this),
            new Step3Mapping(this),
            new Step4Import(this)
        ];
        
        // Initialize wizard navigation
        this.wizard = new Wizard({
            steps: this.steps,
            onStepChange: (step) => this.handleStepChange(step),
            canProceed: (step) => this.canProceedFromStep(step)
        });
        
        this.wizard.init();
        
        console.log('CSV Import Wizard initialized');
    }
    
    /**
     * Handle step change events
     * @param {number} step - Current step number (1-4)
     */
    handleStepChange(step) {

        
        // Render the step content
        const stepHandler = this.steps[step - 1];
        if (stepHandler) {
            stepHandler.render();
        }
    }
    
    /**
     * Check if user can proceed from current step
     * @param {number} step - Current step number
     * @returns {boolean}
     */
    canProceedFromStep(step) {
        switch (step) {
            case 1:
                // Can always proceed from start (new import or selected template)
                return true;
            case 2:
                // Must have parsed CSV data
                return this.state.csvData !== null && this.state.csvData.data.length > 0;
            case 3:
                // Must have at least one mapping and a selected type
                return this.state.glpiType !== null && this.state.mappings.some(m => m.glpiField);
            case 4:
                // Final step, no next
                return false;
            default:
                return false;
        }
    }
    
    /**
     * Reset wizard to initial state
     */
    reset() {
        this.state = {
            mode: 'new',
            selectedTemplate: null,
            file: null,
            csvData: null,
            formatOptions: {
                delimiter: ',',
                encoding: 'UTF-8',
                hasHeader: true,
                skipRows: 0
            },
            glpiType: null,
            mappings: [],
            importResults: null
        };
        
        this.wizard.goToStep(1);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.csvImportApp = new App();
    window.csvImportApp.init();
});
