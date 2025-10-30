/**
 * Integration tests for error scenarios
 */

import request from 'supertest';
import express, { Application } from 'express';
import cors from 'cors';
import productRoutes from '../../src/routes/productRoutes';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler';
import { setupTestDb, clearDatabase, createTestProduct } from '../helpers/testDb';
import * as database from '../../src/database';

const createTestApp = (): Application => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/products', productRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe('Error Handling Integration Tests', () => {
  let app: Application;

  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    app = createTestApp();
    await clearDatabase();
  });

  describe('Database Error Scenarios', () => {
    it('should handle database errors during product creation', async () => {
      // Mock database error
      const dbRunSpy = jest.spyOn(database, 'dbRun').mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const productData = {
        name: 'Test Product',
        price: 99.99,
        quantity: 10,
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to create product');

      dbRunSpy.mockRestore();
    });

    it('should handle database errors during product listing', async () => {
      // Mock database error for count query
      const dbGetSpy = jest.spyOn(database, 'dbGet').mockRejectedValueOnce(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/products')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to list products');

      dbGetSpy.mockRestore();
    });

    it('should handle database errors during product retrieval', async () => {
      const dbGetSpy = jest.spyOn(database, 'dbGet').mockRejectedValueOnce(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/products/1')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to get product');

      dbGetSpy.mockRestore();
    });

    it('should handle database errors during product update', async () => {
      const product = await createTestProduct();
      
      const dbGetSpy = jest.spyOn(database, 'dbGet').mockRejectedValueOnce(
        new Error('Database error')
      );

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send({ price: 150 })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to update product');

      dbGetSpy.mockRestore();
    });

    it('should handle database errors during product deletion', async () => {
      const product = await createTestProduct();
      
      const dbGetSpy = jest.spyOn(database, 'dbGet').mockRejectedValueOnce(
        new Error('Database error')
      );

      const response = await request(app)
        .delete(`/api/products/${product.id}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to delete product');

      dbGetSpy.mockRestore();
    });
  });

  describe('Route Not Found', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Route not found');
      expect(response.body.path).toBe('/api/nonexistent');
    });

    it('should return 404 for invalid product endpoints', async () => {
      const response = await request(app)
        .post('/api/products/invalid/endpoint')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Route not found');
    });
  });

  describe('Stock Filter Edge Cases', () => {
    beforeEach(async () => {
      await createTestProduct({ name: 'In Stock', quantity: 10 });
      await createTestProduct({ name: 'Out of Stock', quantity: 0 });
    });

    it('should filter out of stock products', async () => {
      const response = await request(app)
        .get('/api/products?inStock=false')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((product: any) => {
        expect(product.quantity).toBe(0);
      });
    });

    it('should handle inStock filter with pagination', async () => {
      await createTestProduct({ name: 'Product 3', quantity: 5 });
      await createTestProduct({ name: 'Product 4', quantity: 0 });

      const response = await request(app)
        .get('/api/products?inStock=false&page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((product: any) => {
        expect(product.quantity).toBe(0);
      });
    });
  });

  describe('Search Filter Coverage', () => {
    beforeEach(async () => {
      await createTestProduct({ 
        name: 'Gaming Laptop', 
        description: 'High performance device' 
      });
      await createTestProduct({ 
        name: 'Wireless Mouse', 
        description: 'Ergonomic gaming mouse' 
      });
    });

    it('should search in both name and description', async () => {
      const response = await request(app)
        .get('/api/products?search=gaming')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2); // Both contain 'gaming'
    });

    it('should search with pagination', async () => {
      const response = await request(app)
        .get('/api/products?search=gaming&page=1&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.pagination.total).toBe(2);
    });
  });

  describe('Malformed Request Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Content-Type', 'application/json')
        .send('{"invalid json"}');

      // Express may return 400 or 500 for malformed JSON depending on configuration
      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/products')
        .send('not json');

      // Should still validate and fail
      expect([400, 415, 500]).toContain(response.status);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple simultaneous requests', async () => {
      const requests = Array(5).fill(null).map((_, i) => 
        request(app)
          .post('/api/products')
          .send({
            name: `Product ${i}`,
            price: 10 * (i + 1),
            quantity: i + 1,
          })
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });
  });
});

