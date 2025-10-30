# Coding Assignment - Complete Solutions

This repository contains complete solutions for a full-stack development coding assignment, demonstrating proficiency in JavaScript, TypeScript, Node.js, API development, system architecture, and testing.

---

## 📁 Project Structure

```
assigment/
├── problem4_three_ways_to_sum_to_n/  # Three ways to sum to n
├── problem5_a_crude_server/          # CRUD REST API with Express & TypeScript
└── problem6_Architecture/            # Live Scoreboard API Architecture
```

---

## 📋 Problems Overview

### Problem 4: Computational Thinking - Sum to N
**Location:** `problem4_three_ways_to_sum_to_n/`

Three different implementations to compute the sum of numbers from 1 to n:
1. **Iterative approach** - Using a for loop (O(n) time, O(1) space)
2. **Mathematical formula** - Using Gauss's formula (O(1) time, O(1) space)
3. **Recursive approach** - Using recursion (O(n) time, O(n) space)

**Features:**
- Complete JSDoc documentation
- Complexity analysis for each method
- Comprehensive unit tests (19 test cases)
- Edge case handling (n=0, n=1, large numbers)

**Technologies:** JavaScript, Node.js built-in `assert` module

📖 [View Problem 4 Details](problem4_three_ways_to_sum_to_n/README.md)

---

### Problem 5: CRUD REST API Server
**Location:** `problem5_a_crude_server/`

A production-ready RESTful API for product management with full CRUD operations, pagination, filtering, and real-time features.

**Features:**
- ✅ Complete CRUD operations (Create, Read, Update, Delete)
- ✅ Advanced filtering (category, price range, stock status)
- ✅ Full-text search functionality
- ✅ Pagination with metadata (page, limit, total, hasNextPage)
- ✅ Input validation middleware
- ✅ Centralized error handling
- ✅ SQLite database with persistence
- ✅ Mock data seeding (100 products)
- ✅ **98.98% test coverage** with 152 passing tests
- ✅ Comprehensive API documentation

**Test Coverage:**
- **Overall:** 98.98% statements, 97.82% branches, 100% functions
- **152 tests** across 14 test suites
- Unit tests, integration tests, and edge case coverage
- 100% coverage on all controllers, middleware, and routes

**Technologies:** 
- TypeScript, Node.js, Express.js
- SQLite3 (database)
- Jest & Supertest (testing)
- CORS, dotenv, input validation

**API Endpoints:**
```
POST   /api/products          - Create product
GET    /api/products          - List products (with pagination & filters)
GET    /api/products/:id      - Get single product
PUT    /api/products/:id      - Update product
DELETE /api/products/:id      - Delete product
GET    /health                - Health check
```

📖 [View Problem 5 Details](problem5_a_crude_server/README.md)

---

### Problem 6: System Architecture - Live Scoreboard API
**Location:** `problem6_Architecture/`

A comprehensive system architecture specification for a real-time, secure scoreboard API module.

**Deliverables:**
1. **Complete API Specification** (README.md - 1,479 lines)
2. **Execution Flow Diagrams** (EXECUTION_FLOW.md - 794 lines)
3. **Implementation Summary** (IMPLEMENTATION_SUMMARY.md - 482 lines)

**Key Features:**
- **Live Updates:** WebSocket-based real-time leaderboard (<200ms latency)
- **Top 10 Scoreboard:** Efficient Redis Sorted Set implementation
- **8-Layer Security:** JWT auth, one-time tokens, rate limiting, HMAC signatures
- **Anti-Cheat System:** Server-side verification, anomaly detection
- **Scalable Design:** Supports 100,000+ concurrent users
- **Complete Documentation:** API specs, data models, security measures

**Architecture Highlights:**
- Microservices-ready design
- Redis Pub/Sub for real-time updates
- PostgreSQL for persistent storage
- Horizontal scaling with load balancing
- ACID-compliant transactions
- Comprehensive monitoring & alerting

**Technologies:** 
- Node.js, TypeScript, Express.js/NestJS
- Socket.IO (WebSocket)
- PostgreSQL, Redis
- JWT authentication
- Rate limiting & security middleware

📖 [View Problem 6 Details](problem6_Architecture/README.md)
