/**
 * Integration tests for Products API endpoints
 */

import request from 'supertest';
import express, { Application } from 'express';
import cors from 'cors';
import productRoutes from '../../src/routes/productRoutes';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler';
import { setupTestDb, clearDatabase, createTestProduct, createTestProducts } from '../helpers/testDb';

// Create test app
const createTestApp = (): Application => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/products', productRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe('Products API Integration Tests', () => {
  let app: Application;

  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    app = createTestApp();
    await clearDatabase();
  });

  describe('POST /api/products - Create Product', () => {
    it('should create a new product with valid data', async () => {
      const productData = {
        name: 'Gaming Laptop',
        description: 'High-performance laptop',
        price: 1999.99,
        quantity: 10,
        category: 'Electronics',
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: productData.name,
        price: productData.price,
        quantity: productData.quantity,
        category: productData.category,
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.message).toBe('Product created successfully');
    });

    it('should create product without optional fields', async () => {
      const productData = {
        name: 'Simple Product',
        price: 49.99,
        quantity: 5,
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(productData.name);
    });

    it('should fail with missing required fields', async () => {
      const productData = {
        name: 'Incomplete Product',
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail with invalid price', async () => {
      const productData = {
        name: 'Invalid Product',
        price: -10,
        quantity: 5,
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/products - List Products', () => {
    it('should return empty list when no products exist', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should return list of products', async () => {
      await createTestProducts(5);

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination.total).toBe(5);
    });

    it('should filter products by category', async () => {
      await createTestProducts(10); // Creates 5 Electronics, 5 Accessories

      const response = await request(app)
        .get('/api/products?category=Electronics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(5);
      response.body.data.forEach((product: any) => {
        expect(product.category).toBe('Electronics');
      });
    });

    it('should filter products by price range', async () => {
      await createTestProducts(10);

      const response = await request(app)
        .get('/api/products?minPrice=30&maxPrice=70')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((product: any) => {
        expect(product.price).toBeGreaterThanOrEqual(30);
        expect(product.price).toBeLessThanOrEqual(70);
      });
    });

    it('should filter products by stock status', async () => {
      await createTestProduct({ name: 'In Stock', quantity: 10 });
      await createTestProduct({ name: 'Out of Stock', quantity: 0 });

      const response = await request(app)
        .get('/api/products?inStock=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((product: any) => {
        expect(product.quantity).toBeGreaterThan(0);
      });
    });

    it('should search products by name', async () => {
      await createTestProduct({ name: 'Gaming Laptop' });
      await createTestProduct({ name: 'Wireless Mouse' });
      await createTestProduct({ name: 'Gaming Keyboard' });

      const response = await request(app)
        .get('/api/products?search=gaming')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('GET /api/products/:id - Get Single Product', () => {
    it('should return product by ID', async () => {
      const product = await createTestProduct({ name: 'Test Product' });

      const response = await request(app)
        .get(`/api/products/${product.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(product.id);
      expect(response.body.data.name).toBe('Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/9999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/api/products/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid ID parameter');
    });
  });

  describe('PUT /api/products/:id - Update Product', () => {
    it('should update product with valid data', async () => {
      const product = await createTestProduct({ name: 'Old Name', price: 100 });

      const updateData = {
        name: 'New Name',
        price: 150,
      };

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Name');
      expect(response.body.data.price).toBe(150);
      expect(response.body.message).toBe('Product updated successfully');
    });

    it('should update only provided fields', async () => {
      const product = await createTestProduct({
        name: 'Product',
        price: 100,
        quantity: 10,
      });

      const updateData = {
        price: 200,
      };

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe('Product'); // Unchanged
      expect(response.body.data.price).toBe(200); // Updated
      expect(response.body.data.quantity).toBe(10); // Unchanged
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .put('/api/products/9999')
        .send({ price: 100 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found');
    });

    it('should fail with invalid update data', async () => {
      const product = await createTestProduct();

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send({ price: -100 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/products/:id - Delete Product', () => {
    it('should delete existing product', async () => {
      const product = await createTestProduct();

      const response = await request(app)
        .delete(`/api/products/${product.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product deleted successfully');

      // Verify product is deleted
      const getResponse = await request(app)
        .get(`/api/products/${product.id}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .delete('/api/products/9999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found');
    });
  });
});

