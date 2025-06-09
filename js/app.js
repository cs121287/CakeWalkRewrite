/**
 * Main Application Module
 */
import { Utils } from './core/utils.js';
import { Navigation } from './components/Navigation.js';
import { Carousel3D } from './components/Carousel3D.js';
import { Modal } from './components/Modal.js';
import { FormHandler } from './components/Form.js';
import { ScrollManager } from './components/ScrollManager.js';

class CakeWalkApp {
  constructor() {
    this.components = new Map();
    this.isInitialized = false;
    this.deviceType = null;
    
    // Set a timeout to force-hide the loading screen after 5 seconds
    this.loadingTimeout = setTimeout(() => this.hideLoadingScreen(), 5000);
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

      // Detect device type
      this.deviceType = Utils.getDeviceType();
      document.documentElement.classList.add(this.deviceType);

      // Load appropriate styles based on device
      await this.loadDeviceStyles();

      // Initialize components
      this.initializeComponents();
      this.setupProductInteractions();
      
      // Hide loading screen
      this.hideLoadingScreen();
      
      this.isInitialized = true;
      console.log('CakeWalk app initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize CakeWalk app:', error);
      // Make sure loading screen is hidden even if initialization fails
      this.hideLoadingScreen();
    }
  }

  async loadDeviceStyles() {
    try {
      const baseStyles = ['variables.css', 'base.css', 'optimized/responsive.css', 'modal.css'];
      const deviceStyles = this.deviceType === 'mobile' 
        ? ['mobile.css']
        : ['desktop.css'];
  
      const allStyles = [...baseStyles, ...deviceStyles];
      
      // Add a timeout to prevent hanging forever
      const loadWithTimeout = (href) => {
        return Promise.race([
          this.loadStylesheet(href),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Stylesheet loading timed out: ${href}`)), 3000)
          )
        ]).catch(err => {
          console.warn(err);
          return Promise.resolve(); // Continue despite errors
        });
      };
      
      // Load styles in parallel
      await Promise.all(allStyles.map(style => loadWithTimeout(`css/${style}`)));
    } catch (error) {
      console.warn('Error loading styles:', error);
      // Continue despite errors
    }
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
    try {
      // Navigation
      const nav = new Navigation();
      this.components.set('navigation', nav);
    } catch (e) {
      console.warn('Failed to initialize Navigation:', e);
    }
    
    try {
      // 3D Carousel
      const productCarousel = Utils.$('#productCarousel');
      if (productCarousel) {
        const carousel = new Carousel3D(productCarousel);
        this.components.set('carousel', carousel);
      }
    } catch (e) {
      console.warn('Failed to initialize Carousel:', e);
    }

    try {
      // Desktop Carousel
      const desktopCarousel = Utils.$('#desktopProductCarousel');
      if (desktopCarousel) {
        const desktopCarouselComponent = new Carousel3D(desktopCarousel);
        this.components.set('desktopCarousel', desktopCarouselComponent);
      }
    } catch (e) {
      console.warn('Failed to initialize desktop Carousel:', e);
    }

    try {
      // Modal
      const modal = new Modal('#productModal');
      this.components.set('modal', modal);
    } catch (e) {
      console.warn('Failed to initialize Modal:', e);
    }

    try {
      // Form validation
      const contactForm = new FormHandler('#contactForm');
      this.components.set('contactForm', contactForm);
    } catch (e) {
      console.warn('Failed to initialize Form handler:', e);
    }
    
    try {
      // Scroll functionality
      const scrollManager = new ScrollManager();
      this.components.set('scrollManager', scrollManager);
    } catch (e) {
      console.warn('Failed to initialize ScrollManager:', e);
    }

    // Performance monitoring
    this.setupPerformanceMonitoring();
  }
  
  setupProductInteractions() {
    try {
      // Handle product item clicks
      const productItems = Utils.$$('.product-item, .desktop-product-item');
      productItems.forEach(item => {
        item.addEventListener('click', () => {
          const modal = this.components.get('modal');
          if (!modal) return;
          
          const productName = item.dataset.product;
          const productCategory = item.dataset.category;
          const productImage = item.querySelector('img').src;
          
          // Product descriptions mapping
          const descriptions = {
            'Wedding Cakes': 'Our custom wedding cakes are designed to match your vision perfectly. We work closely with you to create a cake that not only looks stunning but tastes delicious too.',
            'Cupcakes': 'Our gourmet cupcakes come in a variety of flavors and designs. Perfect for parties, office treats, or just to satisfy your sweet tooth!',
            'Birthday Cakes': 'Make your celebration special with our custom birthday cakes. Available in various sizes, flavors, and decorations to delight guests of all ages.',
            'Pastries': 'Our freshly baked pastries are made daily using traditional recipes and the finest ingredients. From croissants to danishes, we have something for everyone.',
            'Cookies': 'Indulge in our selection of cookies, from classic chocolate chip to elaborately decorated sugar cookies for special occasions.',
            'Pies': 'Our homemade pies feature flaky crusts and delicious fillings made with seasonal fruits and quality ingredients.'
          };
          
          modal.open({
            title: productName,
            description: descriptions[productName] || 'Contact us to learn more about this delicious product!',
            image: productImage,
            imageAlt: `${productName} from Cake Walk Baking Co.`
          });
        });
      });
    } catch (e) {
      console.warn('Failed to setup product interactions:', e);
    }
  }
  
  hideLoadingScreen() {
    try {
      // Clear the timeout to avoid double execution
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
        this.loadingTimeout = null;
      }
      
      const loadingScreen = Utils.$('#loading-screen');
      if (loadingScreen) {
        Utils.addClass(loadingScreen, 'hidden');
        
        // Remove from DOM after transition completes
        setTimeout(() => {
          if (loadingScreen.parentNode) {
            loadingScreen.parentNode.removeChild(loadingScreen);
          }
        }, 1000);
      }
    } catch (e) {
      // Fallback if Utils or other functions fail
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.style.display = 'none';
      }
    }
  }

  setupPerformanceMonitoring() {
    try {
      // Monitor Core Web Vitals
      if ('web-vital' in window) {
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getCLS(console.log);
          getFID(console.log);
          getFCP(console.log);
          getLCP(console.log);
          getTTFB(console.log);
        }).catch(e => console.warn('Web vitals failed to load:', e));
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
    } catch (e) {
      console.warn('Failed to setup performance monitoring:', e);
    }
  }

  destroy() {
    this.components.forEach(component => {
      if (component && component.destroy) {
        try {
          component.destroy();
        } catch (e) {
          console.warn('Error destroying component:', e);
        }
      }
    });
    this.components.clear();
    this.isInitialized = false;
  }
}

// Initialize app
try {
  const app = new CakeWalkApp();
  app.init();

  // Global reference for debugging
  window.CakeWalkApp = app;
} catch (e) {
  console.error('Fatal error initializing CakeWalkApp:', e);
  // Ensure loading screen is removed
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
}