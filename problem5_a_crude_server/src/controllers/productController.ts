import { Request, Response } from 'express';
import { dbRun, dbGet, dbAll } from '../database';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductFilters,
  ApiResponse,
} from '../types';

/**
 * Create a new product
 */
export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const input: CreateProductInput = req.body;

    const sql = `
      INSERT INTO products (name, description, price, quantity, category)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result: any = await dbRun(
      sql,
      input.name,
      input.description || null,
      input.price,
      input.quantity,
      input.category || null
    );

    // Fetch the created product
    const product = await dbGet(
      'SELECT * FROM products WHERE id = ?',
      result.lastID
    ) as Product;

    const response: ApiResponse<Product> = {
      success: true,
      data: product,
      message: 'Product created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product',
    });
  }
}

/**
 * List products with optional filters and pagination
 */
export async function listProducts(req: Request, res: Response): Promise<void> {
  try {
    // Parse pagination parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    const filters: ProductFilters = {
      category: req.query.category as string | undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      inStock: req.query.inStock === 'true' ? true : req.query.inStock === 'false' ? false : undefined,
      search: req.query.search as string | undefined,
      page,
      limit,
    };

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // Apply filters
    if (filters.category) {
      whereClause += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.minPrice !== undefined) {
      whereClause += ' AND price >= ?';
      params.push(filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      whereClause += ' AND price <= ?';
      params.push(filters.maxPrice);
    }

    if (filters.inStock !== undefined) {
      if (filters.inStock) {
        whereClause += ' AND quantity > 0';
      } else {
        whereClause += ' AND quantity = 0';
      }
    }

    if (filters.search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ?)';
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern);
    }

    // Get total count for pagination
    const countSql = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const countResult = await dbGet<{ total: number }>(countSql, ...params);
    const total = countResult?.total || 0;

    // Get paginated products
    const sql = `SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const products = await dbAll(sql, ...params, limit, offset) as Product[];

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const response: ApiResponse<Product[]> = {
      success: true,
      data: products,
      message: `Found ${products.length} product(s) on page ${page} of ${totalPages}`,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error listing products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list products',
    });
  }
}

/**
 * Get a single product by ID
 */
export async function getProduct(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);

    const product = await dbGet(
      'SELECT * FROM products WHERE id = ?',
      id
    ) as Product | undefined;

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
      });
      return;
    }

    const response: ApiResponse<Product> = {
      success: true,
      data: product,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product',
    });
  }
}

/**
 * Update a product
 */
export async function updateProduct(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const input: UpdateProductInput = req.body;

    // Check if product exists
    const existingProduct = await dbGet(
      'SELECT * FROM products WHERE id = ?',
      id
    ) as Product | undefined;

    if (!existingProduct) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
      });
      return;
    }

    // Build dynamic UPDATE query
    const updates: string[] = [];
    const params: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      params.push(input.description);
    }
    if (input.price !== undefined) {
      updates.push('price = ?');
      params.push(input.price);
    }
    if (input.quantity !== undefined) {
      updates.push('quantity = ?');
      params.push(input.quantity);
    }
    if (input.category !== undefined) {
      updates.push('category = ?');
      params.push(input.category);
    }

    updates.push("updated_at = datetime('now')");
    params.push(id);

    const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
    await dbRun(sql, ...params);

    // Fetch updated product
    const updatedProduct = await dbGet(
      'SELECT * FROM products WHERE id = ?',
      id
    ) as Product;

    const response: ApiResponse<Product> = {
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product',
    });
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);

    // Check if product exists
    const existingProduct = await dbGet(
      'SELECT * FROM products WHERE id = ?',
      id
    ) as Product | undefined;

    if (!existingProduct) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
      });
      return;
    }

    await dbRun('DELETE FROM products WHERE id = ?', id);

    const response: ApiResponse = {
      success: true,
      message: 'Product deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product',
    });
  }
}
