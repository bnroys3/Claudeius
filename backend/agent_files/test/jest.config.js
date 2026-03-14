module.exports = {
  // Test environment setup
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/setupTests.js'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/test/**/*.test.js',
    '<rootDir>/test/**/*.spec.js'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/**/*.min.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'test/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Module mapping for ES6 imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/js/$1',
    '^@game/(.*)$': '<rootDir>/js/game/$1',
    '^@engine/(.*)$': '<rootDir>/js/engine/$1',
    '^@ui/(.*)$': '<rootDir>/js/ui/$1',
    '^@utils/(.*)$': '<rootDir>/js/utils/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset modules between tests
  resetModules: true
};