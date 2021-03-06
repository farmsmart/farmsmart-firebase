const { defaults } = require('jest-config');
module.exports = {
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
  testMatch: ['**/firestore/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  testEnvironment: 'node',
  reporters: ['default', 'jest-junit', 'jest-dot-reporter'],
  verbose: false,
};
