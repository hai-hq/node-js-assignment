/**
 * Enhanced validation tests for missing coverage
 */

import { Request, Response, NextFunction } from 'express';
import {
  validateCreateProduct,
  validateUpdateProduct,
} from '../../src/middleware/validation';

describe('Enhanced Validation Tests - Missing Coverage', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('validateUpdateProduct - Missing Branches', () => {
    it('should fail when name is provided but empty after trim', () => {
      mockRequest.body = {
        name: '   ',  // Only whitespace
      };

      validateUpdateProduct(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.stringContaining('Name must be a non-empty string'),
          ]),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should fail when quantity is provided as a decimal number', () => {
      mockRequest.body = {
        quantity: 10.5,  // Not an integer
      };

      validateUpdateProduct(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.stringContaining('Quantity must be a non-negative integer'),
          ]),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should fail when both name and quantity have validation errors', () => {
      mockRequest.body = {
        name: '',
        quantity: -5,
      };

      validateUpdateProduct(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArg.details).toHaveLength(2);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('validateCreateProduct - Edge Cases', () => {
    it('should fail when name is non-string type', () => {
      mockRequest.body = {
        name: 123,  // Number instead of string
        price: 99.99,
        quantity: 10,
      };

      validateCreateProduct(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should fail when quantity is exactly 0 but not integer type', () => {
      mockRequest.body = {
        name: 'Product',
        price: 99.99,
        quantity: '0',  // String instead of number
      };

      validateCreateProduct(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});

