import { GAME_CONSTANTS } from '../utils/Constants.js';
import { Player } from './Player.js';
import { ObstacleManager } from './Obstacle.js';
import { PowerUpManager } from './PowerUp.js';
import { CollisionDetector } from '../engine/CollisionDetector.js';

/**
 * Main Game State Manager for Neon Runner
 * Handles all game logic, state transitions, and coordination
 */
export class Game {
  constructor(renderer, inputManager) {
    this.renderer = renderer;
    this.inputManager = inputManager;
    
    // Game state
    this.state = GAME_CONSTANTS.STATES.MENU;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameTime = 0;
    this.highScore = this.loadHighScore();
    
    // Game entities
    this.player = new Player(100, 300);
    this.obstacleManager = new ObstacleManager(
      GAME_CONSTANTS.CANVAS_WIDTH, 
      GAME_CONSTANTS.CANVAS_HEIGHT
    );
    this.powerUpManager = new PowerUpManager(
      GAME_CONSTANTS.CANVAS_WIDTH, 
      GAME_CONSTANTS.CANVAS_HEIGHT
    );
    
    // Power-up effects
    this.powerUpActive = false;
    this.powerUpTimeLeft = 0;
    this.currentPowerUpType = null;
    
    // Scoring
    this.lastScoreTime = 0;
    this.scoreMultiplier = 1;
    
    // UI elements
    this.showMessage = false;
    this.messageText = '';
    this.messageTime = 0;
    this.messageColor = '#FFFFFF';
    
    // Pause functionality
    this.pauseStartTime = 0;
  }
  
  /**
   * Update game state
   */
  update(deltaTime, currentTime) {
    switch (this.state) {
      case GAME_CONSTANTS.STATES.MENU:
        this.updateMenu(deltaTime);
        break;
      case GAME_CONSTANTS.STATES.PLAYING:
        this.updatePlaying(deltaTime, currentTime);
        break;
      case GAME_CONSTANTS.STATES.PAUSED:
        this.updatePaused(deltaTime);
        break;
      case GAME_CONSTANTS.STATES.GAME_OVER:
        this.updateGameOver(deltaTime);
        break;
    }
  }
  
  /**
   * Update menu state
   */
  updateMenu(deltaTime) {
    // Check for start game input
    if (this.inputManager.wasKeyPressed('Space')) {
      this.startGame();
    }
  }
  
  /**
   * Update playing state
   */
  updatePlaying(deltaTime, currentTime) {
    // Check for pause input
    if (this.inputManager.wasKeyPressed('Escape')) {
      this.pauseGame();
      return;
    }
    
    // Update game time
    this.gameTime += deltaTime;
    
    // Update player
    this.player.update(
      deltaTime, 
      this.inputManager, 
      GAME_CONSTANTS.CANVAS_WIDTH, 
      GAME_CONSTANTS.CANVAS_HEIGHT
    );
    
    // Update obstacles
    this.obstacleManager.update(deltaTime, this.gameTime);
    
    // Update power-ups
    this.powerUpManager.update(deltaTime, this.gameTime);
    
    // Update power-up effects
    this.updatePowerUpEffects(deltaTime);
    
    // Check collisions
    this.checkCollisions();
    
    // Update score
    this.updateScore(deltaTime);
    
    // Update level
    this.updateLevel();
    
    // Update messages
    this.updateMessages(deltaTime);
  }
  
  /**
   * Update paused state
   */
  updatePaused(deltaTime) {
    // Check for resume input
    if (this.inputManager.wasKeyPressed('Escape')) {
      this.resumeGame();
    }
  }
  
  /**
   * Update game over state
   */
  updateGameOver(deltaTime) {
    // Check for restart input
    if (this.inputManager.wasKeyPressed('Space')) {
      this.startGame();
    }
  }
  
  /**
   * Update power-up effects
   */
  updatePowerUpEffects(deltaTime) {
    if (this.powerUpActive) {
      this.powerUpTimeLeft -= deltaTime;
      
      if (this.powerUpTimeLeft <= 0) {
        this.powerUpActive = false;
        this.currentPowerUpType = null;
        this.scoreMultiplier = 1;
      }
    }
  }
  
  /**
   * Check all collisions
   */
  checkCollisions() {
    // Player vs Obstacles
    const obstacles = this.obstacleManager.getObstacles();
    for (const obstacle of obstacles) {
      if (this.player.checkCollision(obstacle)) {
        if (this.player.onObstacleCollision()) {
          this.handlePlayerHit();
          break;
        }
      }
    }
    
    // Player vs Power-ups
    const powerUps = this.powerUpManager.getPowerUps();
    for (const powerUp of powerUps) {
      if (CollisionDetector.checkRectCollision(this.player, powerUp)) {
        this.collectPowerUp(powerUp);
        break;
      }
    }
  }
  
  /**
   * Handle player hit by obstacle
   */
  handlePlayerHit() {
    this.lives--;
    this.showMessage('Hit!', '#FF1493', 1000);
    
    if (this.lives <= 0) {
      this.gameOver();
    }
  }
  
  /**
   * Handle power-up collection
   */
  collectPowerUp(powerUp) {
    if (powerUp.collect()) {
      // Apply power-up effect
      this.applyPowerUpEffect(powerUp);
      
      // Add score
      this.addScore(powerUp.getPointsValue());
      
      // Show message
      this.showMessage(
        powerUp.getEffectDescription(),
        powerUp.color,
        2000
      );
    }
  }
  
  /**
   * Apply power-up effect
   */
  applyPowerUpEffect(powerUp) {
    switch (powerUp.type) {
      case 'speed':
        this.player.collectPowerUp(powerUp);
        this.powerUpActive = true;
        this.powerUpTimeLeft = GAME_CONSTANTS.POWERUP_DURATION;
        this.currentPowerUpType = 'speed';
        break;
        
      case 'invulnerable':
        this.player.collectPowerUp(powerUp);
        this.powerUpActive = true;
        this.powerUpTimeLeft = GAME_CONSTANTS.POWERUP_DURATION;
        this.currentPowerUpType = 'invulnerable';
        break;
        
      case 'points':
        this.scoreMultiplier = 2;
        this.powerUpActive = true;
        this.powerUpTimeLeft = GAME_CONSTANTS.POWERUP_DURATION;
        this.currentPowerUpType = 'points';
        break;
        
      case 'life':
        this.lives++;
        break;
    }
  }
  
  /**
   * Update score
   */
  updateScore(deltaTime) {
    // Base score over time
    const timeBonus = Math.floor((deltaTime / 1000) * GAME_CONSTANTS.SCORE_PER_SECOND * this.scoreMultiplier);
    this.addScore(timeBonus);
  }
  
  /**
   * Add score with validation
   */
  addScore(points) {
    this.score += Math.max(0, points);
    
    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
  }
  
  /**
   * Update level based on score/time
   */
  updateLevel() {
    const newLevel = Math.floor(this.gameTime / 30000) + 1;
    if (newLevel !== this.level) {
      this.level = newLevel;
      this.showMessage(`Level ${this.level}!`, '#00FFFF', 2000);
    }
  }
  
  /**
   * Update UI messages
   */
  updateMessages(deltaTime) {
    if (this.showMessage) {
      this.messageTime -= deltaTime;
      if (this.messageTime <= 0) {
        this.showMessage = false;
      }
    }
  }
  
  /**
   * Show a temporary message
   */
  showMessage(text, color = '#FFFFFF', duration = 1000) {
    this.messageText = text;
    this.messageColor = color;
    this.messageTime = duration;
    this.showMessage = true;
  }
  
  /**
   * Start new game
   */
  startGame() {
    this.state = GAME_CONSTANTS.STATES.PLAYING;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameTime = 0;
    this.scoreMultiplier = 1;
    
    // Reset entities
    this.player.reset(100, 300);
    this.obstacleManager.clear();
    this.powerUpManager.clear();
    
    // Reset power-ups
    this.powerUpActive = false;
    this.powerUpTimeLeft = 0;
    this.currentPowerUpType = null;
    
    // Clear messages
    this.showMessage = false;
  }
  
  /**
   * Pause game
   */
  pauseGame() {
    if (this.state === GAME_CONSTANTS.STATES.PLAYING) {
      this.state = GAME_CONSTANTS.STATES.PAUSED;
      this.pauseStartTime = performance.now();
    }
  }
  
  /**
   * Resume game
   */
  resumeGame() {
    if (this.state === GAME_CONSTANTS.STATES.PAUSED) {
      this.state = GAME_CONSTANTS.STATES.PLAYING;
    }
  }
  
  /**
   * Game over
   */
  gameOver() {
    this.state = GAME_CONSTANTS.STATES.GAME_OVER;
    this.saveHighScore();
  }
  
  /**
   * Render game
   */
  render() {
    // Clear canvas
    this.renderer.clear();
    
    switch (this.state) {
      case GAME_CONSTANTS.STATES.MENU:
        this.renderMenu();
        break;
      case GAME_CONSTANTS.STATES.PLAYING:
        this.renderPlaying();
        break;
      case GAME_CONSTANTS.STATES.PAUSED:
        this.renderPlaying();
        this.renderer.drawPauseScreen();
        break;
      case GAME_CONSTANTS.STATES.GAME_OVER:
        this.renderPlaying();
        this.renderer.drawGameOver(this.score, this.highScore);
        break;
    }
  }
  
  /**
   * Render menu screen
   */
  renderMenu() {
    const centerX = GAME_CONSTANTS.CANVAS_WIDTH / 2;
    const centerY = GAME_CONSTANTS.CANVAS_HEIGHT / 2;
    
    // Title
    this.renderer.drawNeonText('NEON RUNNER', centerX, centerY - 100, 48, '#00FFFF');
    
    // Instructions
    this.renderer.drawNeonText('Use arrow keys to move', centerX, centerY - 20, 20, '#FFFFFF');
    this.renderer.drawNeonText('Avoid obstacles, collect power-ups', centerX, centerY + 10, 20, '#FFFFFF');
    
    // High score
    this.renderer.drawNeonText(
      `High Score: ${this.highScore.toLocaleString()}`,
      centerX, centerY + 50, 18, '#FFFF00'
    );
    
    // Start instruction
    this.renderer.drawNeonText('Press SPACE to start', centerX, centerY + 100, 24, '#00FF00');
  }
  
  /**
   * Render playing state
   */
  renderPlaying() {
    // Render game entities
    this.obstacleManager.render(this.renderer);
    this.powerUpManager.render(this.renderer);
    this.player.render(this.renderer);
    
    // Render HUD
    this.renderer.drawHUD({
      score: this.score,
      lives: this.lives,
      level: this.level,
      powerUpActive: this.powerUpActive,
      powerUpTimeLeft: this.powerUpTimeLeft
    });
    
    // Render message if active
    if (this.showMessage) {
      this.renderer.drawNeonText(
        this.messageText,
        GAME_CONSTANTS.CANVAS_WIDTH / 2,
        GAME_CONSTANTS.CANVAS_HEIGHT / 2,
        24,
        this.messageColor
      );
    }
  }
  
  /**
   * Get current game state
   */
  getState() {
    return {
      state: this.state,
      score: this.score,
      lives: this.lives,
      level: this.level,
      gameTime: this.gameTime,
      highScore: this.highScore,
      powerUpActive: this.powerUpActive,
      powerUpTimeLeft: this.powerUpTimeLeft
    };
  }
  
  /**
   * Load high score from localStorage
   */
  loadHighScore() {
    try {
      const saved = localStorage.getItem('neonRunnerHighScore');
      return saved ? parseInt(saved) : 0;
    } catch (e) {
      return 0;
    }
  }
  
  /**
   * Save high score to localStorage
   */
  saveHighScore() {
    try {
      localStorage.setItem('neonRunnerHighScore', this.highScore.toString());
    } catch (e) {
      console.warn('Could not save high score to localStorage');
    }
  }
}