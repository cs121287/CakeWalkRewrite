/**
 * Handles scroll-related functionality
 */
import { Utils } from '../core/utils.js';
import { EventManager } from '../core/events.js';

export class ScrollManager {
  constructor() {
    this.eventManager = new EventManager();
    this.scrollIndicator = Utils.$('#scrollProgress');
    this.backToTopBtn = Utils.$('#backToTop');
    this.header = Utils.$('#mobileHeader');
    
    this.lastScrollTop = 0;
    this.scrollThreshold = 100; // Pixels to scroll before showing/hiding elements
    this.scrollHeaderThreshold = 50; // Pixels to scroll before hiding header
    
    this.init();
  }
  
  init() {
    if (this.scrollIndicator || this.backToTopBtn || this.header) {
      this.setupScrollEvents();
    }
    
    this.setupSectionAnimations();
  }
  
  setupScrollEvents() {
    // Use throttled function to optimize performance
    const handleScroll = Utils.throttle(() => this.handleScroll(), 50);
    this.eventManager.on(window, 'scroll', handleScroll, { passive: true });
    
    // Initial state
    setTimeout(() => this.handleScroll(), 100);
    
    // Back to top button
    if (this.backToTopBtn) {
      this.eventManager.on(this.backToTopBtn, 'click', () => this.scrollToTop());
    }
  }
  
  setupSectionAnimations() {
    // Setup animations for sections
    const sections = Utils.$$('.section-content');
    
    if (!sections.length) return;
    
    const observer = Utils.createObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          Utils.addClass(entry.target, 'visible');
        }
      });
    }, { threshold: 0.1 });
    
    sections.forEach(section => {
      observer.observe(section);
    });
  }
  
  handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Update scroll progress indicator
    if (this.scrollIndicator) {
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      this.scrollIndicator.style.width = `${scrollPercent}%`;
    }
    
    // Show/hide back to top button
    if (this.backToTopBtn) {
      if (scrollTop > this.scrollThreshold) {
        Utils.addClass(this.backToTopBtn, 'visible');
      } else {
        Utils.removeClass(this.backToTopBtn, 'visible');
      }
    }
    
    // Show/hide header on scroll
    if (this.header) {
      if (scrollTop > this.lastScrollTop && scrollTop > this.scrollHeaderThreshold) {
        // Scrolling down and past threshold - hide header
        Utils.addClass(this.header, 'hidden');
      } else {
        // Scrolling up or at top - show header
        Utils.removeClass(this.header, 'hidden');
      }
    }
    
    this.lastScrollTop = scrollTop;
  }
  
  scrollToTop() {
    Utils.scrollTo('body', { offset: 0, duration: 800 });
  }
  
  destroy() {
    this.eventManager.cleanup();
  }
}