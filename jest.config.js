module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFiles: ['<rootDir>/jest.setup.js'],
    roots: ['<rootDir>/src/'],
    transform: {
      '^.+\\.ts$': 'ts-jest'
    }
  };
  