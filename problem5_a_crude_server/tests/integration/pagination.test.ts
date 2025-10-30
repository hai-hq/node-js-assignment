/**
 * Integration tests for Pagination functionality
 */

import request from 'supertest';
import express, { Application } from 'express';
import cors from 'cors';
import productRoutes from '../../src/routes/productRoutes';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler';
import { setupTestDb, clearDatabase, createTestProducts } from '../helpers/testDb';

const createTestApp = (): Application => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/products', productRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe('Pagination Tests', () => {
  let app: Application;

  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    app = createTestApp();
    await clearDatabase();
  });

  describe('Basic Pagination', () => {
    beforeEach(async () => {
      // Create 25 test products
      await createTestProducts(25);
    });

    it('should return first page with default limit (10)', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination).toMatchObject({
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });

    it('should return specific page with custom limit', async () => {
      const response = await request(app)
        .get('/api/products?page=2&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination).toMatchObject({
        total: 25,
        page: 2,
        limit: 5,
        totalPages: 5,
        hasNextPage: true,
        hasPrevPage: true,
      });
    });

    it('should return last page correctly', async () => {
      const response = await request(app)
        .get('/api/products?page=3&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5); // 25 total, last page has 5
      expect(response.body.pagination).toMatchObject({
        total: 25,
        page: 3,
        limit: 10,
        totalPages: 3,
        hasNextPage: false,
        hasPrevPage: true,
      });
    });

    it('should handle page beyond available pages', async () => {
      const response = await request(app)
        .get('/api/products?page=100&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.page).toBe(100);
      expect(response.body.pagination.hasNextPage).toBe(false);
    });

    it('should enforce maximum limit of 100', async () => {
      const response = await request(app)
        .get('/api/products?limit=200')
        .expect(200);

      expect(response.body.pagination.limit).toBe(100); // Capped at 100
    });

    it('should handle minimum page of 1', async () => {
      const response = await request(app)
        .get('/api/products?page=0')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
    });

    it('should handle negative page numbers', async () => {
      const response = await request(app)
        .get('/api/products?page=-5')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
    });

    it('should handle invalid page parameter', async () => {
      const response = await request(app)
        .get('/api/products?page=abc')
        .expect(200);

      expect(response.body.pagination.page).toBe(1); // Defaults to 1
    });

    it('should handle invalid limit parameter', async () => {
      const response = await request(app)
        .get('/api/products?limit=xyz')
        .expect(200);

      expect(response.body.pagination.limit).toBe(10); // Defaults to 10
    });
  });

  describe('Pagination with Filters', () => {
    beforeEach(async () => {
      await createTestProducts(30); // 15 Electronics, 15 Accessories
    });

    it('should paginate filtered results by category', async () => {
      const response = await request(app)
        .get('/api/products?category=Electronics&page=1&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination).toMatchObject({
        total: 15, // Only Electronics
        page: 1,
        limit: 5,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: false,
      });

      response.body.data.forEach((product: any) => {
        expect(product.category).toBe('Electronics');
      });
    });

    it('should paginate filtered results by price range', async () => {
      const response = await request(app)
        .get('/api/products?minPrice=50&maxPrice=150&page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((product: any) => {
        expect(product.price).toBeGreaterThanOrEqual(50);
        expect(product.price).toBeLessThanOrEqual(150);
      });
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    it('should combine multiple filters with pagination', async () => {
      const response = await request(app)
        .get('/api/products?category=Electronics&minPrice=50&page=1&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((product: any) => {
        expect(product.category).toBe('Electronics');
        expect(product.price).toBeGreaterThanOrEqual(50);
      });
    });
  });

  describe('Pagination Edge Cases', () => {
    it('should handle empty result set', async () => {
      // No products created

      const response = await request(app)
        .get('/api/products?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination).toMatchObject({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });

    it('should handle single product', async () => {
      await createTestProducts(1);

      const response = await request(app)
        .get('/api/products?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toMatchObject({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });

    it('should handle exact page boundary', async () => {
      await createTestProducts(20); // Exactly 2 pages with limit=10

      const response = await request(app)
        .get('/api/products?page=2&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination).toMatchObject({
        total: 20,
        page: 2,
        limit: 10,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true,
      });
    });

    it('should handle limit of 1', async () => {
      await createTestProducts(5);

      const response = await request(app)
        .get('/api/products?page=3&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toMatchObject({
        total: 5,
        page: 3,
        limit: 1,
        totalPages: 5,
        hasNextPage: true,
        hasPrevPage: true,
      });
    });
  });

  describe('Pagination Response Structure', () => {
    beforeEach(async () => {
      await createTestProducts(15);
    });

    it('should include all required pagination fields', async () => {
      const response = await request(app)
        .get('/api/products?page=2&limit=5')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('pagination');

      const pagination = response.body.pagination;
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('totalPages');
      expect(pagination).toHaveProperty('hasNextPage');
      expect(pagination).toHaveProperty('hasPrevPage');

      // Verify types
      expect(typeof pagination.total).toBe('number');
      expect(typeof pagination.page).toBe('number');
      expect(typeof pagination.limit).toBe('number');
      expect(typeof pagination.totalPages).toBe('number');
      expect(typeof pagination.hasNextPage).toBe('boolean');
      expect(typeof pagination.hasPrevPage).toBe('boolean');
    });

    it('should calculate totalPages correctly', async () => {
      const response = await request(app)
        .get('/api/products?limit=4')
        .expect(200);

      // 15 products / 4 per page = 3.75 -> 4 pages
      expect(response.body.pagination.totalPages).toBe(4);
    });

    it('should include descriptive message', async () => {
      const response = await request(app)
        .get('/api/products?page=2&limit=5')
        .expect(200);

      expect(response.body.message).toMatch(/Found \d+ product\(s\) on page \d+ of \d+/);
    });
  });
});

