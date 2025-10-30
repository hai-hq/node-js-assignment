/**
 * Unit tests for error handler middleware
 */

import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      path: '/test/path',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('errorHandler', () => {
    it('should handle errors with 500 status', () => {
      const error = new Error('Test error message');
      
      // Temporarily set NODE_ENV to production to test message hiding
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        message: undefined, // Message hidden in production
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should expose error message in development mode', () => {
      const error = new Error('Detailed error message');
      
      process.env.NODE_ENV = 'development';

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        message: 'Detailed error message',
      });
    });

    it('should log error to console', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(consoleSpy).toHaveBeenCalledWith('Error:', 'Test error');
      expect(consoleSpy).toHaveBeenCalledWith('Stack:', error.stack);

      consoleSpy.mockRestore();
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with path information', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Route not found',
        path: '/test/path',
      });
    });

    it('should handle requests with different paths', () => {
      const customRequest: Partial<Request> = {
        path: '/api/nonexistent',
      };

      notFoundHandler(customRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Route not found',
        path: '/api/nonexistent',
      });
    });
  });
});

