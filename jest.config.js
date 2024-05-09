module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 90,
        lines: 90,
        statements: 90
      }
    },    
    setupFiles: ['<rootDir>/jest.setup.js'],
    roots: ['<rootDir>/src/'],
    transform: {
      '^.+\\.ts$': 'ts-jest'
    }
  };
  