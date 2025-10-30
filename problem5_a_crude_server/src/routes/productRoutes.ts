import { Router } from 'express';
import {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateIdParam,
} from '../middleware/validation';

const router = Router();

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Public
 */
router.post('/', validateCreateProduct, createProduct);

/**
 * @route   GET /api/products
 * @desc    List all products with optional filters
 * @query   category, minPrice, maxPrice, inStock, search
 * @access  Public
 */
router.get('/', listProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get a single product by ID
 * @access  Public
 */
router.get('/:id', validateIdParam, getProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Public
 */
router.put('/:id', validateIdParam, validateUpdateProduct, updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Public
 */
router.delete('/:id', validateIdParam, deleteProduct);

export default router;

