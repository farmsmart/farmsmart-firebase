const { defaults } = require('jest-config');
module.exports = {
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
  testMatch: [
    '**/firestore/**/*unit.test.js',
    '**/utils/**/*unit.test.js',
    '**/score/**/*unit.test.js',
  ],
  testPathIgnorePatterns: ['/node_modules/'],
  testEnvironment: 'node',
  verbose: false,
  reporters: ['default', 'jest-dot-reporter', 'jest-junit'],
};
