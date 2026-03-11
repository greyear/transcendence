/**
 * Jest Configuration for Core Service
 *
 * Key settings:
 * - preset: 'ts-jest' → Transform TypeScript to JavaScript for tests
 * - testEnvironment: 'node' → Run in Node.js (not browser)
 * - extensionsToTreatAsEsm: ['.ts'] → Treat .ts files as ES modules
 * - transform: Use ts-jest for .ts files with ES module support
 * - testMatch: Find test files in __tests__ folders or *.test.ts files
 */

export default {
	// Use ts-jest preset for TypeScript support
	preset: 'ts-jest',

	// Run tests in Node.js environment (not browser)
	testEnvironment: 'node',

	// Treat .ts files as ES modules
	extensionsToTreatAsEsm: ['.ts'],

	// Map local ESM imports like ../file.js to source ../file.ts during tests
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},

	// Transform .ts files with ts-jest
	transform: {
		'^.+\\.ts$': [
			'ts-jest',
			{
				useESM: true,
			},
		],
	},

	// Test file pattern
	testMatch: ['**/*.test.ts'],

	// Run setup hooks after environment is ready
	setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

	// Coverage settings (optional, useful for CI/CD)
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/**/*.d.ts',
		'!src/index.ts', // Entry point doesn't need coverage
	],

	// Verbose output for better debugging
	verbose: true,
};
