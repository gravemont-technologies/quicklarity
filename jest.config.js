module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'routes/**/*.js',
    'lib/**/*.js',
    'worker/**/*.js',
    '!worker/node_modules/**',
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  testTimeout: 30000, // 30 seconds for tests involving external APIs
};

