/**
 * Database seed script
 * Generates 100 mock products for testing
 * Run: npm run seed
 */

import { dbRun, dbGet, initializeDatabase, closeDatabase } from './database';

// Product categories
const categories = [
  'Electronics',
  'Accessories',
  'Computers',
  'Gaming',
  'Smartphones',
  'Audio',
  'Wearables',
  'Home Appliances',
  'Cameras',
  'Networking',
];

// Product name templates
const productPrefixes = [
  'Pro', 'Ultra', 'Premium', 'Smart', 'Advanced', 'Wireless', 'Portable',
  'Digital', 'HD', '4K', 'Bluetooth', 'Gaming', 'Professional', 'Mini',
  'Compact', 'Deluxe', 'Elite', 'Supreme', 'Classic', 'Modern',
];

const productTypes = [
  'Laptop', 'Mouse', 'Keyboard', 'Monitor', 'Headphones', 'Smartphone',
  'Tablet', 'Smartwatch', 'Speaker', 'Webcam', 'Microphone', 'Router',
  'Camera', 'Printer', 'Scanner', 'External Drive', 'Power Bank',
  'USB Cable', 'Phone Case', 'Screen Protector', 'Charger', 'Adapter',
  'Hub', 'Dock', 'Stand', 'Light', 'Fan', 'Cooler', 'Cleaner', 'Bag',
];

const productSuffixes = [
  'X1', 'X2', 'Pro', 'Plus', 'Max', 'Air', 'Ultra', 'Lite', 'SE', 'XL',
  '2024', '2023', 'Gen 2', 'Gen 3', 'V2', 'V3', 'Edition', 'Series',
];

// Description templates
const descriptions = [
  'High-quality product with advanced features',
  'Perfect for professionals and enthusiasts',
  'Sleek design with powerful performance',
  'Innovative technology for modern users',
  'Premium build quality and reliability',
  'Compact and portable design',
  'Enhanced functionality and ease of use',
  'Industry-leading performance',
  'Cutting-edge technology',
  'Best-in-class features',
  'Ergonomic design for comfort',
  'Energy efficient and eco-friendly',
  'Durable and long-lasting',
  'Versatile and multifunctional',
  'Easy to set up and use',
];

/**
 * Generate a random product name
 */
function generateProductName(): string {
  const prefix = productPrefixes[Math.floor(Math.random() * productPrefixes.length)];
  const type = productTypes[Math.floor(Math.random() * productTypes.length)];
  const suffix = productSuffixes[Math.floor(Math.random() * productSuffixes.length)];
  
  // Mix up the format
  const format = Math.random();
  if (format < 0.33) {
    return `${prefix} ${type}`;
  } else if (format < 0.66) {
    return `${type} ${suffix}`;
  } else {
    return `${prefix} ${type} ${suffix}`;
  }
}

/**
 * Generate a random price
 */
function generatePrice(): number {
  // Generate prices between $9.99 and $2999.99
  const priceRanges = [
    { min: 9.99, max: 49.99, weight: 0.3 },     // Accessories
    { min: 50, max: 199.99, weight: 0.3 },      // Mid-range
    { min: 200, max: 999.99, weight: 0.25 },    // High-end
    { min: 1000, max: 2999.99, weight: 0.15 },  // Premium
  ];

  const random = Math.random();
  let cumulative = 0;
  
  for (const range of priceRanges) {
    cumulative += range.weight;
    if (random <= cumulative) {
      const price = Math.random() * (range.max - range.min) + range.min;
      return Math.round(price * 100) / 100;
    }
  }
  
  return 99.99;
}

/**
 * Generate a random quantity
 */
function generateQuantity(): number {
  const random = Math.random();
  
  if (random < 0.1) {
    return 0; // 10% out of stock
  } else if (random < 0.3) {
    return Math.floor(Math.random() * 10) + 1; // 20% low stock (1-10)
  } else if (random < 0.7) {
    return Math.floor(Math.random() * 50) + 10; // 40% medium stock (10-60)
  } else {
    return Math.floor(Math.random() * 200) + 50; // 30% high stock (50-250)
  }
}

/**
 * Generate a random description
 */
function generateDescription(): string {
  const desc1 = descriptions[Math.floor(Math.random() * descriptions.length)];
  const desc2 = descriptions[Math.floor(Math.random() * descriptions.length)];
  
  if (Math.random() < 0.5) {
    return desc1;
  } else {
    return `${desc1}. ${desc2}.`;
  }
}

/**
 * Seed the database with mock products
 */
async function seedDatabase(): Promise<void> {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Initialize database
    await initializeDatabase();

    // Clear existing products
    console.log('Clearing existing products...');
    await dbRun('DELETE FROM products');
    console.log('✓ Existing products cleared\n');

    // Generate and insert 100 products
    console.log('Generating 100 mock products...');
    
    const insertPromises: Promise<any>[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < 100; i++) {
      let name = generateProductName();
      
      // Ensure unique names
      while (usedNames.has(name)) {
        name = generateProductName();
      }
      usedNames.add(name);

      const category = categories[Math.floor(Math.random() * categories.length)];
      const description = generateDescription();
      const price = generatePrice();
      const quantity = generateQuantity();

      const insertSql = `
        INSERT INTO products (name, description, price, quantity, category)
        VALUES (?, ?, ?, ?, ?)
      `;

      insertPromises.push(
        dbRun(insertSql, name, description, price, quantity, category)
      );

      // Show progress
      if ((i + 1) % 10 === 0) {
        process.stdout.write(`  Progress: ${i + 1}/100\r`);
      }
    }

    await Promise.all(insertPromises);
    console.log('\n✓ Successfully inserted 100 products\n');

    // Display statistics
    const stats = await dbGet<{ total: number; totalQuantity: number; avgPrice: number }>(
      'SELECT COUNT(*) as total, SUM(quantity) as totalQuantity, AVG(price) as avgPrice FROM products'
    );
    console.log('📊 Database Statistics:');
    console.log('-----------------------------------');
    console.log(`Total Products: ${stats?.total || 100}`);
    console.log(`Total Inventory: ${stats?.totalQuantity || 0} units`);
    console.log(`Average Price: $${(stats?.avgPrice || 0).toFixed(2)}`);
    console.log('-----------------------------------\n');

    // Display category breakdown
    console.log('📦 Products by Category:');
    console.log('-----------------------------------');
    for (const category of categories) {
      const result = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM products WHERE category = ?', category);
      console.log(`${category.padEnd(20)} : ${result?.count || 0} products`);
    }
    console.log('-----------------------------------\n');

    console.log('✅ Database seeding completed successfully!');
    console.log('🚀 You can now start the server and test the API with pagination.\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}

// Run the seed script
seedDatabase();

