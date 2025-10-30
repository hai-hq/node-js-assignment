import { Request, Response, NextFunction } from 'express';
import { CreateProductInput, UpdateProductInput } from '../types';

/**
 * Validate product creation input
 */
export function validateCreateProduct(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { name, price, quantity } = req.body as CreateProductInput;

  const errors: string[] = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }

  if (price === undefined || price === null) {
    errors.push('Price is required');
  } else if (typeof price !== 'number' || price < 0) {
    errors.push('Price must be a non-negative number');
  }

  if (quantity === undefined || quantity === null) {
    errors.push('Quantity is required');
  } else if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 0) {
    errors.push('Quantity must be a non-negative integer');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors,
    });
    return;
  }

  next();
}

/**
 * Validate product update input
 */
export function validateUpdateProduct(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { name, price, quantity } = req.body as UpdateProductInput;
  const errors: string[] = [];

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    errors.push('Name must be a non-empty string if provided');
  }

  if (price !== undefined && (typeof price !== 'number' || price < 0)) {
    errors.push('Price must be a non-negative number if provided');
  }

  if (quantity !== undefined && (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 0)) {
    errors.push('Quantity must be a non-negative integer if provided');
  }

  // At least one field should be provided
  if (!name && price === undefined && quantity === undefined && !req.body.description && !req.body.category) {
    errors.push('At least one field must be provided for update');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors,
    });
    return;
  }

  next();
}

/**
 * Validate ID parameter
 */
export function validateIdParam(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id) || id <= 0) {
    res.status(400).json({
      success: false,
      error: 'Invalid ID parameter',
    });
    return;
  }

  next();
}

