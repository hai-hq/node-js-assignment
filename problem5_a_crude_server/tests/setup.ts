/**
 * Test setup file
 * Runs before all tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:'; // Use in-memory SQLite for tests
process.env.PORT = '3002';

// Increase timeout for integration tests
jest.setTimeout(10000);

