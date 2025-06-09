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
      
      const callNow = immediate && !timeout;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  },

  /**
   * Throttle function to limit call frequency
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} - Throttled function
   */
  throttle(func, limit) {
    let inThrottle;
    return function throttledFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  },

  /**
   * Toggle class on element
   * @param {Element} element - Target element
   * @param {string} className - Class to toggle
   * @param {boolean} force - Force add/remove class
   */
  toggleClass(element, className, force) {
    if (!element) return;
    
    if (force === undefined) {
      element.classList.toggle(className);
    } else {
      if (force) {
        element.classList.add(className);
      } else {
        element.classList.remove(className);
      }
    }
  },

  /**
   * Add class to element
   * @param {Element} element - Target element
   * @param {string} className - Class to add
   */
  addClass(element, className) {
    if (element && className) {
      element.classList.add(className);
    }
  },

  /**
   * Remove class from element
   * @param {Element} element - Target element
   * @param {string} className - Class to remove
   */
  removeClass(element, className) {
    if (element && className) {
      element.classList.remove(className);
    }
  },

  /**
   * Check if element has class
   * @param {Element} element - Target element
   * @param {string} className - Class to check
   * @returns {boolean} - Element has class
   */
  hasClass(element, className) {
    return element && element.classList ? element.classList.contains(className) : false;
  },

  /**
   * Create Intersection Observer with fallback
   * @param {Function} callback - Observer callback
   * @param {Object} options - Observer options
   * @returns {IntersectionObserver} - Observer instance
   */
  createObserver(callback, options = {}) {
    if (!('IntersectionObserver' in window)) {
      return {
        observe: (element) => {
          // Fallback for older browsers
          const checkInViewport = () => {
            if (this.isInViewport(element, 100)) {
              callback([{ isIntersecting: true, target: element }]);
            }
          };
          
          window.addEventListener('scroll', this.throttle(checkInViewport, 200));
          window.addEventListener('resize', this.throttle(checkInViewport, 200));
          
          // Initial check
          setTimeout(checkInViewport, 100);
        },
        disconnect: () => {}
      };
    }
    
    return new IntersectionObserver(callback, options);
  },

  /**
   * Create animated scroll to element
   * @param {string|Element} target - Target element or selector
   * @param {Object} options - Scroll options (offset, duration)
   */
  scrollTo(target, options = {}) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (!element) return;
    
    const defaults = {
      offset: 0,
      duration: 500,
      easing: 'easeInOutCubic'
    };
    
    const settings = { ...defaults, ...options };
    
    const startPosition = window.pageYOffset || document.documentElement.scrollTop;
    const elementPosition = element.getBoundingClientRect().top;
    const targetPosition = elementPosition + startPosition - settings.offset;
    const distance = targetPosition - startPosition;
    
    if (distance === 0) return;
    
    // Easing functions
    const easings = {
      linear: t => t,
      easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    };
    
    let startTime = null;
    
    const animateScroll = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / settings.duration, 1);
      const easing = easings[settings.easing] || easings.easeInOutCubic;
      const easedProgress = easing(progress);
      
      window.scrollTo(0, startPosition + distance * easedProgress);
      
      if (timeElapsed < settings.duration) {
        requestAnimationFrame(animateScroll);
      }
    };
    
    // Check if browser supports scroll behavior
    if ('scrollBehavior' in document.documentElement.style && !options.forceAnimation) {
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    } else {
      requestAnimationFrame(animateScroll);
    }
  },

  /**
   * Format date with localization support
   * @param {Date|string|number} date - Date to format
   * @param {Object} options - Format options
   * @returns {string} - Formatted date
   */
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    const settings = { ...defaultOptions, ...options };
    const dateObj = date instanceof Date ? date : new Date(date);
    
    try {
      return dateObj.toLocaleDateString(navigator.language, settings);
    } catch (e) {
      return dateObj.toLocaleDateString('en-US', settings);
    }
  },

  /**
   * Format currency with localization support
   * @param {number} value - Value to format
   * @param {string} currency - Currency code
   * @returns {string} - Formatted currency
   */
  formatCurrency(value, currency = 'USD') {
    try {
      return new Intl.NumberFormat(navigator.language, {
        style: 'currency',
        currency: currency
      }).format(value);
    } catch (e) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(value);
    }
  },

  /**
   * Safely parse JSON with error handling
   * @param {string} json - JSON string
   * @param {*} fallback - Fallback value
   * @returns {Object|*} - Parsed object or fallback
   */
  parseJSON(json, fallback = {}) {
    try {
      return JSON.parse(json);
    } catch (e) {
      return fallback;
    }
  },

  /**
   * Generate random ID
   * @param {string} prefix - ID prefix
   * @returns {string} - Random ID
   */
  generateId(prefix = 'cw') {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Check if element is in viewport
   * @param {Element} element - Element to check
   * @param {number} offset - Viewport offset
   * @returns {boolean} - Is in viewport
   */
  isInViewport(element, offset = 0) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    const vertInView = (rect.top + offset) < windowHeight && (rect.bottom - offset) > 0;
    const horInView = (rect.left + offset) < windowWidth && (rect.right - offset) > 0;
    
    return vertInView && horInView;
  }
};