#!/bin/bash

# API Testing Script for CRUD Operations
# Make sure the server is running before executing this script

BASE_URL="http://localhost:3000/api"

echo "========================================="
echo "Testing CRUD API"
echo "========================================="
echo ""

# Health Check
echo "1. Health Check..."
curl -s http://localhost:3000/health | json_pp
echo -e "\n"

# Create a product
echo "2. Creating a new product..."
PRODUCT_ID=$(curl -s -X POST $BASE_URL/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gaming Laptop",
    "description": "High-performance gaming laptop with RTX 4080",
    "price": 1999.99,
    "quantity": 25,
    "category": "Electronics"
  }' | json_pp | grep '"id"' | grep -o '[0-9]*')
echo "Created product with ID: $PRODUCT_ID"
echo -e "\n"

# Create another product
echo "3. Creating another product..."
curl -s -X POST $BASE_URL/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse",
    "price": 29.99,
    "quantity": 100,
    "category": "Accessories"
  }' | json_pp
echo -e "\n"

# List all products
echo "4. Listing all products..."
curl -s $BASE_URL/products | json_pp
echo -e "\n"

# Get single product
echo "5. Getting product by ID..."
curl -s $BASE_URL/products/$PRODUCT_ID | json_pp
echo -e "\n"

# Update product
echo "6. Updating product..."
curl -s -X PUT $BASE_URL/products/$PRODUCT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "price": 1799.99,
    "quantity": 20
  }' | json_pp
echo -e "\n"

# Filter by category
echo "7. Filtering by category (Electronics)..."
curl -s "$BASE_URL/products?category=Electronics" | json_pp
echo -e "\n"

# Search products
echo "8. Searching for 'laptop'..."
curl -s "$BASE_URL/products?search=laptop" | json_pp
echo -e "\n"

# Delete product
echo "9. Deleting product..."
curl -s -X DELETE $BASE_URL/products/$PRODUCT_ID | json_pp
echo -e "\n"

# List products after deletion
echo "10. Listing products after deletion..."
curl -s $BASE_URL/products | json_pp
echo -e "\n"

echo "========================================="
echo "API Testing Complete!"
echo "========================================="

