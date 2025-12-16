export default {
  testEnvironment: "node",
  transform: {},

  testMatch: ["**/tests/**/*.test.js"],

  verbose: true,

  testTimeout: 20000,

  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
