/**
 * Main Application Module
 */
import { Utils } from './core/utils.js';
import { Navigation } from './components/Navigation.js';
import { Carousel3D } from './components/Carousel3D.js';

class CakeWalkApp {
  constructor() {
    this.components = new Map();
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;

    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
      }

      // Load appropriate styles based on device
      await this.loadDeviceStyles();

      // Initialize components
      this.initializeComponents();
      
      this.isInitialized = true;
      console.log('CakeWalk app initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize CakeWalk app:', error);
    }
  }

  async loadDeviceStyles() {
    const deviceType = Utils.getDeviceType();
    const baseStyles = ['variables.css', 'common.css'];
    const deviceStyles = deviceType === 'mobile' 
      ? ['mobile/style.css', 'mobile/animations.css', 'mobile/modal.css']
      : ['desktop/style.css', 'desktop/animations.css', 'desktop/accordion-nav.css'];

    const allStyles = [...baseStyles, ...deviceStyles];
    
    // Load styles in parallel
    await Promise.all(
      allStyles.map(style => this.loadStylesheet(`css/${style}`))
    );
  }

  loadStylesheet(href) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[href="${href}"]`)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      
      document.head.appendChild(link);
    });
  }

  initializeComponents() {
    // Navigation
    const nav = new Navigation();
    this.components.set('navigation', nav);

    // 3D Carousel
    const carouselElement = Utils.$('#product-carousel');
    if (carouselElement) {
      const carousel = new Carousel3D(carouselElement);
      this.components.set('carousel', carousel);
    }

    // Performance monitoring
    this.setupPerformanceMonitoring();
  }

  setupPerformanceMonitoring() {
    // Monitor Core Web Vitals
    if ('web-vital' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log);
        getFID(console.log);
        getFCP(console.log);
        getLCP(console.log);
        getTTFB(console.log);
      });
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry);
          }
        });
      });
      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  destroy() {
    this.components.forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });
    this.components.clear();
    this.isInitialized = false;
  }
}

// Initialize app
const app = new CakeWalkApp();
app.init();

// Global reference for debugging
window.CakeWalkApp = app;