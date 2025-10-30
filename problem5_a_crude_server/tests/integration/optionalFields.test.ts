/**
 * Integration tests for optional field updates (missing coverage)
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

describe('Optional Fields Update Tests', () => {
  let app: Application;

  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    app = createTestApp();
    await clearDatabase();
  });

  describe('Update with optional description field', () => {
    it('should update product with description field', async () => {
      const product = await createTestProduct({
        name: 'Test Product',
        description: 'Old description',
        price: 100,
        quantity: 10,
      });

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send({
          description: 'New updated description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('New updated description');
      expect(response.body.data.name).toBe('Test Product'); // Unchanged
    });

    it('should update product clearing description by omitting it', async () => {
      const product = await createTestProduct({
        name: 'Test Product',
        description: 'Some description',
        price: 100,
      });

      // Update other fields without description
      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send({
          price: 150,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.price).toBe(150);
      // Description remains unchanged
      expect(response.body.data.description).toBe('Some description');
    });
  });

  describe('Update with optional quantity field', () => {
    it('should update product with only quantity', async () => {
      const product = await createTestProduct({
        name: 'Test Product',
        price: 100,
        quantity: 5,
      });

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send({
          quantity: 50,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(50);
      expect(response.body.data.price).toBe(100); // Unchanged
    });

    it('should update quantity to zero (out of stock)', async () => {
      const product = await createTestProduct({
        name: 'Test Product',
        quantity: 100,
      });

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send({
          quantity: 0,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(0);
    });
  });

  describe('Update with optional category field', () => {
    it('should update product with category field', async () => {
      const product = await createTestProduct({
        name: 'Test Product',
        category: 'Old Category',
      });

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send({
          category: 'New Category',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('New Category');
    });

    it('should update product keeping category unchanged when omitted', async () => {
      const product = await createTestProduct({
        name: 'Test Product',
        category: 'Electronics',
        price: 100,
      });

      // Update without changing category
      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send({
          price: 200,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.price).toBe(200);
      // Category remains unchanged
      expect(response.body.data.category).toBe('Electronics');
    });
  });

  describe('Update with multiple optional fields', () => {
    it('should update description, quantity, and category together', async () => {
      const product = await createTestProduct({
        name: 'Original Name',
        description: 'Old desc',
        quantity: 5,
        category: 'Old Cat',
      });

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send({
          description: 'Updated description',
          quantity: 100,
          category: 'Updated Category',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.quantity).toBe(100);
      expect(response.body.data.category).toBe('Updated Category');
      expect(response.body.data.name).toBe('Original Name'); // Unchanged
    });

    it('should update all fields including name, price, and optional fields', async () => {
      const product = await createTestProduct({
        name: 'Old Name',
        description: 'Old desc',
        price: 50,
        quantity: 10,
        category: 'Old',
      });

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send({
          name: 'New Name',
          description: 'New desc',
          price: 150,
          quantity: 25,
          category: 'New',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Name');
      expect(response.body.data.description).toBe('New desc');
      expect(response.body.data.price).toBe(150);
      expect(response.body.data.quantity).toBe(25);
      expect(response.body.data.category).toBe('New');
    });
  });

  describe('Update field combinations', () => {
    it('should update name and description only', async () => {
      const product = await createTestProduct({
        name: 'Old',
        description: 'Old desc',
        price: 100,
        quantity: 10,
      });

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send({
          name: 'New Name',
          description: 'New Description',
        })
        .expect(200);

      expect(response.body.data.name).toBe('New Name');
      expect(response.body.data.description).toBe('New Description');
      expect(response.body.data.price).toBe(100); // Unchanged
      expect(response.body.data.quantity).toBe(10); // Unchanged
    });

    it('should update price and category only', async () => {
      const product = await createTestProduct({
        name: 'Product',
        price: 50,
        category: 'Old',
      });

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send({
          price: 99.99,
          category: 'Electronics',
        })
        .expect(200);

      expect(response.body.data.price).toBe(99.99);
      expect(response.body.data.category).toBe('Electronics');
      expect(response.body.data.name).toBe('Product'); // Unchanged
    });

    it('should handle updating with specific string values', async () => {
      const product = await createTestProduct({
        name: 'Product',
        description: 'Has description',
        category: 'Old',
      });

      // Update with new values
      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send({
          description: 'New description text',
          category: 'New category',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('New description text');
      expect(response.body.data.category).toBe('New category');
    });
  });

  describe('Edge cases with optional fields', () => {
    it('should handle very long description', async () => {
      const product = await createTestProduct();
      const longDescription = 'A'.repeat(1000);

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send({
          description: longDescription,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe(longDescription);
    });

    it('should handle special characters in category', async () => {
      const product = await createTestProduct();

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send({
          category: 'Electronics & Gadgets (2024)',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('Electronics & Gadgets (2024)');
    });

    it('should handle unicode characters in description and category', async () => {
      const product = await createTestProduct();

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send({
          description: 'Продукт с описанием на русском 中文',
          category: 'Español',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toContain('русском');
      expect(response.body.data.category).toBe('Español');
    });
  });
});

