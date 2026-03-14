// Game Constants for Neon Runner
export const GAME_CONSTANTS = {
  // Canvas settings
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  
  // Player settings
  PLAYER_SIZE: 20,
  PLAYER_SPEED: 300, // pixels per second
  PLAYER_COLOR: '#00FFFF',
  PLAYER_GLOW: '#00FFFF',
  
  // Obstacle settings
  OBSTACLE_MIN_SIZE: 30,
  OBSTACLE_MAX_SIZE: 80,
  OBSTACLE_SPEED: 200,
  OBSTACLE_SPAWN_INTERVAL: 2000, // milliseconds
  OBSTACLE_COLOR: '#FF1493',
  
  // Power-up settings
  POWERUP_SIZE: 25,
  POWERUP_SPEED: 150,
  POWERUP_SPAWN_INTERVAL: 5000,
  POWERUP_COLOR: '#00FF00',
  POWERUP_DURATION: 3000, // effect duration in ms
  
  // Scoring
  SCORE_PER_SECOND: 10,
  SCORE_POWERUP: 100,
  SCORE_OBSTACLE_DODGE: 50,
  
  // Physics
  FRICTION: 0.9,
  MAX_VELOCITY: 400,
  
  // Particles
  MAX_PARTICLES: 100,
  PARTICLE_LIFETIME: 1000,
  
  // Game states
  STATES: {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
  }
};

export const INPUT_KEYS = {
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  SPACE: 'Space',
  ESCAPE: 'Escape'
};