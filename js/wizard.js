/**
 * Wizard Navigation Controller
 * Manages step progression, navigation buttons, and step indicators
 */

export class Wizard {
    /**
     * @param {Object} options
     * @param {Array} options.steps - Array of step handler instances
     * @param {Function} options.onStepChange - Callback when step changes
     * @param {Function} options.canProceed - Function to check if can proceed from step
     */
    constructor(options) {
        this.steps = options.steps;
        this.onStepChange = options.onStepChange;
        this.canProceed = options.canProceed;
        
        this.currentStep = 1;
        this.totalSteps = 4;
        
        // DOM elements
        this.stepIndicators = document.querySelectorAll('.wizard-step');
        this.connectors = document.querySelectorAll('.wizard-step-connector');
        this.btnPrev = document.getElementById('btn-prev');
        this.btnNext = document.getElementById('btn-next');
        this.contentContainer = document.getElementById('wizard-content');
    }
    
    /**
     * Initialize wizard
     */
    init() {
        this.bindEvents();
        this.updateUI();
        this.onStepChange(this.currentStep);
    }
    
    /**
     * Bind button click events
     */
    bindEvents() {
        // Allow clicking on completed steps to go back
        this.stepIndicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                const stepNum = index + 1;
                if (stepNum < this.currentStep) {
                    this.goToStep(stepNum);
                }
            });
        });
    }
    
    /**
     * Go to next step
     */
    nextStep() {
        if (this.currentStep < this.totalSteps && this.canProceed(this.currentStep)) {
            // Run validation/save on current step before proceeding
            const currentHandler = this.steps[this.currentStep - 1];
            if (currentHandler.onLeave) {
                const canLeave = currentHandler.onLeave();
                if (canLeave === false) return;
            }
            
            this.currentStep++;
            this.updateUI();
            this.onStepChange(this.currentStep);
        }
    }
    
    /**
     * Go to previous step
     */
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateUI();
            this.onStepChange(this.currentStep);
        }
    }
    
    /**
     * Go to a specific step
     * @param {number} step - Step number (1-4)
     */
    goToStep(step) {
        if (step >= 1 && step <= this.totalSteps) {
            this.currentStep = step;
            this.updateUI();
            this.onStepChange(this.currentStep);
        }
    }
    
    /**
     * Update all UI elements based on current step
     */
    updateUI() {
        this.updateStepIndicators();
        this.updateButtons();
        
        // Init tooltips with delay to ensure DOM is ready
        setTimeout(() => {
            if (window.bootstrap && window.bootstrap.Tooltip) {
                const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                tooltipTriggerList.map(function (tooltipTriggerEl) {
                    if (!bootstrap.Tooltip.getInstance(tooltipTriggerEl)) {
                        return new bootstrap.Tooltip(tooltipTriggerEl);
                    }
                });
            }
        }, 100);
    }
    
    /**
     * Update step indicator states
     */
    updateStepIndicators() {
        this.stepIndicators.forEach((indicator, index) => {
            const stepNum = index + 1;
            
            // Remove all state classes
            indicator.classList.remove('active', 'completed', 'clickable');
            
            if (stepNum === this.currentStep) {
                indicator.classList.add('active');
            } else if (stepNum < this.currentStep) {
                indicator.classList.add('completed', 'clickable');
            }
        });
        
        // Update connectors
        this.connectors.forEach((connector, index) => {
            const stepAfter = index + 2;
            connector.classList.toggle('completed', stepAfter <= this.currentStep);
        });
    }
    
    /**
     * Update navigation button states
     */
    updateButtons() {
        // Previous button
        this.btnPrev.disabled = this.currentStep === 1;
        this.btnPrev.style.visibility = this.currentStep === 1 ? 'hidden' : 'visible';
        this.btnPrev.onclick = () => this.prevStep();
        
        // Next button
        const footer = document.querySelector('.card-footer');
        
        if (this.currentStep === 1) {
            this.btnNext.style.display = 'none';
        } else {
            this.btnNext.style.display = '';
        }

        if (this.currentStep === this.totalSteps) {
            // Hide footer on last step (Step 4 handles its own navigation)
            if (footer) footer.classList.add('d-none');
            
            this.btnNext.innerHTML = '';
            this.btnNext.disabled = true;
        } else {
            // Show footer
            if (footer) footer.classList.remove('d-none');
            
            this.btnNext.innerHTML = 'Next <i class="ti ti-arrow-right ms-1"></i>';
            this.btnNext.classList.add('btn-primary');
            this.btnNext.classList.remove('btn-success');
            this.btnNext.disabled = !this.canProceed(this.currentStep);
            
            // Reset to normal behavior
            this.btnNext.onclick = () => this.nextStep();
        }
    }
    
    /**
     * Refresh button states (call when step data changes)
     */
    refreshButtons() {
        this.updateButtons();
    }
}
