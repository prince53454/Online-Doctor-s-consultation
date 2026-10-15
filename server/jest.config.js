module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/helpers/env.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/routes/**/*.js',
    'src/middleware/**/*.js',
    'src/services/**/*.js',
    '!node_modules'
  ],
  testTimeout: 30000
};
