/**
 * Unified Navigation Component
 */
import { Utils } from '../core/utils.js';
import { EventManager } from '../core/events.js';

export class Navigation {
  constructor() {
    this.eventManager = new EventManager();
    this.deviceType = Utils.getDeviceType();
    this.isMenuOpen = false;
    this.activeSection = null;
    
    this.init();
  }

  init() {
    if (this.deviceType === 'mobile') {
      this.initMobileNav();
    } else {
      this.initDesktopNav();
    }
    
    this.setupScrollSpy();
    this.setupAccessibility();
  }

  initMobileNav() {
    this.elements = {
      menuToggle: Utils.$('#menuToggle'),
      closeMenu: Utils.$('#closeMenu'),
      mobileNav: Utils.$('#mobileNav'),
      navOverlay: Utils.$('#navOverlay'),
      navLinks: Utils.$$('.mobile-nav .nav-link')
    };

    // Menu toggle events
    this.eventManager.on(this.elements.menuToggle, 'click', () => this.toggleMenu(true));
    this.eventManager.on(this.elements.closeMenu, 'click', () => this.toggleMenu(false));
    this.eventManager.on(this.elements.navOverlay, 'click', () => this.toggleMenu(false));

    // Navigation link events
    this.elements.navLinks.forEach(link => {
      this.eventManager.on(link, 'click', (e) => this.handleNavClick(e, link));
    });

    // Touch gestures
    this.eventManager.setupTouchGestures(document.body, {
      onSwipe: (e, { direction, distance }) => {
        if (direction === 'right' && distance > 100 && e.touches[0].clientX < 50) {
          this.toggleMenu(true);
        } else if (direction === 'left' && this.isMenuOpen && distance > 100) {
          this.toggleMenu(false);
        }
      }
    });
  }

  initDesktopNav() {
    this.elements = {
      menuItems: Utils.$$('.accordion ul li'),
      sections: Utils.$$('.snap-section'),
      snapContainer: Utils.$('.snap-container')
    };

    // Menu item click events
    this.elements.menuItems.forEach(item => {
      this.eventManager.on(item, 'click', () => this.handleDesktopNavClick(item));
    });

    // Scroll event for active state
    if (this.elements.snapContainer) {
      const debouncedUpdate = Utils.debounce(() => this.updateActiveMenuItem(), 100);
      this.eventManager.on(this.elements.snapContainer, 'scroll', debouncedUpdate);
    }

    this.setDefaultActiveSection();
  }

  toggleMenu(open) {
    this.isMenuOpen = open;
    const { mobileNav, navOverlay, menuToggle } = this.elements;

    Utils.toggleClass(mobileNav, 'open', open);
    Utils.toggleClass(navOverlay, 'open', open);
    
    document.body.style.overflow = open ? 'hidden' : '';
    
    // Accessibility
    mobileNav?.setAttribute('aria-hidden', !open);
    menuToggle?.setAttribute('aria-expanded', open);
  }

  handleNavClick(e, link) {
    e.preventDefault();
    this.toggleMenu(false);
    
    const targetId = link.getAttribute('href');
    setTimeout(() => this.scrollToSection(targetId), 300);
  }

  handleDesktopNavClick(item) {
    const targetId = item.getAttribute('data-target');
    if (!targetId) return;

    // Update active states
    this.elements.menuItems.forEach(li => Utils.removeClass(li, 'active'));
    Utils.addClass(item, 'active');
    
    this.scrollToSection(targetId);
  }

  scrollToSection(sectionId) {
    const targetSection = Utils.$(sectionId);
    if (targetSection) {
      targetSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  setupScrollSpy() {
    const observerOptions = {
      threshold: 0.3,
      rootMargin: '-50px 0px -50px 0px'
    };

    const observer = Utils.createObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    this.elements.sections?.forEach(section => observer.observe(section));
  }

  setActiveSection(sectionId) {
    if (this.activeSection === sectionId) return;
    
    this.activeSection = sectionId;
    
    if (this.deviceType === 'desktop') {
      this.updateDesktopActiveState(sectionId);
    }
  }

  updateDesktopActiveState(sectionId) {
    const targetSelector = `#${sectionId}`;
    
    this.elements.menuItems?.forEach(item => {
      const isActive = item.getAttribute('data-target') === targetSelector;
      Utils.toggleClass(item, 'active', isActive);
      
      if (isActive) {
        // Expand parent accordion
        const parentContent = item.closest('.content');
        if (parentContent) {
          const radioInput = parentContent.parentElement.querySelector('input[type="radio"]');
          if (radioInput) radioInput.checked = true;
        }
      }
    });
  }

  setupAccessibility() {
    // Initial ARIA states
    if (this.deviceType === 'mobile') {
      this.elements.mobileNav?.setAttribute('aria-hidden', 'true');
      this.elements.menuToggle?.setAttribute('aria-expanded', 'false');
    }
  }

  setDefaultActiveSection() {
    if (this.deviceType === 'desktop' && !Utils.$('.accordion .section input[type="radio"]:checked')) {
      const firstRadio = Utils.$('.accordion .section input[type="radio"]');
      if (firstRadio) firstRadio.checked = true;
    }
  }

  updateActiveMenuItem() {
    // Existing logic for updating active menu items
    this.elements.sections?.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 100 && rect.bottom >= 100) {
        this.setActiveSection(section.id);
      }
    });
  }

  destroy() {
    this.eventManager.cleanup();
  }
}