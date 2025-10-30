/**
 * Tests for database connection error at module level (line 12)
 * This uses Jest's module mocking to intercept the Database constructor
 */

// We need to mock sqlite3 BEFORE importing database.ts
const mockDatabaseConstructor = jest.fn();

jest.mock('sqlite3', () => {
  return {
    __esModule: true,
    default: {
      Database: mockDatabaseConstructor,
      verbose: jest.fn().mockReturnValue({
        Database: mockDatabaseConstructor,
      }),
    },
  };
});

describe('Database Connection at Module Load - Line 12', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    jest.resetModules(); // Reset module cache
    
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('should log error when database connection fails at module load (line 12)', () => {
    // Mock the Database constructor to call the callback with an error
    const connectionError = new Error('unable to open database file');
    
    mockDatabaseConstructor.mockImplementation((_path: string, callback: (err: Error | null) => void) => {
      // Immediately call the callback with an error
      callback(connectionError);
      return {
        run: jest.fn(),
        get: jest.fn(),
        all: jest.fn(),
        close: jest.fn(),
      };
    });

    // Now import the database module - this will execute the module-level code
    require('../../src/database');

    // Verify that line 12 was executed (console.error was called)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error opening database:',
      'unable to open database file'
    );
  });

  it('should log success when database connection succeeds (line 14)', () => {
    // Mock the Database constructor to call the callback without error
    mockDatabaseConstructor.mockImplementation((_path: string, callback: (err: Error | null) => void) => {
      // Call the callback with null (success)
      callback(null);
      return {
        run: jest.fn(),
        get: jest.fn(),
        all: jest.fn(),
        close: jest.fn(),
      };
    });

    // Import the database module
    require('../../src/database');

    // Verify that line 14 was executed
    expect(consoleLogSpy).toHaveBeenCalledWith('✓ Connected to SQLite database');
  });

  it('should handle SQLITE_CANTOPEN error (line 12)', () => {
    const cantOpenError = new Error('SQLITE_CANTOPEN: unable to open database file');
    
    mockDatabaseConstructor.mockImplementation((_path: string, callback: (err: Error | null) => void) => {
      callback(cantOpenError);
      return {
        run: jest.fn(),
        get: jest.fn(),
        all: jest.fn(),
        close: jest.fn(),
      };
    });

    require('../../src/database');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error opening database:',
      'SQLITE_CANTOPEN: unable to open database file'
    );
  });
});

