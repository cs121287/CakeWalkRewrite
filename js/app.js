/**
 * Main Application Module
 */
import { Utils } from './core/utils.js';

// Import components conditionally to prevent blocking
const loadComponents = async () => {
  try {
    const Navigation = (await import('./components/Navigation.js')).Navigation;
    const Carousel3D = (await import('./components/Carousel3D.js')).Carousel3D;
    const Modal = (await import('./components/Modal.js')).Modal;
    const FormHandler = (await import('./components/Form.js')).FormHandler;
    const ScrollManager = (await import('./components/ScrollManager.js')).ScrollManager;
    return { Navigation, Carousel3D, Modal, FormHandler, ScrollManager };
  } catch (error) {
    console.error('Failed to import components:', error);
    return {};
  }
};

class CakeWalkApp {
  constructor() {
    this.components = new Map();
    this.isInitialized = false;
    this.deviceType = null;
    
    // Ensure loading screen is removed even if JS fails
    this.loadingTimeout = setTimeout(() => this.forceHideLoadingScreen(), 3000);
    
    // Show content regardless of loading state
    this.showContentTimeout = setTimeout(() => {
      document.body.style.visibility = 'visible';
    }, 800);
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

      // Add a safety fallback to show content
      document.body.style.visibility = 'visible';

      // Detect device type first to load critical CSS quickly
      this.deviceType = this.detectDeviceType();
      document.documentElement.classList.add(this.deviceType);

      // Load critical CSS synchronously first
      await this.loadCriticalCSS();
      
      // Hide loading screen early once critical CSS is loaded
      this.startHidingLoadingScreen();
      
      // Load remaining styles and components in parallel
      await Promise.all([
        this.loadRemainingStyles(),
        this.initializeComponentsAsync()
      ]);
      
      // Setup interactions that depend on components
      this.setupProductInteractions();
      
      // Complete loading and hide loading screen
      this.completeLoading();
      
      this.isInitialized = true;
      console.log('CakeWalk app initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize CakeWalk app:', error);
      this.forceHideLoadingScreen();
    }
  }

  // Detect device type synchronously to avoid flicker
  detectDeviceType() {
    try {
      // Check for cached device type first
      const cached = Utils.getCachedDeviceType();
      if (cached) return cached;
      
      // Simple detection based on screen width
      return (window.innerWidth < 768) ? 'mobile' : 'desktop';
    } catch (e) {
      console.warn('Error detecting device type:', e);
      // Default to mobile as it's usually more compatible
      return 'mobile';
    }
  }

  async loadCriticalCSS() {
    // Load only the absolutely essential CSS first
    const criticalStyles = ['variables.css', 'base.css'];
    const deviceStyle = this.deviceType === 'mobile' ? 'mobile.css' : 'desktop.css';
    criticalStyles.push(deviceStyle);
    
    // Load critical CSS with short timeout
    return Promise.all(criticalStyles.map(style => 
      this.loadStylesheetWithTimeout(`css/${style}`, 1000)
    )).catch(err => {
      console.warn('Some critical styles failed to load:', err);
      // Continue anyway to ensure content becomes visible
    });
  }
  
  async loadRemainingStyles() {
    // Load remaining styles after critical CSS
    const remainingStyles = ['optimized/responsive.css', 'modal.css'];
    
    return Promise.all(remainingStyles.map(style => 
      this.loadStylesheetWithTimeout(`css/${style}`, 2000)
    )).catch(err => {
      console.warn('Some non-critical styles failed to load:', err);
      // Non-critical, so we can continue
    });
  }

  loadStylesheetWithTimeout(href, timeout) {
    return Promise.race([
      this.loadStylesheet(href),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Stylesheet loading timed out: ${href}`)), timeout)
      )
    ]).catch(err => {
      console.warn(err);
      return Promise.resolve(); // Continue despite errors
    });
  }

  loadStylesheet(href) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (document.querySelector(`link[href="${href}"]`)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
      
      document.head.appendChild(link);
    });
  }

  async initializeComponentsAsync() {
    try {
      // Load components dynamically
      const { Navigation, Carousel3D, Modal, FormHandler, ScrollManager } = await loadComponents();
      
      // Initialize each component with error handling
      this.initializeComponent('navigation', () => new Navigation());
      
      // Initialize carousel if the component loaded successfully
      if (Carousel3D) {
        const productCarousel = document.getElementById('productCarousel');
        if (productCarousel) {
          this.initializeComponent('carousel', () => new Carousel3D(productCarousel));
        }
        
        const desktopCarousel = document.getElementById('desktopProductCarousel');
        if (desktopCarousel) {
          this.initializeComponent('desktopCarousel', () => new Carousel3D(desktopCarousel));
        }
      }
      
      // Initialize other components
      if (Modal) {
        this.initializeComponent('modal', () => new Modal('#productModal'));
      }
      
      if (FormHandler) {
        this.initializeComponent('contactForm', () => new FormHandler('#contactForm'));
      }
      
      if (ScrollManager) {
        this.initializeComponent('scrollManager', () => new ScrollManager());
      }
      
      // Safety mechanism to ensure content is visible
      document.body.style.visibility = 'visible';
      
    } catch (error) {
      console.error('Component initialization error:', error);
      // Ensure content is visible despite errors
      document.body.style.visibility = 'visible';
    }
  }
  
  initializeComponent(name, factoryFn) {
    try {
      this.components.set(name, factoryFn());
    } catch (error) {
      console.warn(`Failed to initialize ${name}:`, error);
    }
  }
  
  setupProductInteractions() {
    try {
      // Get modal if available
      const modal = this.components.get('modal');
      if (!modal) return;
      
      // Handle product item clicks
      const productItems = document.querySelectorAll('.product-item, .desktop-product-item');
      productItems.forEach(item => {
        item.addEventListener('click', () => {
          const productName = item.dataset.product;
          const productImage = item.querySelector('img')?.src;
          if (!productName || !productImage) return;
          
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
  
  startHidingLoadingScreen() {
    // Begin the fade-out process for the loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }
  }
  
  completeLoading() {
    this.forceHideLoadingScreen();
    
    // Ensure any pending timers are cleared
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
    
    if (this.showContentTimeout) {
      clearTimeout(this.showContentTimeout);
      this.showContentTimeout = null;
    }
  }
  
  forceHideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      // First try the class-based animation
      loadingScreen.classList.add('hidden');
      
      // Then force hide it with inline style after a short delay
      setTimeout(() => {
        if (loadingScreen.parentNode) {
          loadingScreen.style.display = 'none';
          
          // After transition completes, remove from DOM
          setTimeout(() => {
            if (loadingScreen.parentNode) {
              loadingScreen.parentNode.removeChild(loadingScreen);
            }
          }, 1000);
        }
      }, 300);
    }
    
    // Make sure body content is visible
    document.body.style.visibility = 'visible';
  }

  destroy() {
    this.components.forEach(component => {
      if (component && typeof component.destroy === 'function') {
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

// Initialize app with error boundary
try {
  const app = new CakeWalkApp();
  window.addEventListener('DOMContentLoaded', () => app.init());

  // Global reference for debugging
  window.CakeWalkApp = app;
} catch (e) {
  console.error('Fatal error initializing CakeWalkApp:', e);
  // Ensure content is visible despite fatal errors
  document.body.style.visibility = 'visible';
  
  // Remove loading screen
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
}