// Test setup and global mocks for Neon Runner

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === '2d') {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      createImageData: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      miterLimit: 10,
      shadowColor: 'rgba(0, 0, 0, 0)',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic'
    };
  }
  return null;
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(callback => {
  return setTimeout(callback, 16); // Simulate 60fps
});

global.cancelAnimationFrame = jest.fn(id => {
  clearTimeout(id);
});

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => [])
};

// Mock Web Audio API
global.AudioContext = jest.fn(() => ({
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { value: 440 }
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { value: 1 }
  })),
  destination: {},
  currentTime: 0
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.localStorage = localStorageMock;

// Mock Image constructor
global.Image = class {
  constructor() {
    this.addEventListener = jest.fn();
    this.removeEventListener = jest.fn();
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
};

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Global test utilities
global.createMockCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  return canvas;
};

global.createMockGameState = () => ({
  score: 0,
  level: 1,
  lives: 3,
  speed: 200,
  isPlaying: false,
  isPaused: false,
  gameOver: false
});

// Mock game constants
global.GAME_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  PLAYER_SPEED: 200,
  GRID_SIZE: 20,
  MAX_OBSTACLES: 10,
  POWERUP_SPAWN_RATE: 0.1,
  COLLISION_TOLERANCE: 2
};

// Set up DOM
document.body.innerHTML = `
  <canvas id="game-canvas" width="800" height="600"></canvas>
  <div id="score">0</div>
  <div id="level">1</div>
  <div id="lives">3</div>
`;

// Jest custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toBeValidGameEntity(received) {
    const hasRequiredProperties = received && 
      typeof received.x === 'number' &&
      typeof received.y === 'number' &&
      typeof received.width === 'number' &&
      typeof received.height === 'number';
    
    if (hasRequiredProperties) {
      return {
        message: () => `expected ${received} not to be a valid game entity`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid game entity with x, y, width, height`,
        pass: false,
      };
    }
  }
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset DOM state
  const canvas = document.getElementById('game-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  // Reset localStorage
  localStorage.clear();
});