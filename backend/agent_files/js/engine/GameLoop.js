/**
 * Game Loop Engine for Neon Runner
 * Handles 60 FPS game loop with requestAnimationFrame
 */
export class GameLoop {
  constructor() {
    this.running = false;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    
    // Target FPS
    this.targetFPS = 60;
    this.targetFrameTime = 1000 / this.targetFPS;
    
    // Callbacks
    this.updateCallback = null;
    this.renderCallback = null;
    
    // Performance monitoring
    this.performanceStats = {
      averageFPS: 60,
      minFPS: 60,
      maxFPS: 60,
      frameTimeHistory: []
    };
    
    // Bind the game loop function
    this.gameLoop = this.gameLoop.bind(this);
  }
  
  /**
   * Set update callback
   */
  setUpdateCallback(callback) {
    this.updateCallback = callback;
  }
  
  /**
   * Set render callback
   */
  setRenderCallback(callback) {
    this.renderCallback = callback;
  }
  
  /**
   * Start the game loop
   */
  start() {
    if (!this.running) {
      this.running = true;
      this.lastTime = performance.now();
      this.frameCount = 0;
      this.lastFpsUpdate = this.lastTime;
      requestAnimationFrame(this.gameLoop);
    }
  }
  
  /**
   * Stop the game loop
   */
  stop() {
    this.running = false;
  }
  
  /**
   * Main game loop
   */
  gameLoop(currentTime) {
    if (!this.running) return;
    
    // Calculate delta time
    this.deltaTime = Math.min(currentTime - this.lastTime, 100); // Cap at 100ms
    this.lastTime = currentTime;
    
    // Update FPS counter
    this.updateFPS(currentTime);
    
    // Update performance stats
    this.updatePerformanceStats(this.deltaTime);
    
    // Call update callback
    if (this.updateCallback) {
      this.updateCallback(this.deltaTime, currentTime);
    }
    
    // Call render callback
    if (this.renderCallback) {
      this.renderCallback(this.deltaTime, currentTime);
    }
    
    // Continue the loop
    requestAnimationFrame(this.gameLoop);
  }
  
  /**
   * Update FPS calculation
   */
  updateFPS(currentTime) {
    this.frameCount++;
    
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }
  }
  
  /**
   * Update performance statistics
   */
  updatePerformanceStats(deltaTime) {
    const currentFPS = 1000 / deltaTime;
    
    // Update min/max FPS
    this.performanceStats.minFPS = Math.min(this.performanceStats.minFPS, currentFPS);
    this.performanceStats.maxFPS = Math.max(this.performanceStats.maxFPS, currentFPS);
    
    // Update frame time history (keep last 60 frames)
    this.performanceStats.frameTimeHistory.push(deltaTime);
    if (this.performanceStats.frameTimeHistory.length > 60) {
      this.performanceStats.frameTimeHistory.shift();
    }
    
    // Calculate average FPS
    const avgFrameTime = this.performanceStats.frameTimeHistory.reduce((a, b) => a + b, 0) / 
                        this.performanceStats.frameTimeHistory.length;
    this.performanceStats.averageFPS = 1000 / avgFrameTime;
  }
  
  /**
   * Get current FPS
   */
  getFPS() {
    return this.fps;
  }
  
  /**
   * Get delta time in milliseconds
   */
  getDeltaTime() {
    return this.deltaTime;
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return { ...this.performanceStats };
  }
  
  /**
   * Check if loop is running
   */
  isRunning() {
    return this.running;
  }
  
  /**
   * Reset performance statistics
   */
  resetPerformanceStats() {
    this.performanceStats = {
      averageFPS: 60,
      minFPS: 60,
      maxFPS: 60,
      frameTimeHistory: []
    };
  }
  
  /**
   * Pause the game loop (but keep it active for resume)
   */
  pause() {
    this.running = false;
  }
  
  /**
   * Resume the game loop
   */
  resume() {
    if (!this.running) {
      this.running = true;
      this.lastTime = performance.now();
      requestAnimationFrame(this.gameLoop);
    }
  }
}