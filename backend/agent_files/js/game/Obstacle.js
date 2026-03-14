import { GAME_CONSTANTS } from '../utils/Constants.js';

/**
 * Obstacle class for Neon Runner
 * Handles obstacle generation, movement, and rendering
 */
export class Obstacle {
  constructor(x, y, width = null, height = null) {
    this.x = x;
    this.y = y;
    
    // Random size if not specified
    this.width = width || this.getRandomSize();
    this.height = height || this.getRandomSize();
    
    // Movement properties
    this.velocity = {
      x: -GAME_CONSTANTS.OBSTACLE_SPEED + Math.random() * 100 - 50,
      y: Math.random() * 100 - 50
    };
    
    // Visual properties
    this.color = GAME_CONSTANTS.OBSTACLE_COLOR;
    this.glowIntensity = 0.8 + Math.random() * 0.4;
    this.rotationSpeed = (Math.random() - 0.5) * 2; // Rotation for visual effect
    this.rotation = 0;
    
    // State
    this.active = true;
    this.type = this.getRandomType();
  }
  
  /**
   * Get random obstacle size
   */
  getRandomSize() {
    return GAME_CONSTANTS.OBSTACLE_MIN_SIZE + 
           Math.random() * (GAME_CONSTANTS.OBSTACLE_MAX_SIZE - GAME_CONSTANTS.OBSTACLE_MIN_SIZE);
  }
  
  /**
   * Get random obstacle type for variety
   */
  getRandomType() {
    const types = ['square', 'rectangle', 'diamond'];
    return types[Math.floor(Math.random() * types.length)];
  }
  
  /**
   * Update obstacle state
   */
  update(deltaTime, canvasWidth, canvasHeight) {
    const deltaSeconds = deltaTime / 1000;
    
    // Update position
    this.x += this.velocity.x * deltaSeconds;
    this.y += this.velocity.y * deltaSeconds;
    
    // Update rotation
    this.rotation += this.rotationSpeed * deltaSeconds;
    
    // Bounce off top and bottom walls
    if (this.y <= 0 || this.y + this.height >= canvasHeight) {
      this.velocity.y = -this.velocity.y;
      this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
    }
    
    // Mark as inactive if off-screen to the left
    if (this.x + this.width < 0) {
      this.active = false;
    }
    
    // Update glow intensity for pulsing effect
    this.glowIntensity += Math.sin(Date.now() / 1000 + this.x / 100) * 0.1;
    this.glowIntensity = Math.max(0.5, Math.min(1.2, this.glowIntensity));
  }
  
  /**
   * Render obstacle with neon effects
   */
  render(renderer) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    // Save canvas state for rotation
    renderer.ctx.save();
    renderer.ctx.translate(centerX, centerY);
    renderer.ctx.rotate(this.rotation);
    
    switch (this.type) {
      case 'square':
        this.renderSquare(renderer);
        break;
      case 'rectangle':
        this.renderRectangle(renderer);
        break;
      case 'diamond':
        this.renderDiamond(renderer);
        break;
    }
    
    // Restore canvas state
    renderer.ctx.restore();
  }
  
  /**
   * Render square obstacle
   */
  renderSquare(renderer) {
    renderer.drawNeonRect(
      -this.width / 2, -this.height / 2,
      this.width, this.height,
      this.color, this.glowIntensity
    );
  }
  
  /**
   * Render rectangle obstacle
   */
  renderRectangle(renderer) {
    // Make rectangles wider or taller randomly
    const isWide = this.width > this.height;
    renderer.drawNeonRect(
      -this.width / 2, -this.height / 2,
      this.width, this.height,
      this.color, this.glowIntensity
    );
  }
  
  /**
   * Render diamond obstacle
   */
  renderDiamond(renderer) {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    
    // Draw diamond shape
    renderer.ctx.fillStyle = this.color;
    renderer.ctx.strokeStyle = this.color;
    renderer.ctx.shadowColor = this.color;
    renderer.ctx.shadowBlur = 15 * this.glowIntensity;
    renderer.ctx.lineWidth = 2;
    
    renderer.ctx.beginPath();
    renderer.ctx.moveTo(0, -halfHeight);
    renderer.ctx.lineTo(halfWidth, 0);
    renderer.ctx.lineTo(0, halfHeight);
    renderer.ctx.lineTo(-halfWidth, 0);
    renderer.ctx.closePath();
    
    renderer.ctx.fill();
    renderer.ctx.stroke();
    
    renderer.ctx.shadowBlur = 0;
  }
  
  /**
   * Check if obstacle should be removed
   */
  shouldRemove() {
    return !this.active;
  }
  
  /**
   * Get bounding box for collision detection
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}

/**
 * Obstacle Manager for handling multiple obstacles
 */
export class ObstacleManager {
  constructor(canvasWidth, canvasHeight) {
    this.obstacles = [];
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.lastSpawnTime = 0;
    this.spawnInterval = GAME_CONSTANTS.OBSTACLE_SPAWN_INTERVAL;
    this.level = 1;
  }
  
  /**
   * Update all obstacles and spawn new ones
   */
  update(deltaTime, gameTime) {
    // Update existing obstacles
    this.obstacles.forEach(obstacle => {
      obstacle.update(deltaTime, this.canvasWidth, this.canvasHeight);
    });
    
    // Remove inactive obstacles
    this.obstacles = this.obstacles.filter(obstacle => !obstacle.shouldRemove());
    
    // Spawn new obstacles
    if (gameTime - this.lastSpawnTime > this.spawnInterval) {
      this.spawnObstacle();
      this.lastSpawnTime = gameTime;
    }
    
    // Adjust difficulty based on game time
    this.adjustDifficulty(gameTime);
  }
  
  /**
   * Spawn a new obstacle
   */
  spawnObstacle() {
    const spawnX = this.canvasWidth + 50;
    const spawnY = Math.random() * (this.canvasHeight - 100) + 50;
    
    // Sometimes spawn multiple obstacles in formation
    if (Math.random() < 0.3) {
      this.spawnFormation(spawnX, spawnY);
    } else {
      this.obstacles.push(new Obstacle(spawnX, spawnY));
    }
  }
  
  /**
   * Spawn obstacles in formation for variety
   */
  spawnFormation(x, y) {
    const formations = [
      'line', 'triangle', 'wall'
    ];
    
    const formation = formations[Math.floor(Math.random() * formations.length)];
    
    switch (formation) {
      case 'line':
        for (let i = 0; i < 3; i++) {
          this.obstacles.push(new Obstacle(x + i * 60, y));
        }
        break;
        
      case 'triangle':
        this.obstacles.push(new Obstacle(x, y));
        this.obstacles.push(new Obstacle(x + 50, y - 30));
        this.obstacles.push(new Obstacle(x + 50, y + 30));
        break;
        
      case 'wall':
        const wallHeight = 150;
        const gapSize = 100;
        const gapY = Math.random() * (this.canvasHeight - wallHeight - gapSize) + wallHeight / 2;
        
        // Top part of wall
        this.obstacles.push(new Obstacle(x, 0, 30, gapY));
        // Bottom part of wall
        this.obstacles.push(new Obstacle(x, gapY + gapSize, 30, this.canvasHeight - gapY - gapSize));
        break;
    }
  }
  
  /**
   * Adjust difficulty over time
   */
  adjustDifficulty(gameTime) {
    const newLevel = Math.floor(gameTime / 30000) + 1; // Level up every 30 seconds
    
    if (newLevel !== this.level) {
      this.level = newLevel;
      
      // Decrease spawn interval (more obstacles)
      this.spawnInterval = Math.max(
        800, 
        GAME_CONSTANTS.OBSTACLE_SPAWN_INTERVAL - (this.level - 1) * 200
      );
    }
  }
  
  /**
   * Render all obstacles
   */
  render(renderer) {
    this.obstacles.forEach(obstacle => {
      obstacle.render(renderer);
    });
  }
  
  /**
   * Get all active obstacles
   */
  getObstacles() {
    return this.obstacles;
  }
  
  /**
   * Clear all obstacles
   */
  clear() {
    this.obstacles = [];
    this.lastSpawnTime = 0;
    this.level = 1;
    this.spawnInterval = GAME_CONSTANTS.OBSTACLE_SPAWN_INTERVAL;
  }
  
  /**
   * Get current level
   */
  getLevel() {
    return this.level;
  }
}