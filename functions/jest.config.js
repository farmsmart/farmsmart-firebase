const { defaults } = require('jest-config');
module.exports = {
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
  testPathIgnorePatterns: ['/node_modules/'],
  testEnvironment: 'node',
  verbose: false,
  reporters: ['default', 'jest-dot-reporter', 'jest-junit'],
};
