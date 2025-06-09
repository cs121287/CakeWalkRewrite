/**
 * Centralized event management system
 */
export class EventManager {
  constructor() {
    this.listeners = new Map();
    this.touchEvents = {
      start: null,
      end: null,
      threshold: 100
    };
  }

  // Add event listener with automatic cleanup
  on(element, event, handler, options = {}) {
    if (!element) return;

    const wrappedHandler = (e) => {
      try {
        handler(e);
      } catch (error) {
        console.error('Event handler error:', error);
      }
    };

    element.addEventListener(event, wrappedHandler, options);

    // Store for cleanup
    const key = `${element.tagName}-${event}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push({ element, event, handler: wrappedHandler, options });

    return () => element.removeEventListener(event, wrappedHandler, options);
  }

  // Remove all event listeners
  cleanup() {
    this.listeners.forEach(handlers => {
      handlers.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
    });
    this.listeners.clear();
  }

  // Touch gesture detection
  setupTouchGestures(element, callbacks = {}) {
    let startX, startY, startTime;

    this.on(element, 'touchstart', (e) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      
      if (callbacks.onTouchStart) {
        callbacks.onTouchStart(e, { x: startX, y: startY });
      }
    }, { passive: true });

    this.on(element, 'touchmove', (e) => {
      if (callbacks.onTouchMove) {
        const touch = e.touches[0];
        callbacks.onTouchMove(e, {
          x: touch.clientX,
          y: touch.clientY,
          deltaX: touch.clientX - startX,
          deltaY: touch.clientY - startY
        });
      }
    }, { passive: false });

    this.on(element, 'touchend', (e) => {
      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = Date.now() - startTime;

      // Determine gesture type
      const isSwipe = Math.abs(deltaX) > this.touchEvents.threshold || 
                      Math.abs(deltaY) > this.touchEvents.threshold;
      const isTap = deltaTime < 300 && !isSwipe;

      if (isTap && callbacks.onTap) {
        callbacks.onTap(e, { x: endX, y: endY });
      }

      if (isSwipe && callbacks.onSwipe) {
        let direction;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }
        
        callbacks.onSwipe(e, { direction, deltaX, deltaY, distance: Math.sqrt(deltaX ** 2 + deltaY ** 2) });
      }

      if (callbacks.onTouchEnd) {
        callbacks.onTouchEnd(e, { x: endX, y: endY, deltaX, deltaY, deltaTime });
      }
    }, { passive: true });
  }
}