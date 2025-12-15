export default {
  testEnvironment: "node",

  // Do NOT include extensionsToTreatAsEsm when using "type": "module"
  transform: {},

  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  verbose: true,
};
