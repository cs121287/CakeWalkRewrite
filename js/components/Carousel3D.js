/**
 * Optimized 3D Carousel with performance enhancements
 */
import { Utils } from '../core/utils.js';
import { EventManager } from '../core/events.js';

export class Carousel3D {
  constructor(container) {
    this.container = container;
    this.eventManager = new EventManager();
    this.isPlaying = true;
    this.currentRotation = 0;
    this.figures = [];
    this.animationId = null;
    this.intersectionObserver = null;
    
    this.config = {
      autoRotateSpeed: 0.5, // degrees per frame
      touchSensitivity: 0.3,
      pauseOnHover: true,
      pauseOnTouch: true,
      resumeDelay: 2000
    };

    this.init();
  }

  init() {
    if (!this.container) return;

    this.figures = Array.from(this.container.querySelectorAll('figure'));
    if (this.figures.length === 0) return;

    this.setupCarousel();
    this.setupEventListeners();
    this.setupIntersectionObserver();
    this.addTouchInstructions();
  }

  setupCarousel() {
    const angleStep = 360 / this.figures.length;
    
    // Use transform3d for better performance
    this.figures.forEach((figure, index) => {
      const angle = angleStep * index;
      figure.setAttribute('data-angle', angle);
      
      // Enable hardware acceleration
      figure.style.transform = `rotateY(${angle}deg) translateZ(400px)`;
      figure.style.willChange = 'transform';
    });

    // Start animation loop
    this.startAnimation();
  }

  setupEventListeners() {
    // Touch/Mouse interactions
    this.eventManager.setupTouchGestures(this.container, {
      onTouchStart: () => {
        if (this.config.pauseOnTouch) {
          this.pause();
        }
      },
      onTouchMove: (e, { deltaX }) => {
        if (this.isPaused) {
          this.handleManualRotation(deltaX * this.config.touchSensitivity);
        }
      },
      onTouchEnd: () => {
        if (this.config.pauseOnTouch) {
          setTimeout(() => this.resume(), this.config.resumeDelay);
        }
      },
      onTap: (e) => {
        e.preventDefault();
        this.handleFigureClick(e.target.closest('figure'));
      }
    });

    // Hover events for desktop
    if (Utils.getDeviceType() === 'desktop' && this.config.pauseOnHover) {
      this.eventManager.on(this.container, 'mouseenter', () => this.pause());
      this.eventManager.on(this.container, 'mouseleave', () => this.resume());
    }

    // Keyboard controls
    this.eventManager.on(document, 'keydown', (e) => this.handleKeyboard(e));
  }

  setupIntersectionObserver() {
    this.intersectionObserver = Utils.createObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.resume();
        } else {
          this.pause();
        }
      });
    }, { threshold: 0.2 });

    this.intersectionObserver.observe(this.container);
  }

  startAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    const animate = () => {
      if (this.isPlaying) {
        this.currentRotation += this.config.autoRotateSpeed;
        this.updateCarouselRotation();
      }
      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  updateCarouselRotation() {
    // Use transform3d for better performance
    this.container.style.transform = `translateZ(-400px) rotateY(${this.currentRotation}deg)`;
  }

  handleManualRotation(delta) {
    this.currentRotation += delta;
    this.updateCarouselRotation();
  }

  handleFigureClick(figure) {
    if (!figure) return;

    const isActive = figure.classList.contains('active');
    
    // Remove active class from all figures
    this.figures.forEach(fig => Utils.removeClass(fig, 'active'));
    
    if (isActive) {
      this.resume();
    } else {
      Utils.addClass(figure, 'active');
      this.pause();
    }
  }

  handleKeyboard(e) {
    if (!this.container.matches(':hover')) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.pause();
        this.handleManualRotation(-10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.pause();
        this.handleManualRotation(10);
        break;
      case ' ':
        e.preventDefault();
        this.toggle();
        break;
    }
  }

  addTouchInstructions() {
    if (Utils.getDeviceType() === 'mobile') {
      const instructions = document.createElement('div');
      instructions.className = 'carousel-instructions';
      instructions.innerHTML = `
        <div class="touch-hint">
          <span class="icon">👆</span>
          <span class="text">Tap to pause • Swipe to rotate</span>
        </div>
      `;
      
      this.container.parentNode?.appendChild(instructions);
    }
  }

  pause() {
    this.isPlaying = false;
    Utils.addClass(this.container, 'paused');
  }

  resume() {
    this.isPlaying = true;
    Utils.removeClass(this.container, 'paused');
    
    // Clear any active states
    this.figures.forEach(fig => Utils.removeClass(fig, 'active'));
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    this.eventManager.cleanup();
    
    // Clean up transform styles
    this.figures.forEach(figure => {
      figure.style.willChange = 'auto';
    });
  }
}