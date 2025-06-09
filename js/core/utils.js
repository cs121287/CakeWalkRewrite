/**
 * Core utility functions for CakeWalk Baking Co.
 * Provides common functionality used across the application
 */

export const Utils = {
  // Cache for DOM elements to avoid repeated queries
  elementCache: new Map(),
  
  // Cache for device detection
  deviceCache: null,
  
  /**
   * Enhanced element selector with caching
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (default: document)
   * @returns {Element|null} - Found element or null
   */
  $(selector, context = document) {
    const cacheKey = `${selector}:${context === document ? 'doc' : context.tagName + context.className}`;
    
    if (!this.elementCache.has(cacheKey)) {
      const element = context.querySelector(selector);
      this.elementCache.set(cacheKey, element);
      
      // Clear cache after 5 seconds to handle dynamic content
      setTimeout(() => {
        this.elementCache.delete(cacheKey);
      }, 5000);
    }
    
    return this.elementCache.get(cacheKey);
  },

  /**
   * Multiple element selector
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (default: document)
   * @returns {Array} - Array of found elements
   */
  $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  },

  /**
   * Device detection with caching
   * @returns {string} - 'mobile' or 'desktop'
   */
  getDeviceType() {
    if (this.deviceCache) {
      return this.deviceCache;
    }

    const breakpoint = 768;
    const screenWidth = window.innerWidth || document.documentElement.clientWidth;
    
    // Check for touch capability
    const hasTouchCapability = 'ontouchstart' in window || 
                              navigator.maxTouchPoints > 0 || 
                              navigator.msMaxTouchPoints > 0;

    // Check user agent
    const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Primary decision based on screen width
    let isMobile = screenWidth < breakpoint;
    
    // Use touch and user agent as secondary signals
    if (hasTouchCapability && mobileUserAgent && screenWidth < 1024) {
      isMobile = true;
    }
    
    this.deviceCache = isMobile ? 'mobile' : 'desktop';
    
    // Store in sessionStorage for persistence across page loads
    try {
      sessionStorage.setItem('cakeWalk_deviceType', JSON.stringify({
        type: this.deviceCache,
        timestamp: Date.now(),
        screenWidth: screenWidth
      }));
    } catch (e) {
      console.warn('Could not store device type in sessionStorage:', e);
    }
    
    return this.deviceCache;
  },

  /**
   * Get cached device type from sessionStorage
   * @returns {string|null} - Cached device type or null
   */
  getCachedDeviceType() {
    try {
      const cached = sessionStorage.getItem('cakeWalk_deviceType');
      if (cached) {
        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;
        
        // Cache is valid for 1 hour and screen width hasn't changed significantly
        if (age < 3600000 && Math.abs(data.screenWidth - window.innerWidth) < 100) {
          return data.type;
        }
      }
    } catch (e) {
      console.warn('Could not retrieve cached device type:', e);
    }
    return null;
  },

  /**
   * Debounce function to limit function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @param {boolean} immediate - Execute immediately on first call
   * @returns {Function} - Debounced function
   */
  debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      
      const callNow = immediate && !