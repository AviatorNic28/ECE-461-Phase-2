module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/dist/'], // Ignore compiled files
  collectCoverage: true, // Enable coverage collection
  coverageDirectory: 'coverage', // Output directory for coverage reports
  collectCoverageFrom: [
    'src/**/*.{js,ts}', // Include all JS and TS files in the src directory
    '!src/**/*.d.ts', // Exclude TypeScript definition files
    '!src/index.ts' // Optionally exclude your entry point if needed
  ],
};
