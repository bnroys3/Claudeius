/**
 * Neon Runner - Main Entry Point
 * Cyberpunk-themed endless runner game
 * 
 * Controls: Arrow keys to move, Space to start/restart, Escape to pause
 */

import { GAME_CONSTANTS, INPUT_KEYS } from './js/utils/Constants.js';
import { GameLoop } from './js/engine/GameLoop.js';
import { InputManager } from './js/engine/InputManager.js';
import { Renderer } from './js/engine/Renderer.js';
import { Game } from './js/game/Game.js';

/**
 * Main application class
 */
class NeonRunnerApp {
  constructor() {
    // Get canvas and context
    this.canvas = document.getElementById('game-canvas');
    if (!this.canvas) {
      throw new Error('Canvas element not found!');
    }
    
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Could not get canvas 2D context!');
    }
    
    // Initialize engine components
    this.gameLoop = new GameLoop();
    this.inputManager = new InputManager();
    this.renderer = new Renderer(this.canvas, this.ctx);
    
    // Initialize game
    this.game = new Game(this.renderer, this.inputManager);
    
    // Debug mode (show FPS and performance stats)
    this.debugMode = false;
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Loading state
    this.isLoaded = false;
  }
  
  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('Initializing Neon Runner...');
      
      // Setup canvas
      this.setupCanvas();
      
      // Setup game loop callbacks
      this.gameLoop.setUpdateCallback((deltaTime, currentTime) => {
        this.update(deltaTime, currentTime);
      });
      
      this.gameLoop.setRenderCallback((deltaTime, currentTime) => {
        this.render(deltaTime, currentTime);
      });
      
      // Show loading screen
      this.renderLoadingScreen();
      
      // Preload assets (if any)
      await this.preloadAssets();
      
      // Start the game loop
      this.gameLoop.start();
      this.isLoaded = true;
      
      console.log('Neon Runner initialized successfully!');
      console.log('Controls: Arrow keys to move, Space to start, Escape to pause');
      
    } catch (error) {
      console.error('Failed to initialize game:', error);
      this.handleInitError(error);
    }
  }
  
  /**
   * Setup canvas properties
   */
  setupCanvas() {
    // Set canvas size
    this.canvas.width = GAME_CONSTANTS.CANVAS_WIDTH;
    this.canvas.height = GAME_CONSTANTS.CANVAS_HEIGHT;
    
    // Set CSS size for responsive design
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.maxWidth = `${GAME_CONSTANTS.CANVAS_WIDTH}px`;
    this.canvas.style.maxHeight = `${GAME_CONSTANTS.CANVAS_HEIGHT}px`;
    
    // Enable image smoothing
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    console.log(`Canvas setup: ${this.canvas.width}x${this.canvas.height}`);
  }
  
  /**
   * Setup additional event listeners
   */
  setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
    
    // Handle window focus/blur for pause functionality
    window.addEventListener('blur', () => {
      if (this.game.state === GAME_CONSTANTS.STATES.PLAYING) {
        this.game.pauseGame();
      }
    });
    
    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.game.state === GAME_CONSTANTS.STATES.PLAYING) {
        this.game.pauseGame();
      }
    });
    
    // Debug mode toggle (press D key)
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyD' && e.ctrlKey) {
        e.preventDefault();
        this.debugMode = !this.debugMode;
        console.log(`Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
      }
    });
    
    // Handle fullscreen toggle (press F key)
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyF' && e.altKey) {
        e.preventDefault();
        this.toggleFullscreen();
      }
    });
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    // The CSS handles responsive sizing, but we can add logic here if needed
    console.log('Window resized');
  }
  
  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.canvas.requestFullscreen().catch(err => {
        console.warn('Could not enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }
  
  /**
   * Preload game assets
   */
  async preloadAssets() {
    // For now, we don't have external assets to load
    // This is where you would load images, sounds, etc.
    return new Promise(resolve => {
      setTimeout(resolve, 500); // Simulate loading time
    });
  }
  
  /**
   * Main update loop
   */
  update(deltaTime, currentTime) {
    if (!this.isLoaded) return;
    
    // Update input manager
    this.inputManager.update();
    
    // Update game
    this.game.update(deltaTime, currentTime);
  }
  
  /**
   * Main render loop
   */
  render(deltaTime, currentTime) {
    if (!this.isLoaded) {
      this.renderLoadingScreen();
      return;
    }
    
    // Render game
    this.game.render();
    
    // Render debug information
    if (this.debugMode) {
      this.renderDebugInfo();
    }
  }
  
  /**
   * Render loading screen
   */
  renderLoadingScreen() {
    this.renderer.clear();
    
    const centerX = GAME_CONSTANTS.CANVAS_WIDTH / 2;
    const centerY = GAME_CONSTANTS.CANVAS_HEIGHT / 2;
    
    this.renderer.drawNeonText('LOADING...', centerX, centerY, 36, '#00FFFF');
    
    // Animated loading dots
    const dots = Math.floor(Date.now() / 500) % 4;
    this.renderer.drawNeonText('.'.repeat(dots), centerX, centerY + 50, 24, '#FFFFFF');
  }
  
  /**
   * Render debug information
   */
  renderDebugInfo() {
    const stats = this.gameLoop.getPerformanceStats();
    const gameState = this.game.getState();
    
    // Debug panel background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(10, 10, 200, 120);
    
    // Debug text
    this.ctx.fillStyle = '#00FFFF';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    
    let y = 25;
    const lineHeight = 15;
    
    this.ctx.fillText(`FPS: ${this.gameLoop.getFPS()}`, 15, y);
    y += lineHeight;
    this.ctx.fillText(`Avg FPS: ${stats.averageFPS.toFixed(1)}`, 15, y);
    y += lineHeight;
    this.ctx.fillText(`Delta: ${this.gameLoop.getDeltaTime().toFixed(1)}ms`, 15, y);
    y += lineHeight;
    this.ctx.fillText(`State: ${gameState.state}`, 15, y);
    y += lineHeight;
    this.ctx.fillText(`Score: ${gameState.score}`, 15, y);
    y += lineHeight;
    this.ctx.fillText(`Level: ${gameState.level}`, 15, y);
    y += lineHeight;
    this.ctx.fillText(`Lives: ${gameState.lives}`, 15, y);
    
    // Reset text alignment
    this.ctx.textAlign = 'center';
  }
  
  /**
   * Handle initialization errors
   */
  handleInitError(error) {
    // Show error on canvas if possible
    if (this.ctx) {
      this.ctx.fillStyle = '#FF0000';
      this.ctx.font = '24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Failed to load game', 
        GAME_CONSTANTS.CANVAS_WIDTH / 2, 
        GAME_CONSTANTS.CANVAS_HEIGHT / 2);
      this.ctx.fillText(error.message, 
        GAME_CONSTANTS.CANVAS_WIDTH / 2, 
        GAME_CONSTANTS.CANVAS_HEIGHT / 2 + 30);
    }
    
    // Also show in DOM
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ff0000;
      color: white;
      padding: 20px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      z-index: 1000;
    `;
    errorDiv.innerHTML = `
      <h3>Game Loading Error</h3>
      <p>${error.message}</p>
      <p>Please refresh the page and try again.</p>
    `;
    document.body.appendChild(errorDiv);
  }
  
  /**
   * Cleanup resources
   */
  destroy() {
    this.gameLoop.stop();
    console.log('Neon Runner destroyed');
  }
}

/**
 * Initialize the game when DOM is ready
 */
function initializeGame() {
  console.log('Starting Neon Runner initialization...');
  
  try {
    const app = new NeonRunnerApp();
    app.init();
    
    // Store app instance globally for debugging
    window.neonRunner = app;
    
  } catch (error) {
    console.error('Critical error during initialization:', error);
  }
}

// Start the game
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame);
} else {
  initializeGame();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (window.neonRunner) {
    window.neonRunner.destroy();
  }
});

// Export for ES6 module compatibility
export { NeonRunnerApp };