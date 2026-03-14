import { INPUT_KEYS } from '../utils/Constants.js';

/**
 * Input Manager for handling keyboard input
 * Provides smooth, responsive arrow key controls
 */
export class InputManager {
  constructor() {
    this.keys = {};
    this.keyPressed = {};
    this.keyReleased = {};
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Handle keydown events
    document.addEventListener('keydown', (e) => {
      if (Object.values(INPUT_KEYS).includes(e.code)) {
        e.preventDefault();
        
        // Track key press (only once per press)
        if (!this.keys[e.code]) {
          this.keyPressed[e.code] = true;
        }
        
        this.keys[e.code] = true;
      }
    });
    
    // Handle keyup events
    document.addEventListener('keyup', (e) => {
      if (Object.values(INPUT_KEYS).includes(e.code)) {
        e.preventDefault();
        this.keys[e.code] = false;
        this.keyReleased[e.code] = true;
      }
    });
    
    // Handle focus events to prevent stuck keys
    window.addEventListener('blur', () => {
      this.resetAll();
    });
  }
  
  /**
   * Check if a key is currently being held down
   */
  isKeyDown(keyCode) {
    return this.keys[keyCode] || false;
  }
  
  /**
   * Check if a key was just pressed this frame
   */
  wasKeyPressed(keyCode) {
    return this.keyPressed[keyCode] || false;
  }
  
  /**
   * Check if a key was just released this frame
   */
  wasKeyReleased(keyCode) {
    return this.keyReleased[keyCode] || false;
  }
  
  /**
   * Get movement vector based on arrow key input
   */
  getMovementVector() {
    const movement = { x: 0, y: 0 };
    
    if (this.isKeyDown(INPUT_KEYS.LEFT)) {
      movement.x -= 1;
    }
    if (this.isKeyDown(INPUT_KEYS.RIGHT)) {
      movement.x += 1;
    }
    if (this.isKeyDown(INPUT_KEYS.UP)) {
      movement.y -= 1;
    }
    if (this.isKeyDown(INPUT_KEYS.DOWN)) {
      movement.y += 1;
    }
    
    // Normalize diagonal movement
    if (movement.x !== 0 && movement.y !== 0) {
      const length = Math.sqrt(movement.x * movement.x + movement.y * movement.y);
      movement.x /= length;
      movement.y /= length;
    }
    
    return movement;
  }
  
  /**
   * Reset all input states (called at end of frame)
   */
  update() {
    this.keyPressed = {};
    this.keyReleased = {};
  }
  
  /**
   * Reset all keys (used when losing focus)
   */
  resetAll() {
    this.keys = {};
    this.keyPressed = {};
    this.keyReleased = {};
  }
}