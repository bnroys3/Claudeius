import { GAME_CONSTANTS } from '../utils/Constants.js';
import { CollisionDetector } from '../engine/CollisionDetector.js';

/**
 * Player class for Neon Runner
 * Handles player movement, rendering, and trail effects
 */
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = GAME_CONSTANTS.PLAYER_SIZE;
    this.height = GAME_CONSTANTS.PLAYER_SIZE;
    this.velocity = { x: 0, y: 0 };
    this.speed = GAME_CONSTANTS.PLAYER_SPEED;
    this.color = GAME_CONSTANTS.PLAYER_COLOR;
    
    // Trail effect
    this.trail = [];
    this.maxTrailLength = 10;
    
    // Animation
    this.glowIntensity = 1;
    this.glowDirection = 1;
    
    // Power-up effects
    this.invulnerable = false;
    this.invulnerableTime = 0;
    this.speedBoost = false;
    this.speedBoostTime = 0;
  }
  
  /**
   * Update player state
   */
  update(deltaTime, inputManager, canvasWidth, canvasHeight) {
    const deltaSeconds = deltaTime / 1000;
    
    // Get input movement vector
    const movement = inputManager.getMovementVector();
    
    // Calculate speed with power-up effects
    let currentSpeed = this.speed;
    if (this.speedBoost) {
      currentSpeed *= 1.5;
      this.speedBoostTime -= deltaTime;
      if (this.speedBoostTime <= 0) {
        this.speedBoost = false;
      }
    }
    
    // Apply movement with smooth acceleration
    const acceleration = currentSpeed * 3; // Quick acceleration
    this.velocity.x += movement.x * acceleration * deltaSeconds;
    this.velocity.y += movement.y * acceleration * deltaSeconds;
    
    // Apply friction when not moving
    if (movement.x === 0) {
      this.velocity.x *= GAME_CONSTANTS.FRICTION;
    }
    if (movement.y === 0) {
      this.velocity.y *= GAME_CONSTANTS.FRICTION;
    }
    
    // Limit maximum velocity
    const maxVel = GAME_CONSTANTS.MAX_VELOCITY;
    if (Math.abs(this.velocity.x) > maxVel) {
      this.velocity.x = Math.sign(this.velocity.x) * maxVel;
    }
    if (Math.abs(this.velocity.y) > maxVel) {
      this.velocity.y = Math.sign(this.velocity.y) * maxVel;
    }
    
    // Update position
    this.x += this.velocity.x * deltaSeconds;
    this.y += this.velocity.y * deltaSeconds;
    
    // Keep player within canvas bounds
    this.constrainToCanvas(canvasWidth, canvasHeight);
    
    // Update trail
    this.updateTrail();
    
    // Update animations
    this.updateAnimations(deltaTime);
    
    // Update power-up effects
    this.updatePowerUps(deltaTime);
  }
  
  /**
   * Keep player within canvas boundaries
   */
  constrainToCanvas(canvasWidth, canvasHeight) {
    if (this.x < 0) {
      this.x = 0;
      this.velocity.x = 0;
    }
    if (this.x + this.width > canvasWidth) {
      this.x = canvasWidth - this.width;
      this.velocity.x = 0;
    }
    if (this.y < 0) {
      this.y = 0;
      this.velocity.y = 0;
    }
    if (this.y + this.height > canvasHeight) {
      this.y = canvasHeight - this.height;
      this.velocity.y = 0;
    }
  }
  
  /**
   * Update trail effect
   */
  updateTrail() {
    // Add current position to trail
    this.trail.unshift({
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      time: Date.now()
    });
    
    // Remove old trail points
    if (this.trail.length > this.maxTrailLength) {
      this.trail = this.trail.slice(0, this.maxTrailLength);
    }
    
    // Remove points that are too old
    const now = Date.now();
    this.trail = this.trail.filter(point => now - point.time < 500);
  }
  
  /**
   * Update animation effects
   */
  updateAnimations(deltaTime) {
    // Pulsing glow effect
    this.glowIntensity += this.glowDirection * (deltaTime / 1000) * 2;
    if (this.glowIntensity > 1.5) {
      this.glowIntensity = 1.5;
      this.glowDirection = -1;
    } else if (this.glowIntensity < 0.7) {
      this.glowIntensity = 0.7;
      this.glowDirection = 1;
    }
  }
  
  /**
   * Update power-up effects
   */
  updatePowerUps(deltaTime) {
    if (this.invulnerable) {
      this.invulnerableTime -= deltaTime;
      if (this.invulnerableTime <= 0) {
        this.invulnerable = false;
      }
    }
  }
  
  /**
   * Render player with neon effects
   */
  render(renderer) {
    // Draw trail first
    if (this.trail.length > 1) {
      renderer.drawTrail(this.trail, this.color);
    }
    
    // Draw player with special effects based on power-ups
    let glowIntensity = this.glowIntensity;
    let color = this.color;
    
    if (this.invulnerable) {
      // Flashing effect when invulnerable
      const flash = Math.sin(Date.now() / 100) > 0;
      if (flash) {
        color = '#FFFFFF';
        glowIntensity = 2;
      }
    }
    
    if (this.speedBoost) {
      // Different color when speed boosted
      color = '#FFFF00';
    }
    
    // Draw main player
    renderer.drawNeonRect(
      this.x, this.y,
      this.width, this.height,
      color, glowIntensity
    );
  }
  
  /**
   * Check collision with other objects
   */
  checkCollision(object) {
    // Skip collision if invulnerable
    if (this.invulnerable) {
      return false;
    }
    
    return CollisionDetector.checkRectCollision(this, object);
  }
  
  /**
   * Handle collision with obstacle
   */
  onObstacleCollision() {
    if (!this.invulnerable) {
      // Become temporarily invulnerable
      this.invulnerable = true;
      this.invulnerableTime = 1000; // 1 second
      
      // Knockback effect
      this.velocity.x *= -0.5;
      this.velocity.y *= -0.5;
      
      return true; // Collision occurred
    }
    return false; // No collision due to invulnerability
  }
  
  /**
   * Handle power-up collection
   */
  collectPowerUp(powerUp) {
    switch (powerUp.type) {
      case 'speed':
        this.speedBoost = true;
        this.speedBoostTime = GAME_CONSTANTS.POWERUP_DURATION;
        break;
      case 'invulnerable':
        this.invulnerable = true;
        this.invulnerableTime = GAME_CONSTANTS.POWERUP_DURATION;
        break;
      case 'shield':
        // Add shield effect (could be implemented later)
        break;
    }
  }
  
  /**
   * Get player center position
   */
  getCenter() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }
  
  /**
   * Reset player to starting state
   */
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.velocity = { x: 0, y: 0 };
    this.trail = [];
    this.invulnerable = false;
    this.invulnerableTime = 0;
    this.speedBoost = false;
    this.speedBoostTime = 0;
  }
}