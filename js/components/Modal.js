/**
 * Accessible modal component
 */
import { Utils } from '../core/utils.js';
import { EventManager } from '../core/events.js';

export class Modal {
  constructor(selector) {
    this.modal = Utils.$(selector);
    this.eventManager = new EventManager();
    this.isOpen = false;
    this.focusableElements = [];
    this.firstFocusableElement = null;
    this.lastFocusableElement = null;
    this.previousActiveElement = null;
    
    if (this.modal) {
      this.init();
    }
  }
  
  init() {
    this.modalContainer = Utils.$('.modal-container', this.modal);
    this.closeBtn = Utils.$('.modal-close', this.modal);
    this.backdrop = Utils.$('.modal-backdrop', this.modal);
    
    this.setupEvents();
    this.updateFocusableElements();
  }
  
  setupEvents() {
    // Close button events
    this.eventManager.on(this.closeBtn, 'click', () => this.close());
    
    // Backdrop click closes modal
    this.eventManager.on(this.backdrop, 'click', () => this.close());
    
    // Prevent clicks inside modal container from closing
    this.eventManager.on(this.modalContainer, 'click', (e) => e.stopPropagation());
    
    // Keyboard events for accessibility
    this.eventManager.on(this.modal, 'keydown', (e) => this.handleKeyDown(e));
  }
  
  updateFocusableElements() {
    this.focusableElements = Utils.$$([
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(','), this.modal);
    
    if (this.focusableElements.length) {
      this.firstFocusableElement = this.focusableElements[0];
      this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
    }
  }
  
  open(data = {}) {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.previousActiveElement = document.activeElement;
    
    // Update content if data provided
    if (data.title) {
      const titleElement = Utils.$('.modal-title', this.modal);
      if (titleElement) titleElement.textContent = data.title;
    }
    
    if (data.description) {
      const descriptionElement = Utils.$('.modal-description', this.modal);
      if (descriptionElement) descriptionElement.textContent = data.description;
    }
    
    if (data.image) {
      const imageElement = Utils.$('.modal-image', this.modal);
      if (imageElement) {
        imageElement.src = data.image;
        imageElement.alt = data.imageAlt || data.title || 'Modal image';
      }
    }
    
    // Show modal
    Utils.addClass(this.modal, 'open');
    
    // Set ARIA attributes
    this.modal.setAttribute('aria-hidden', 'false');
    
    // Update tabindex to make modal focusable
    this.modal.setAttribute('tabindex', '-1');
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Focus first focusable element or modal itself
    setTimeout(() => {
      this.updateFocusableElements();
      if (this.firstFocusableElement) {
        this.firstFocusableElement.focus();
      } else {
        this.modal.focus();
      }
    }, 100);
    
    // Dispatch custom event
    const event = new CustomEvent('modal:open', { detail: data });
    this.modal.dispatchEvent(event);
  }
  
  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    
    // Hide modal
    Utils.removeClass(this.modal, 'open');
    
    // Update ARIA attributes
    this.modal.setAttribute('aria-hidden', 'true');
    
    // Restore body scrolling
    document.body.style.overflow = '';
    
    // Restore focus to previous element
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }
    
    // Dispatch custom event
    const event = new CustomEvent('modal:close');
    this.modal.dispatchEvent(event);
  }
  
  handleKeyDown(e) {
    // Close on ESC key
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }
    
    // Trap focus inside modal
    if (e.key === 'Tab') {
      // If no focusable elements, do nothing
      if (!this.firstFocusableElement) return;
      
      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === this.firstFocusableElement) {
          e.preventDefault();
          this.lastFocusableElement.focus();
        }
      } 
      // Tab
      else {
        if (document.activeElement === this.lastFocusableElement) {
          e.preventDefault();
          this.firstFocusableElement.focus();
        }
      }
    }
  }
  
  destroy() {
    this.eventManager.cleanup();
    this.close();
  }
}