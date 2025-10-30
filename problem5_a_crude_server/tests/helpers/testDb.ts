/**
 * Test database helper
 * Provides utilities for setting up and tearing down test database
 */

import { dbRun, dbAll, initializeDatabase, closeDatabase } from '../../src/database';
import { CreateProductInput } from '../../src/types';

/**
 * Clear all products from database
 */
export async function clearDatabase(): Promise<void> {
  await dbRun('DELETE FROM products');
}

/**
 * Create a test product
 */
export async function createTestProduct(data: Partial<CreateProductInput> = {}): Promise<any> {
  const defaultData: CreateProductInput = {
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    quantity: 10,
    category: 'Test Category',
    ...data,
  };

  const result = await dbRun(
    'INSERT INTO products (name, description, price, quantity, category) VALUES (?, ?, ?, ?, ?)',
    defaultData.name,
    defaultData.description,
    defaultData.price,
    defaultData.quantity,
    defaultData.category
  );

  const products = await dbAll('SELECT * FROM products WHERE id = ?', result.lastID);
  return products[0];
}

/**
 * Create multiple test products
 */
export async function createTestProducts(count: number): Promise<any[]> {
  const products = [];
  for (let i = 1; i <= count; i++) {
    const product = await createTestProduct({
      name: `Test Product ${i}`,
      price: 10 * i,
      quantity: i,
      category: i % 2 === 0 ? 'Electronics' : 'Accessories',
    });
    products.push(product);
  }
  return products;
}

/**
 * Setup test database
 */
export async function setupTestDb(): Promise<void> {
  await initializeDatabase();
  await clearDatabase();
}

/**
 * Teardown test database
 */
export async function teardownTestDb(): Promise<void> {
  await clearDatabase();
  closeDatabase();
}

