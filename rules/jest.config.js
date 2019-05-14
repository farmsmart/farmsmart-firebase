const { defaults } = require("jest-config");
module.exports = {
  moduleFileExtensions: [...defaults.moduleFileExtensions, "ts", "tsx"],
  testMatch: ["**/firestore/**/*.test.js", "**/database/**/*.test.js"],
  testPathIgnorePatterns: ["/node_modules/"],
  testEnvironment: "node",
  verbose: true
};
