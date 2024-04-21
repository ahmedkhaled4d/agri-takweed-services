/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/config/testSetup.ts"],
  testTimeout: 60 * 10000,
  rootDir: "src",
  verbose: true,
  clearMocks: true,
  testMatch: ["**/__tests__/**/*.test.ts"],
  coveragePathIgnorePatterns: ["/node_modules/"]
};
