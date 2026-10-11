module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.js'],
    collectCoverageFrom: [
        'libs/**/*.js',
        'init.js',
        '!libs/logUtil.js',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    verbose: true,
    testTimeout: 10000,
    setupFilesAfterEnv: [],
    modulePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/website/', '<rootDir>/scripts/'],
    transform: {},
    moduleFileExtensions: ['js', 'json']
};