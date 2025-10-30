/**
 * Unit tests for validation middleware
 */

import { Request, Response, NextFunction } from 'express';
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateIdParam,
} from '../../src/middleware/validation';

describe('Validation Middleware', () => {
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

  describe('validateCreateProduct', () => {
    it('should pass validation with valid data', () => {
      mockRequest.body = {
        name: 'Test Product',
        price: 99.99,
        quantity: 10,
        description: 'Test description',
        category: 'Electronics',
      };

      validateCreateProduct(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should fail validation when name is missing', () => {
      mockRequest.body = {
        price: 99.99,
        quantity: 10,
      };

      validateCreateProduct(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Validation failed',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should fail validation when name is empty string', () => {
      mockRequest.body = {
        name: '   ',
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

    it('should fail validation when price is negative', () => {
      mockRequest.body = {
        name: 'Test Product',
        price: -10,
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

    it('should fail validation when quantity is not an integer', () => {
      mockRequest.body = {
        name: 'Test Product',
        price: 99.99,
        quantity: 10.5,
      };

      validateCreateProduct(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should fail validation with multiple errors', () => {
      mockRequest.body = {
        name: '',
        price: -10,
        quantity: -5,
      };

      validateCreateProduct(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Validation failed',
          details: expect.any(Array),
        })
      );
    });
  });

  describe('validateUpdateProduct', () => {
    it('should pass validation with valid partial data', () => {
      mockRequest.body = {
        price: 149.99,
      };

      validateUpdateProduct(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should fail validation when no fields are provided', () => {
      mockRequest.body = {};

      validateUpdateProduct(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should fail validation when price is invalid', () => {
      mockRequest.body = {
        price: -50,
      };

      validateUpdateProduct(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('validateIdParam', () => {
    it('should pass validation with valid ID', () => {
      mockRequest.params = { id: '123' };

      validateIdParam(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should fail validation with invalid ID', () => {
      mockRequest.params = { id: 'abc' };

      validateIdParam(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid ID parameter',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should fail validation with negative ID', () => {
      mockRequest.params = { id: '-1' };

      validateIdParam(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should fail validation with zero ID', () => {
      mockRequest.params = { id: '0' };

      validateIdParam(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});

