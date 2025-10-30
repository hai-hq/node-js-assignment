/**
 * Integration tests for advanced filtering scenarios
 */

import request from 'supertest';
import express, { Application } from 'express';
import cors from 'cors';
import productRoutes from '../../src/routes/productRoutes';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler';
import { setupTestDb, clearDatabase, createTestProduct } from '../helpers/testDb';

const createTestApp = (): Application => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/products', productRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe('Advanced Filter Scenarios', () => {
  let app: Application;

  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    app = createTestApp();
    await clearDatabase();
  });

  describe('Complex Filter Combinations', () => {
    beforeEach(async () => {
      // Create diverse test data
      await createTestProduct({ 
        name: 'Expensive Laptop', 
        price: 2000, 
        quantity: 5,
        category: 'Electronics' 
      });
      await createTestProduct({ 
        name: 'Cheap Mouse', 
        price: 20, 
        quantity: 100,
        category: 'Accessories' 
      });
      await createTestProduct({ 
        name: 'Mid-range Keyboard', 
        price: 150, 
        quantity: 0,
        category: 'Accessories' 
      });
      await createTestProduct({ 
        name: 'Premium Monitor', 
        price: 800, 
        quantity: 10,
        category: 'Electronics' 
      });
    });

    it('should combine category + price range + stock filters', async () => {
      const response = await request(app)
        .get('/api/products?category=Electronics&minPrice=500&maxPrice=1000&inStock=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((product: any) => {
        expect(product.category).toBe('Electronics');
        expect(product.price).toBeGreaterThanOrEqual(500);
        expect(product.price).toBeLessThanOrEqual(1000);
        expect(product.quantity).toBeGreaterThan(0);
      });
    });

    it('should combine all filters including search', async () => {
      const response = await request(app)
        .get('/api/products?category=Accessories&minPrice=10&maxPrice=200&search=mouse&inStock=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((product: any) => {
        expect(product.category).toBe('Accessories');
        expect(product.price).toBeGreaterThanOrEqual(10);
        expect(product.price).toBeLessThanOrEqual(200);
        expect(product.quantity).toBeGreaterThan(0);
        expect(product.name.toLowerCase()).toContain('mouse');
      });
    });

    it('should handle filters with no matching results', async () => {
      const response = await request(app)
        .get('/api/products?category=NonExistent&minPrice=5000')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should filter only by minimum price', async () => {
      const response = await request(app)
        .get('/api/products?minPrice=500')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((product: any) => {
        expect(product.price).toBeGreaterThanOrEqual(500);
      });
    });

    it('should filter only by maximum price', async () => {
      const response = await request(app)
        .get('/api/products?maxPrice=200')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((product: any) => {
        expect(product.price).toBeLessThanOrEqual(200);
      });
    });
  });

  describe('Edge Case Filters', () => {
    beforeEach(async () => {
      await createTestProduct({ name: 'Product A', price: 0, quantity: 0 });
      await createTestProduct({ name: 'Product B', price: 0.01, quantity: 1 });
      await createTestProduct({ name: 'Product C', price: 9999.99, quantity: 1000 });
    });

    it('should handle price filter with zero value', async () => {
      const response = await request(app)
        .get('/api/products?minPrice=0&maxPrice=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((product: any) => {
        expect(product.price).toBeLessThanOrEqual(1);
      });
    });

    it('should handle very large price values', async () => {
      const response = await request(app)
        .get('/api/products?minPrice=9000')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should handle decimal price values', async () => {
      const response = await request(app)
        .get('/api/products?minPrice=0.01&maxPrice=0.02')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Search Variations', () => {
    beforeEach(async () => {
      await createTestProduct({ 
        name: 'LAPTOP', 
        description: 'gaming device' 
      });
      await createTestProduct({ 
        name: 'laptop case', 
        description: 'protective cover' 
      });
      await createTestProduct({ 
        name: 'Mouse', 
        description: 'For laptop users' 
      });
    });

    it('should search case-insensitively', async () => {
      const response = await request(app)
        .get('/api/products?search=laptop')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3); // All contain 'laptop' in name or description
    });

    it('should handle special characters in search', async () => {
      await clearDatabase();
      await createTestProduct({ name: 'Test-Product', description: 'Special characters' });

      const response = await request(app)
        .get('/api/products?search=test-product')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle empty search string', async () => {
      const response = await request(app)
        .get('/api/products?search=')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Empty search should not filter anything
    });
  });

  describe('Pagination with All Filters', () => {
    beforeEach(async () => {
      // Create 30 products with similar characteristics
      for (let i = 1; i <= 30; i++) {
        await createTestProduct({
          name: `Gaming Product ${i}`,
          price: 50 + i * 10,
          quantity: i % 3 === 0 ? 0 : i, // Every 3rd product out of stock
          category: 'Gaming',
        });
      }
    });

    it('should paginate filtered results correctly', async () => {
      const response = await request(app)
        .get('/api/products?category=Gaming&inStock=true&minPrice=100&maxPrice=300&page=1&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
      
      response.body.data.forEach((product: any) => {
        expect(product.category).toBe('Gaming');
        expect(product.quantity).toBeGreaterThan(0);
        expect(product.price).toBeGreaterThanOrEqual(100);
        expect(product.price).toBeLessThanOrEqual(300);
      });
    });

    it('should correctly calculate totalPages with filters', async () => {
      const response = await request(app)
        .get('/api/products?category=Gaming&inStock=true&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      const expectedTotal = response.body.pagination.total;
      const expectedPages = Math.ceil(expectedTotal / 10);
      expect(response.body.pagination.totalPages).toBe(expectedPages);
    });
  });
});

