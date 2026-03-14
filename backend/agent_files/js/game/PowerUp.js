import { GAME_CONSTANTS } from '../utils/Constants.js';

/**
 * PowerUp class for Neon Runner
 * Handles power-up spawning, movement, collection, and effects
 */
export class PowerUp {
  constructor(x, y, type = null) {
    this.x = x;
    this.y = y;
    this.width = GAME_CONSTANTS.POWERUP_SIZE;
    this.height = GAME_CONSTANTS.POWERUP_SIZE;
    
    // Power-up type
    this.type = type || this.getRandomType();
    
    // Movement properties
    this.velocity = {
      x: -GAME_CONSTANTS.POWERUP_SPEED,
      y: Math.sin(Date.now() / 1000) * 50 // Floating motion
    };
    
    // Visual properties
    this.color = this.getColorForType();
    this.glowIntensity = 1;
    this.rotation = 0;
    this.rotationSpeed = 2;
    this.pulsePhase = Math.random() * Math.PI * 2;
    
    // State
    this.active = true;
    this.collected = false;
    this.floatOffset = 0;
  }
  
  /**
   * Get random power-up type
   */
  getRandomType() {
    const types = ['speed', 'invulnerable', 'points', 'life'];
    const weights = [0.3, 0.2, 0.35, 0.15]; // Probability weights
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return types[i];
      }
    }
    
    return types[0]; // fallback
  }
  
  /**
   * Get color based on power-up type
   */
  getColorForType() {
    switch (this.type) {
      case 'speed':
        return '#FFFF00'; // Yellow
      case 'invulnerable':
        return '#00FF00'; // Green
      case 'points':
        return '#FF8C00'; // Orange
      case 'life':
        return '#FF69B4'; // Pink
      default:
        return GAME_CONSTANTS.POWERUP_COLOR;
    }
  }
  
  /**
   * Update power-up state
   */
  update(deltaTime, canvasWidth, canvasHeight) {
    const deltaSeconds = deltaTime / 1000;
    
    // Update position
    this.x += this.velocity.x * deltaSeconds;
    
    // Floating motion
    this.floatOffset += deltaSeconds * 3;
    this.y += Math.sin(this.floatOffset) * 30 * deltaSeconds;
    
    // Keep within vertical bounds
    if (this.y < 0) {
      this.y = 0;
    } else if (this.y + this.height > canvasHeight) {
      this.y = canvasHeight - this.height;
    }
    
    // Update rotation
    this.rotation += this.rotationSpeed * deltaSeconds;
    
    // Update glow effect (pulsing)
    this.glowIntensity = 0.8 + 0.4 * Math.sin(Date.now() / 300 + this.pulsePhase);
    
    // Mark as inactive if off-screen
    if (this.x + this.width < 0) {
      this.active = false;
    }
  }
  
  /**
   * Render power-up with special effects
   */
  render(renderer) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    // Save canvas state for rotation
    renderer.ctx.save();
    renderer.ctx.translate(centerX, centerY);
    renderer.ctx.rotate(this.rotation);
    
    // Draw based on type
    switch (this.type) {
      case 'speed':
        this.renderSpeedPowerUp(renderer);
        break;
      case 'invulnerable':
        this.renderShieldPowerUp(renderer);
        break;
      case 'points':
        this.renderPointsPowerUp(renderer);
        break;
      case 'life':
        this.renderLifePowerUp(renderer);
        break;
      default:
        this.renderDefaultPowerUp(renderer);
        break;
    }
    
    // Restore canvas state
    renderer.ctx.restore();
    
    // Draw floating particles around power-up
    this.renderParticles(renderer, centerX, centerY);
  }
  
  /**
   * Render speed power-up (lightning bolt)
   */
  renderSpeedPowerUp(renderer) {
    const size = this.width / 2;
    
    // Draw lightning bolt shape
    renderer.ctx.fillStyle = this.color;
    renderer.ctx.strokeStyle = this.color;
    renderer.ctx.shadowColor = this.color;
    renderer.ctx.shadowBlur = 20 * this.glowIntensity;
    renderer.ctx.lineWidth = 3;
    
    renderer.ctx.beginPath();
    renderer.ctx.moveTo(-size * 0.3, -size);
    renderer.ctx.lineTo(size * 0.3, -size * 0.2);
    renderer.ctx.lineTo(-size * 0.1, -size * 0.2);
    renderer.ctx.lineTo(size * 0.3, size);
    renderer.ctx.lineTo(-size * 0.3, size * 0.2);
    renderer.ctx.lineTo(size * 0.1, size * 0.2);
    renderer.ctx.closePath();
    
    renderer.ctx.fill();
    renderer.ctx.stroke();
    
    renderer.ctx.shadowBlur = 0;
  }
  
  /**
   * Render shield power-up (hexagon)
   */
  renderShieldPowerUp(renderer) {
    const radius = this.width / 2;
    const sides = 6;
    
    renderer.ctx.fillStyle = this.color;
    renderer.ctx.strokeStyle = this.color;
    renderer.ctx.shadowColor = this.color;
    renderer.ctx.shadowBlur = 15 * this.glowIntensity;
    renderer.ctx.lineWidth = 2;
    
    renderer.ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        renderer.ctx.moveTo(x, y);
      } else {
        renderer.ctx.lineTo(x, y);
      }
    }
    renderer.ctx.closePath();
    
    renderer.ctx.fill();
    renderer.ctx.stroke();
    
    renderer.ctx.shadowBlur = 0;
  }
  
  /**
   * Render points power-up (star)
   */
  renderPointsPowerUp(renderer) {
    const outerRadius = this.width / 2;
    const innerRadius = outerRadius * 0.5;
    const spikes = 5;
    
    renderer.ctx.fillStyle = this.color;
    renderer.ctx.strokeStyle = this.color;
    renderer.ctx.shadowColor = this.color;
    renderer.ctx.shadowBlur = 18 * this.glowIntensity;
    renderer.ctx.lineWidth = 2;
    
    renderer.ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i / (spikes * 2)) * Math.PI * 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        renderer.ctx.moveTo(x, y);
      } else {
        renderer.ctx.lineTo(x, y);
      }
    }
    renderer.ctx.closePath();
    
    renderer.ctx.fill();
    renderer.ctx.stroke();
    
    renderer.ctx.shadowBlur = 0;
  }
  
  /**
   * Render life power-up (heart)
   */
  renderLifePowerUp(renderer) {
    const size = this.width / 2;
    
    renderer.ctx.fillStyle = this.color;
    renderer.ctx.shadowColor = this.color;
    renderer.ctx.shadowBlur = 15 * this.glowIntensity;
    
    // Draw heart shape
    renderer.ctx.beginPath();
    renderer.ctx.moveTo(0, -size * 0.3);
    renderer.ctx.bezierCurveTo(-size, -size, -size, size * 0.3, 0, size);
    renderer.ctx.bezierCurveTo(size, size * 0.3, size, -size, 0, -size * 0.3);
    renderer.ctx.closePath();
    
    renderer.ctx.fill();
    
    renderer.ctx.shadowBlur = 0;
  }
  
  /**
   * Render default power-up (diamond)
   */
  renderDefaultPowerUp(renderer) {
    renderer.drawNeonRect(
      -this.width / 2, -this.height / 2,
      this.width, this.height,
      this.color, this.glowIntensity
    );
  }
  
  /**
   * Render floating particles around power-up
   */
  renderParticles(renderer, centerX, centerY) {
    const particleCount = 8;
    const time = Date.now() / 1000;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + time;
      const distance = 30 + Math.sin(time * 2 + i) * 5;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const size = 2 + Math.sin(time * 3 + i) * 1;
      
      renderer.drawNeonCircle(x, y, size, this.color, 0.5);
    }
  }
  
  /**
   * Handle collection by player
   */
  collect() {
    if (!this.collected) {
      this.collected = true;
      this.active = false;
      return true;
    }
    return false;
  }
  
  /**
   * Get effect description for UI
   */
  getEffectDescription() {
    switch (this.type) {
      case 'speed':
        return 'Speed Boost!';
      case 'invulnerable':
        return 'Invulnerability!';
      case 'points':
        return 'Bonus Points!';
      case 'life':
        return 'Extra Life!';
      default:
        return 'Power-Up!';
    }
  }
  
  /**
   * Get points value
   */
  getPointsValue() {
    switch (this.type) {
      case 'speed':
        return 50;
      case 'invulnerable':
        return 100;
      case 'points':
        return 200;
      case 'life':
        return 500;
      default:
        return GAME_CONSTANTS.SCORE_POWERUP;
    }
  }
  
  /**
   * Check if power-up should be removed
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
 * PowerUp Manager for handling multiple power-ups
 */
export class PowerUpManager {
  constructor(canvasWidth, canvasHeight) {
    this.powerUps = [];
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.lastSpawnTime = 0;
    this.spawnInterval = GAME_CONSTANTS.POWERUP_SPAWN_INTERVAL;
  }
  
  /**
   * Update all power-ups and spawn new ones
   */
  update(deltaTime, gameTime) {
    // Update existing power-ups
    this.powerUps.forEach(powerUp => {
      powerUp.update(deltaTime, this.canvasWidth, this.canvasHeight);
    });
    
    // Remove inactive power-ups
    this.powerUps = this.powerUps.filter(powerUp => !powerUp.shouldRemove());
    
    // Spawn new power-ups
    if (gameTime - this.lastSpawnTime > this.spawnInterval) {
      this.spawnPowerUp();
      this.lastSpawnTime = gameTime;
    }
  }
  
  /**
   * Spawn a new power-up
   */
  spawnPowerUp() {
    const spawnX = this.canvasWidth + 50;
    const spawnY = Math.random() * (this.canvasHeight - 100) + 50;
    
    this.powerUps.push(new PowerUp(spawnX, spawnY));
  }
  
  /**
   * Render all power-ups
   */
  render(renderer) {
    this.powerUps.forEach(powerUp => {
      powerUp.render(renderer);
    });
  }
  
  /**
   * Get all active power-ups
   */
  getPowerUps() {
    return this.powerUps;
  }
  
  /**
   * Clear all power-ups
   */
  clear() {
    this.powerUps = [];
    this.lastSpawnTime = 0;
  }
  
  /**
   * Force spawn a specific power-up type
   */
  spawnSpecificPowerUp(type, x = null, y = null) {
    const spawnX = x || this.canvasWidth + 50;
    const spawnY = y || Math.random() * (this.canvasHeight - 100) + 50;
    
    this.powerUps.push(new PowerUp(spawnX, spawnY, type));
  }
}