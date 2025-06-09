/**
 * Form validation and handling component
 */
import { Utils } from '../core/utils.js';
import { EventManager } from '../core/events.js';

export class FormHandler {
  constructor(formSelector) {
    this.form = Utils.$(formSelector);
    this.eventManager = new EventManager();
    this.validators = {
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      phone: (value) => /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(value),
      required: (value) => value.trim().length > 0
    };
    
    this.validationMessages = {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      phone: 'Please enter a valid phone number',
      pattern: 'Please enter a valid format'
    };
    
    if (this.form) {
      this.init();
    }
  }
  
  init() {
    this.fields = Utils.$$('input, textarea, select', this.form);
    this.submitButton = Utils.$('button[type="submit"]', this.form);
    
    // Add events
    this.eventManager.on(this.form, 'submit', (e) => this.handleSubmit(e));
    
    // Live validation
    this.fields.forEach(field => {
      this.eventManager.on(field, 'blur', () => this.validateField(field));
      this.eventManager.on(field, 'input', () => this.clearFieldError(field));
    });
  }
  
  validateField(field) {
    // Skip validation if field is empty and not required
    if (field.value.trim() === '' && !field.hasAttribute('required')) {
      this.clearFieldError(field);
      return true;
    }
    
    // Required validation
    if (field.hasAttribute('required') && !this.validators.required(field.value)) {
      this.showFieldError(field, this.validationMessages.required);
      return false;
    }
    
    // Email validation
    if (field.type === 'email' && !this.validators.email(field.value)) {
      this.showFieldError(field, this.validationMessages.email);
      return false;
    }
    
    // Phone validation
    if (field.type === 'tel' && field.value.trim() !== '' && !this.validators.phone(field.value)) {
      this.showFieldError(field, this.validationMessages.phone);
      return false;
    }
    
    // Pattern validation
    if (field.pattern && field.value.trim() !== '') {
      const pattern = new RegExp(field.pattern);
      if (!pattern.test(field.value)) {
        const message = field.dataset.errorMsg || this.validationMessages.pattern;
        this.showFieldError(field, message);
        return false;
      }
    }
    
    // Min/max length validation
    if (field.minLength && field.value.length < field.minLength) {
      this.showFieldError(field, `Must be at least ${field.minLength} characters`);
      return false;
    }
    
    if (field.maxLength && field.value.length > field.maxLength) {
      this.showFieldError(field, `Cannot exceed ${field.maxLength} characters`);
      return false;
    }
    
    this.clearFieldError(field);
    return true;
  }
  
  validateForm() {
    let isValid = true;
    
    this.fields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });
    
    return isValid;
  }
  
  showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    
    Utils.addClass(formGroup, 'invalid');
    
    const errorElement = Utils.$(`#${field.id}-error`) || 
                        Utils.$('.error-message', formGroup);
    
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.setAttribute('aria-hidden', 'false');
    }
    
    field.setAttribute('aria-invalid', 'true');
  }
  
  clearFieldError(field) {
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    
    Utils.removeClass(formGroup, 'invalid');
    
    const errorElement = Utils.$(`#${field.id}-error`) || 
                        Utils.$('.error-message', formGroup);
    
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.setAttribute('aria-hidden', 'true');
    }
    
    field.setAttribute('aria-invalid', 'false');
  }
  
  handleSubmit(e) {
    e.preventDefault();
    
    if (!this.validateForm()) {
      // Focus first invalid field
      const firstInvalid = Utils.$('.form-group.invalid input, .form-group.invalid textarea', this.form);
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }
    
    // Disable submit button and show loading state
    if (this.submitButton) {
      this.submitButton.disabled = true;
      this.submitButton.innerHTML = '<span>Sending...</span> <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>';
    }
    
    // Get form data
    const formData = new FormData(this.form);
    const data = Object.fromEntries(formData.entries());
    
    // Send data
    this.sendFormData(data)
      .then(response => this.handleSuccess(response))
      .catch(error => this.handleError(error))
      .finally(() => {
        // Re-enable submit button
        if (this.submitButton) {
          this.submitButton.disabled = false;
          this.submitButton.innerHTML = '<span>Send Message</span> <i class="fas fa-paper-plane" aria-hidden="true"></i>';
        }
      });
  }
  
  sendFormData(data) {
    // For demo purposes, simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Form data would be sent:', data);
        resolve({ success: true });
      }, 1500);
    });
  }
  
  handleSuccess(response) {
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.innerHTML = `
      <i class="fas fa-check-circle" aria-hidden="true"></i>
      <span>Thank you! Your message has been sent successfully.</span>
    `;
    
    this.form.appendChild(successMessage);
    
    // Reset form
    this.form.reset();
    
    // Remove success message after delay
    setTimeout(() => {
      if (successMessage.parentNode) {
        successMessage.parentNode.removeChild(successMessage);
      }
    }, 5000);
  }
  
  handleError(error) {
    console.error('Form submission error:', error);
    
    // Show error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message form-error';
    errorMessage.innerHTML = `
      <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
      <span>Sorry, there was a problem sending your message. Please try again.</span>
    `;
    
    this.form.appendChild(errorMessage);
    
    // Remove error message after delay
    setTimeout(() => {
      if (errorMessage.parentNode) {
        errorMessage.parentNode.removeChild(errorMessage);
      }
    }, 5000);
  }
  
  destroy() {
    this.eventManager.cleanup();
  }
}