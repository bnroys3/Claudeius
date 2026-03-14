import { GAME_CONSTANTS } from '../utils/Constants.js';

/**
 * Rendering System for Neon Runner
 * Handles all canvas drawing with neon visual effects
 */
export class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.setupCanvas();
  }
  
  setupCanvas() {
    // Set canvas size
    this.canvas.width = GAME_CONSTANTS.CANVAS_WIDTH;
    this.canvas.height = GAME_CONSTANTS.CANVAS_HEIGHT;
    
    // Enable smooth rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }
  
  /**
   * Clear the entire canvas with dark background
   */
  clear() {
    // Create gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#000011');
    gradient.addColorStop(1, '#000000');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add subtle grid pattern
    this.drawGrid();
  }
  
  /**
   * Draw cyberpunk grid background
   */
  drawGrid() {
    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    
    const gridSize = 50;
    
    // Vertical lines
    for (let x = 0; x <= this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
    
    this.ctx.setLineDash([]);
  }
  
  /**
   * Draw neon glow effect
   */
  drawNeonGlow(x, y, width, height, color, intensity = 1) {
    const glowSize = 20 * intensity;
    
    // Create radial gradient for glow
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = Math.max(width, height) / 2 + glowSize;
    
    const gradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.3, color + '80');
    gradient.addColorStop(0.7, color + '20');
    gradient.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - glowSize, y - glowSize, width + glowSize * 2, height + glowSize * 2);
  }
  
  /**
   * Draw rectangle with neon effect
   */
  drawNeonRect(x, y, width, height, color, glowIntensity = 1) {
    // Draw glow first
    this.drawNeonGlow(x, y, width, height, color, glowIntensity);
    
    // Draw main shape
    this.ctx.fillStyle = color;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 15 * glowIntensity;
    this.ctx.fillRect(x, y, width, height);
    
    // Draw bright border
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 5;
    this.ctx.strokeRect(x, y, width, height);
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
  }
  
  /**
   * Draw circle with neon effect
   */
  drawNeonCircle(x, y, radius, color, glowIntensity = 1) {
    // Draw glow
    const glowRadius = radius + 10 * glowIntensity;
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, color + '60');
    gradient.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw main circle
    this.ctx.fillStyle = color;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 10 * glowIntensity;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw bright border
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 5;
    this.ctx.stroke();
    
    this.ctx.shadowBlur = 0;
  }
  
  /**
   * Draw text with neon effect
   */
  drawNeonText(text, x, y, fontSize = 24, color = '#00FFFF') {
    this.ctx.font = `${fontSize}px 'Orbitron', monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Draw glow
    this.ctx.fillStyle = color + '60';
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 20;
    this.ctx.fillText(text, x, y);
    
    // Draw main text
    this.ctx.fillStyle = color;
    this.ctx.shadowBlur = 10;
    this.ctx.fillText(text, x, y);
    
    // Draw bright inner text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText(text, x, y);
  }
  
  /**
   * Draw particle effect
   */
  drawParticle(particle) {
    const alpha = particle.life / particle.maxLife;
    const size = particle.size * alpha;
    const color = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    
    this.drawNeonCircle(particle.x, particle.y, size, color, alpha);
  }
  
  /**
   * Draw trail effect for player
   */
  drawTrail(points, color) {
    if (points.length < 2) return;
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 10;
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      const alpha = i / points.length;
      this.ctx.globalAlpha = alpha;
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
  }
  
  /**
   * Draw HUD elements
   */
  drawHUD(gameState) {
    // Score display
    this.drawNeonText(
      `SCORE: ${gameState.score.toLocaleString()}`,
      100, 40, 20, '#00FFFF'
    );
    
    // Lives display
    this.drawNeonText(
      `LIVES: ${gameState.lives}`,
      100, 70, 16, '#FF1493'
    );
    
    // Level display
    this.drawNeonText(
      `LEVEL: ${gameState.level}`,
      this.canvas.width - 100, 40, 20, '#00FF00'
    );
    
    // Power-up status
    if (gameState.powerUpActive) {
      const timeLeft = Math.ceil(gameState.powerUpTimeLeft / 1000);
      this.drawNeonText(
        `POWER-UP: ${timeLeft}s`,
        this.canvas.width - 100, 70, 16, '#FFFF00'
      );
    }
  }
  
  /**
   * Draw game over screen
   */
  drawGameOver(finalScore, highScore) {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // Game Over title
    this.drawNeonText('GAME OVER', centerX, centerY - 100, 48, '#FF1493');
    
    // Final score
    this.drawNeonText(
      `Final Score: ${finalScore.toLocaleString()}`,
      centerX, centerY - 40, 24, '#00FFFF'
    );
    
    // High score
    if (finalScore > highScore) {
      this.drawNeonText('NEW HIGH SCORE!', centerX, centerY, 20, '#00FF00');
    } else {
      this.drawNeonText(
        `High Score: ${highScore.toLocaleString()}`,
        centerX, centerY, 20, '#FFFF00'
      );
    }
    
    // Restart instruction
    this.drawNeonText(
      'Press SPACE to restart',
      centerX, centerY + 60, 18, '#FFFFFF'
    );
  }
  
  /**
   * Draw pause screen
   */
  drawPauseScreen() {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.drawNeonText('PAUSED', centerX, centerY, 36, '#FFFF00');
    this.drawNeonText('Press ESC to resume', centerX, centerY + 50, 18, '#FFFFFF');
  }
}