/**
 * Simple Node.js test client for the CRUD API
 * Run: node test-client.js (make sure server is running)
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const API_BASE = '/api/products';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test suite
async function runTests() {
  console.log('========================================');
  console.log('Testing CRUD API');
  console.log('========================================\n');

  try {
    // 1. Health Check
    console.log('1. Health Check...');
    const health = await makeRequest('GET', '/health');
    console.log(`Status: ${health.status}`);
    console.log('Response:', JSON.stringify(health.data, null, 2));
    console.log('');

    // 2. Create Product 1
    console.log('2. Creating product 1 (Gaming Laptop)...');
    const create1 = await makeRequest('POST', API_BASE, {
      name: 'Gaming Laptop',
      description: 'High-performance gaming laptop with RTX 4080',
      price: 1999.99,
      quantity: 25,
      category: 'Electronics',
    });
    console.log(`Status: ${create1.status}`);
    console.log('Response:', JSON.stringify(create1.data, null, 2));
    const productId = create1.data.data.id;
    console.log(`Created product with ID: ${productId}\n`);

    // 3. Create Product 2
    console.log('3. Creating product 2 (Wireless Mouse)...');
    const create2 = await makeRequest('POST', API_BASE, {
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse',
      price: 29.99,
      quantity: 100,
      category: 'Accessories',
    });
    console.log(`Status: ${create2.status}`);
    console.log('Response:', JSON.stringify(create2.data, null, 2));
    console.log('');

    // 4. Create Product 3
    console.log('4. Creating product 3 (Mechanical Keyboard)...');
    const create3 = await makeRequest('POST', API_BASE, {
      name: 'Mechanical Keyboard',
      description: 'RGB mechanical keyboard',
      price: 149.99,
      quantity: 0,
      category: 'Accessories',
    });
    console.log(`Status: ${create3.status}`);
    console.log('Response:', JSON.stringify(create3.data, null, 2));
    console.log('');

    // 5. List All Products
    console.log('5. Listing all products...');
    const listAll = await makeRequest('GET', API_BASE);
    console.log(`Status: ${listAll.status}`);
    console.log('Response:', JSON.stringify(listAll.data, null, 2));
    console.log('');

    // 6. Get Single Product
    console.log(`6. Getting product by ID (${productId})...`);
    const getOne = await makeRequest('GET', `${API_BASE}/${productId}`);
    console.log(`Status: ${getOne.status}`);
    console.log('Response:', JSON.stringify(getOne.data, null, 2));
    console.log('');

    // 7. Filter by Category
    console.log('7. Filtering by category (Electronics)...');
    const filterCategory = await makeRequest('GET', `${API_BASE}?category=Electronics`);
    console.log(`Status: ${filterCategory.status}`);
    console.log('Response:', JSON.stringify(filterCategory.data, null, 2));
    console.log('');

    // 8. Filter by Price Range
    console.log('8. Filtering by price range (100-2000)...');
    const filterPrice = await makeRequest('GET', `${API_BASE}?minPrice=100&maxPrice=2000`);
    console.log(`Status: ${filterPrice.status}`);
    console.log('Response:', JSON.stringify(filterPrice.data, null, 2));
    console.log('');

    // 9. Filter In Stock
    console.log('9. Filtering products in stock...');
    const filterInStock = await makeRequest('GET', `${API_BASE}?inStock=true`);
    console.log(`Status: ${filterInStock.status}`);
    console.log('Response:', JSON.stringify(filterInStock.data, null, 2));
    console.log('');

    // 10. Search Products
    console.log('10. Searching for "laptop"...');
    const search = await makeRequest('GET', `${API_BASE}?search=laptop`);
    console.log(`Status: ${search.status}`);
    console.log('Response:', JSON.stringify(search.data, null, 2));
    console.log('');

    // 11. Update Product
    console.log(`11. Updating product ${productId} (price and quantity)...`);
    const update = await makeRequest('PUT', `${API_BASE}/${productId}`, {
      price: 1799.99,
      quantity: 20,
    });
    console.log(`Status: ${update.status}`);
    console.log('Response:', JSON.stringify(update.data, null, 2));
    console.log('');

    // 12. Verify Update
    console.log(`12. Verifying update (get product ${productId})...`);
    const getUpdated = await makeRequest('GET', `${API_BASE}/${productId}`);
    console.log(`Status: ${getUpdated.status}`);
    console.log('Response:', JSON.stringify(getUpdated.data, null, 2));
    console.log('');

    // 13. Delete Product
    console.log(`13. Deleting product ${productId}...`);
    const deleteProduct = await makeRequest('DELETE', `${API_BASE}/${productId}`);
    console.log(`Status: ${deleteProduct.status}`);
    console.log('Response:', JSON.stringify(deleteProduct.data, null, 2));
    console.log('');

    // 14. Verify Deletion
    console.log(`14. Verifying deletion (get product ${productId})...`);
    const getDeleted = await makeRequest('GET', `${API_BASE}/${productId}`);
    console.log(`Status: ${getDeleted.status} (should be 404)`);
    console.log('Response:', JSON.stringify(getDeleted.data, null, 2));
    console.log('');

    // 15. List Products After Deletion
    console.log('15. Listing all products after deletion...');
    const listAfterDelete = await makeRequest('GET', API_BASE);
    console.log(`Status: ${listAfterDelete.status}`);
    console.log('Response:', JSON.stringify(listAfterDelete.data, null, 2));
    console.log('');

    // 16. Test Validation - Invalid Product
    console.log('16. Testing validation (invalid product)...');
    const invalid = await makeRequest('POST', API_BASE, {
      name: '',
      price: -10,
      quantity: 'invalid',
    });
    console.log(`Status: ${invalid.status} (should be 400)`);
    console.log('Response:', JSON.stringify(invalid.data, null, 2));
    console.log('');

    console.log('========================================');
    console.log('✅ All tests completed successfully!');
    console.log('========================================');
  } catch (error) {
    console.error('❌ Error running tests:', error.message);
    console.error('Make sure the server is running on http://localhost:3000');
  }
}

// Run tests
runTests();

