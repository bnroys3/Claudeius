/**
 * Core game functionality tests for Neon Runner
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock DOM elements for testing
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: jest.fn(() => mockContext)
};

const mockContext = {
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  createRadialGradient: jest.fn(() => mockGradient),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  shadowColor: '',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  fillStyle: '#000000',
  strokeStyle: '#000000',
  lineWidth: 1,
  font: '16px Arial',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high'
};

const mockGradient = {
  addColorStop: jest.fn()
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));

describe('Neon Runner Game - Core Functionality', () => {
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock getElementById
    global.document.getElementById = jest.fn((id) => {
      if (id === 'game-canvas') return mockCanvas;
      return null;
    });
  });

  describe('Game Constants', () => {
    test('should have valid game constants', async () => {
      const { GAME_CONSTANTS } = await import('../js/utils/Constants.js');
      
      expect(GAME_CONSTANTS.CANVAS_WIDTH).toBe(800);
      expect(GAME_CONSTANTS.CANVAS_HEIGHT).toBe(600);
      expect(GAME_CONSTANTS.PLAYER_SIZE).toBe(20);
      expect(GAME_CONSTANTS.PLAYER_SPEED).toBeGreaterThan(0);
      expect(GAME_CONSTANTS.STATES).toHaveProperty('PLAYING');
      expect(GAME_CONSTANTS.STATES).toHaveProperty('MENU');
      expect(GAME_CONSTANTS.STATES).toHaveProperty('GAME_OVER');
    });
  });

  describe('Player Class', () => {
    let Player;
    let player;
    let mockInputManager;

    beforeEach(async () => {
      ({ Player } = await import('../js/game/Player.js'));
      
      mockInputManager = {
        getMovementVector: jest.fn(() => ({ x: 0, y: 0 }))
      };
      
      player = new Player(100, 200);
    });

    test('should initialize player with correct properties', () => {
      expect(player.x).toBe(100);
      expect(player.y).toBe(200);
      expect(player.width).toBe(20);
      expect(player.height).toBe(20);
      expect(player.velocity).toEqual({ x: 0, y: 0 });
    });

    test('should update player position based on input', () => {
      mockInputManager.getMovementVector.mockReturnValue({ x: 1, y: 0 });
      
      const initialX = player.x;
      player.update(16, mockInputManager, 800, 600);
      
      // Player should have moved or started moving right
      expect(player.velocity.x).toBeGreaterThan(0);
    });

    test('should keep player within canvas bounds', () => {
      player.x = -10;
      player.y = -10;
      player.update(16, mockInputManager, 800, 600);
      
      expect(player.x).toBe(0);
      expect(player.y).toBe(0);
    });

    test('should have trail functionality', () => {
      expect(player.trail).toEqual([]);
      player.updateTrail();
      expect(player.trail.length).toBeGreaterThan(0);
    });
  });

  describe('Game Loop', () => {
    let GameLoop;
    let gameLoop;

    beforeEach(async () => {
      ({ GameLoop } = await import('../js/engine/GameLoop.js'));
      gameLoop = new GameLoop();
    });

    test('should initialize with correct properties', () => {
      expect(gameLoop.running).toBe(false);
      expect(gameLoop.targetFPS).toBe(60);
      expect(gameLoop.lastTime).toBe(0);
    });

    test('should calculate FPS correctly', () => {
      // Simulate some time passing
      gameLoop.lastTime = performance.now() - 16;
      const fps = gameLoop.getFPS();
      expect(fps).toBeGreaterThan(0);
      expect(fps).toBeLessThanOrEqual(60);
    });

    test('should start and stop game loop', () => {
      gameLoop.start();
      expect(gameLoop.running).toBe(true);
      
      gameLoop.stop();
      expect(gameLoop.running).toBe(false);
    });
  });

  describe('Input Manager', () => {
    let InputManager;
    let inputManager;

    beforeEach(async () => {
      ({ InputManager } = await import('../js/engine/InputManager.js'));
      inputManager = new InputManager();
    });

    test('should initialize with empty key states', () => {
      expect(inputManager.keys).toEqual({});
      expect(inputManager.previousKeys).toEqual({});
    });

    test('should track key states', () => {
      inputManager.handleKeyDown({ code: 'ArrowUp', preventDefault: jest.fn() });
      expect(inputManager.keys['ArrowUp']).toBe(true);
    });

    test('should return correct movement vector', () => {
      inputManager.keys['ArrowUp'] = true;
      inputManager.keys['ArrowRight'] = true;
      
      const vector = inputManager.getMovementVector();
      expect(vector.x).toBe(1);
      expect(vector.y).toBe(-1);
    });

    test('should detect key press events', () => {
      inputManager.keys['Space'] = true;
      inputManager.previousKeys['Space'] = false;
      
      expect(inputManager.wasKeyPressed('Space')).toBe(true);
    });
  });

  describe('Collision Detection', () => {
    let CollisionDetector;

    beforeEach(async () => {
      ({ CollisionDetector } = await import('../js/engine/CollisionDetector.js'));
    });

    test('should detect rectangle collision', () => {
      const rect1 = { x: 10, y: 10, width: 20, height: 20 };
      const rect2 = { x: 15, y: 15, width: 20, height: 20 };
      
      expect(CollisionDetector.checkRectCollision(rect1, rect2)).toBe(true);
    });

    test('should not detect collision when rectangles do not overlap', () => {
      const rect1 = { x: 10, y: 10, width: 20, height: 20 };
      const rect2 = { x: 50, y: 50, width: 20, height: 20 };
      
      expect(CollisionDetector.checkRectCollision(rect1, rect2)).toBe(false);
    });

    test('should detect circle collision', () => {
      const circle1 = { x: 10, y: 10, radius: 5 };
      const circle2 = { x: 12, y: 12, radius: 5 };
      
      expect(CollisionDetector.checkCircleCollision(circle1, circle2)).toBe(true);
    });
  });

  describe('Game State Management', () => {
    let Game;
    let game;
    let mockRenderer;
    let mockInputManager;

    beforeEach(async () => {
      ({ Game } = await import('../js/game/Game.js'));
      
      mockRenderer = {
        clear: jest.fn(),
        drawNeonText: jest.fn(),
        drawNeonRect: jest.fn(),
        drawHUD: jest.fn(),
        drawGameOver: jest.fn(),
        drawPauseScreen: jest.fn()
      };
      
      mockInputManager = {
        wasKeyPressed: jest.fn(() => false),
        getMovementVector: jest.fn(() => ({ x: 0, y: 0 })),
        update: jest.fn()
      };
      
      game = new Game(mockRenderer, mockInputManager);
    });

    test('should initialize in menu state', () => {
      expect(game.state).toBe('menu');
      expect(game.score).toBe(0);
      expect(game.lives).toBe(3);
      expect(game.level).toBe(1);
    });

    test('should start game when space is pressed in menu', () => {
      mockInputManager.wasKeyPressed.mockReturnValue(true);
      game.updateMenu(16);
      
      expect(game.state).toBe('playing');
    });

    test('should pause and resume game', () => {
      game.state = 'playing';
      game.pauseGame();
      expect(game.state).toBe('paused');
      
      game.resumeGame();
      expect(game.state).toBe('playing');
    });

    test('should handle game over', () => {
      game.lives = 1;
      game.handlePlayerHit();
      expect(game.state).toBe('gameOver');
    });

    test('should add score correctly', () => {
      const initialScore = game.score;
      game.addScore(100);
      expect(game.score).toBe(initialScore + 100);
    });

    test('should update high score', () => {
      game.score = 1000;
      game.addScore(500);
      expect(game.highScore).toBe(1500);
    });
  });

  describe('Renderer', () => {
    let Renderer;
    let renderer;

    beforeEach(async () => {
      ({ Renderer } = await import('../js/engine/Renderer.js'));
      renderer = new Renderer(mockCanvas, mockContext);
    });

    test('should initialize with canvas and context', () => {
      expect(renderer.canvas).toBe(mockCanvas);
      expect(renderer.ctx).toBe(mockContext);
    });

    test('should clear canvas', () => {
      renderer.clear();
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    test('should draw neon text with glow effects', () => {
      renderer.drawNeonText('TEST', 100, 100, 20, '#FF0000');
      
      // Should set up glow effect and draw text
      expect(mockContext.shadowColor).toBe('#FF0000');
      expect(mockContext.shadowBlur).toBeGreaterThan(0);
    });

    test('should draw neon rectangle with glow', () => {
      renderer.drawNeonRect(10, 10, 50, 50, '#00FF00');
      
      expect(mockContext.shadowColor).toBe('#00FF00');
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });
});