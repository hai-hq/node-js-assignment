# Live Scoreboard API Module Specification

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Authentication & Authorization](#authentication--authorization)
6. [Real-time Updates](#real-time-updates)
7. [Security Measures](#security-measures)
8. [Database Schema](#database-schema)
9. [Implementation Guidelines](#implementation-guidelines)
10. [Error Handling](#error-handling)
11. [Performance Considerations](#performance-considerations)
12. [Improvements & Recommendations](#improvements--recommendations)

---

## Overview

The Live Scoreboard API Module is a backend service that manages user scores with real-time updates. It provides secure score submission, leaderboard retrieval, and live score updates to connected clients.

### Key Features
- **Secure Score Updates**: Authenticated API calls with action verification
- **Real-time Leaderboard**: Live updates via WebSocket connections
- **Top 10 Leaderboard**: Efficient retrieval of top performers
- **Anti-cheat Mechanisms**: Multiple layers of security to prevent score manipulation

### Technology Stack Recommendation
- **Backend Framework**: Node.js with Express.js / NestJS
- **Real-time Communication**: Socket.IO / WebSocket
- **Database**: Redis (for leaderboard) + PostgreSQL/MongoDB (for persistent storage)
- **Authentication**: JWT (JSON Web Tokens)
- **Rate Limiting**: Redis-based rate limiter

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Web App    │  │  Mobile App  │  │   Desktop    │         │
│  │  (Browser)   │  │    (iOS/     │  │     App      │         │
│  │              │  │   Android)   │  │              │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                  │
│         └─────────────────┼──────────────────┘                  │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
         HTTP/HTTPS              WebSocket/Socket.IO
                │                       │
┌───────────────▼───────────────────────▼───────────────────────┐
│                    LOAD BALANCER / API GATEWAY                 │
│              (Nginx, AWS ALB, or Cloud Load Balancer)          │
└───────────────┬───────────────────────┬───────────────────────┘
                │                       │
    ┌───────────┴────────┐    ┌────────┴────────┐
    │                    │    │                  │
┌───▼──────────────┐  ┌──▼──────────────┐  ┌───▼──────────────┐
│  API Server 1    │  │  API Server 2   │  │  API Server N    │
│ ┌──────────────┐ │  │ ┌────────────┐  │  │ ┌──────────────┐ │
│ │ Auth Middle- │ │  │ │ Auth Middle│  │  │ │ Auth Middle- │ │
│ │    ware      │ │  │ │   ware     │  │  │ │    ware      │ │
│ └──────┬───────┘ │  │ └─────┬──────┘  │  │ └──────┬───────┘ │
│ ┌──────▼───────┐ │  │ ┌─────▼──────┐  │  │ ┌──────▼───────┐ │
│ │ Score Update │ │  │ │Score Update│  │  │ │ Score Update │ │
│ │  Controller  │ │  │ │ Controller │  │  │ │  Controller  │ │
│ └──────┬───────┘ │  │ └─────┬──────┘  │  │ └──────┬───────┘ │
│ ┌──────▼───────┐ │  │ ┌─────▼──────┐  │  │ ┌──────▼───────┐ │
│ │ Leaderboard  │ │  │ │Leaderboard │  │  │ │ Leaderboard  │ │
│ │  Controller  │ │  │ │ Controller │  │  │ │  Controller  │ │
│ └──────┬───────┘ │  │ └─────┬──────┘  │  │ └──────┬───────┘ │
│ ┌──────▼───────┐ │  │ ┌─────▼──────┐  │  │ ┌──────▼───────┐ │
│ │  WebSocket   │ │  │ │ WebSocket  │  │  │ │  WebSocket   │ │
│ │   Manager    │ │  │ │  Manager   │  │  │ │   Manager    │ │
│ └──────┬───────┘ │  │ └─────┬──────┘  │  │ └──────┬───────┘ │
└────────┼─────────┘  └───────┼─────────┘  └────────┼─────────┘
         │                    │                      │
         └────────────────────┼──────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                     MESSAGE BROKER / PUB-SUB                   │
│              (Redis Pub/Sub, RabbitMQ, or Kafka)              │
└────────────────────────────┬──────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼─────────┐  ┌──────▼───────┐  ┌───────▼──────────┐
│  Redis Cache     │  │  PostgreSQL  │  │   Action         │
│  (Leaderboard    │  │  (User Data, │  │   Verification   │
│   Sorted Set)    │  │   History,   │  │   Service        │
│                  │  │   Audit Log) │  │                  │
└──────────────────┘  └──────────────┘  └──────────────────┘
```

---

## API Endpoints

### 1. Score Update Endpoint

**POST** `/api/v1/scores/update`

Updates a user's score after completing an action.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
X-Action-Token: <ONE_TIME_ACTION_TOKEN>
```

**Request Body:**
```json
{
  "userId": "string (UUID)",
  "actionType": "string (enum: COMPLETE_QUEST, WIN_GAME, ACHIEVEMENT_UNLOCK, etc.)",
  "actionId": "string (UUID of the specific action)",
  "scoreIncrement": "number (points to add)",
  "timestamp": "ISO 8601 timestamp",
  "clientSignature": "string (HMAC signature for verification)"
}
```

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid-123",
    "newScore": 1250,
    "scoreIncrement": 50,
    "rank": 7,
    "previousRank": 9,
    "timestamp": "2025-10-30T10:30:00Z"
  },
  "message": "Score updated successfully"
}
```

**Response (Error - 401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired authentication token"
  }
}
```

**Response (Error - 403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_ACTION_TOKEN",
    "message": "Action token is invalid or already used"
  }
}
```

**Response (Error - 429 Too Many Requests):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many score update requests. Please wait before trying again.",
    "retryAfter": 60
  }
}
```

---

### 2. Get Leaderboard Endpoint

**GET** `/api/v1/leaderboard/top`

Retrieves the top 10 users on the leaderboard.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
```
limit: number (default: 10, max: 100)
offset: number (default: 0)
period: string (enum: ALL_TIME, DAILY, WEEKLY, MONTHLY)
```

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "userId": "user-uuid-1",
        "username": "ProGamer123",
        "score": 9850,
        "avatar": "https://cdn.example.com/avatars/user1.jpg",
        "country": "US",
        "lastUpdated": "2025-10-30T10:25:00Z"
      },
      {
        "rank": 2,
        "userId": "user-uuid-2",
        "username": "SkillMaster",
        "score": 8920,
        "avatar": "https://cdn.example.com/avatars/user2.jpg",
        "country": "UK",
        "lastUpdated": "2025-10-30T10:20:00Z"
      }
      // ... 8 more users
    ],
    "currentUser": {
      "rank": 45,
      "userId": "current-user-uuid",
      "username": "CurrentUser",
      "score": 1250
    },
    "totalUsers": 50000,
    "period": "ALL_TIME",
    "generatedAt": "2025-10-30T10:30:00Z"
  }
}
```

---

### 3. WebSocket Connection for Live Updates

**WebSocket Endpoint:** `wss://api.example.com/ws/leaderboard`

**Connection Authentication:**
```javascript
// Client-side connection with JWT
const socket = io('wss://api.example.com', {
  auth: {
    token: 'Bearer <JWT_TOKEN>'
  }
});
```

**Server Events (Server → Client):**

1. **leaderboard.update** - Full leaderboard update
```json
{
  "event": "leaderboard.update",
  "data": {
    "leaderboard": [ /* array of top 10 users */ ],
    "timestamp": "2025-10-30T10:30:00Z"
  }
}
```

2. **leaderboard.rank_change** - Specific rank change
```json
{
  "event": "leaderboard.rank_change",
  "data": {
    "userId": "user-uuid-123",
    "username": "ProGamer123",
    "oldRank": 5,
    "newRank": 3,
    "score": 8500,
    "timestamp": "2025-10-30T10:30:00Z"
  }
}
```

3. **leaderboard.new_leader** - New #1 on the leaderboard
```json
{
  "event": "leaderboard.new_leader",
  "data": {
    "userId": "user-uuid-456",
    "username": "NewChampion",
    "score": 10000,
    "previousLeader": {
      "userId": "user-uuid-1",
      "username": "OldChampion",
      "score": 9850
    },
    "timestamp": "2025-10-30T10:30:00Z"
  }
}
```

**Client Events (Client → Server):**

1. **subscribe** - Subscribe to leaderboard updates
```json
{
  "event": "subscribe",
  "data": {
    "channel": "leaderboard.top10"
  }
}
```

2. **unsubscribe** - Unsubscribe from updates
```json
{
  "event": "unsubscribe",
  "data": {
    "channel": "leaderboard.top10"
  }
}
```

---

## Data Models

### User Model
```typescript
interface User {
  id: string;              // UUID
  username: string;        // Unique username
  email: string;           // User email
  score: number;           // Current total score
  rank: number;            // Current leaderboard rank
  country: string;         // ISO country code
  avatar: string;          // URL to avatar image
  createdAt: Date;         // Account creation date
  lastActive: Date;        // Last activity timestamp
  isActive: boolean;       // Account status
}
```

### Score Update Model
```typescript
interface ScoreUpdate {
  id: string;              // UUID
  userId: string;          // Foreign key to User
  actionType: ActionType;  // Type of action completed
  actionId: string;        // Specific action instance ID
  scoreIncrement: number;  // Points added
  previousScore: number;   // Score before update
  newScore: number;        // Score after update
  previousRank: number;    // Rank before update
  newRank: number;         // Rank after update
  timestamp: Date;         // When the update occurred
  ipAddress: string;       // Request IP (for fraud detection)
  userAgent: string;       // Client user agent
  verified: boolean;       // Whether action was verified
}
```

### Action Token Model
```typescript
interface ActionToken {
  id: string;              // UUID
  userId: string;          // Foreign key to User
  actionType: ActionType;  // Type of action
  actionId: string;        // Specific action instance
  token: string;           // One-time use token (hashed)
  expiresAt: Date;         // Token expiration
  usedAt: Date | null;     // When token was used (null if unused)
  createdAt: Date;         // When token was created
  isValid: boolean;        // Token validity status
}
```

### Leaderboard Entry (Redis Model)
```typescript
interface LeaderboardEntry {
  userId: string;          // User ID
  score: number;           // User score
  username: string;        // Cached username
  avatar: string;          // Cached avatar URL
  country: string;         // Cached country
  lastUpdated: Date;       // Last score update
}
```

---

## Authentication & Authorization

### JWT Token Structure

**Payload:**
```json
{
  "sub": "user-uuid-123",           // Subject (User ID)
  "username": "ProGamer123",        // Username
  "email": "user@example.com",      // Email
  "role": "user",                   // User role
  "permissions": ["score.update", "leaderboard.view"],
  "iat": 1698672000,                // Issued at
  "exp": 1698758400,                // Expires at (24 hours)
  "iss": "scoreboard-api",          // Issuer
  "aud": "scoreboard-client"        // Audience
}
```

### Action Token Generation Flow

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. User completes action
       │    (e.g., wins a game)
       │
       ▼
┌──────────────────────────────────────────┐
│         Game/Action Logic                │
│  - Validates action completion           │
│  - Generates action completion proof     │
└──────┬───────────────────────────────────┘
       │
       │ 2. Request action token
       │    POST /api/v1/actions/complete
       │    Body: { actionId, proof, timestamp }
       │
       ▼
┌──────────────────────────────────────────┐
│      Action Verification Service         │
│  - Verifies action completion            │
│  - Checks action hasn't been used before │
│  - Validates proof/signature             │
│  - Checks rate limits                    │
└──────┬───────────────────────────────────┘
       │
       │ 3. Generate one-time action token
       │    - Create cryptographically secure token
       │    - Store in database with expiry (5 min)
       │    - Associate with userId + actionId
       │
       ▼
┌──────────────────────────────────────────┐
│         Return Action Token              │
│  Response: {                             │
│    actionToken: "aXrf3$#...",           │
│    expiresIn: 300,                      │
│    scoreIncrement: 50                    │
│  }                                       │
└──────┬───────────────────────────────────┘
       │
       │ 4. Client submits score update
       │    POST /api/v1/scores/update
       │    Headers: { X-Action-Token: ... }
       │
       ▼
┌──────────────────────────────────────────┐
│        Score Update Controller           │
│  - Verify JWT authentication             │
│  - Validate action token                 │
│  - Mark token as used                    │
│  - Update user score                     │
│  - Broadcast to WebSocket clients        │
└──────────────────────────────────────────┘
```

---

## Real-time Updates

### WebSocket Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Score Update Flow                        │
└────────────────────────────────────────────────────────────┘

User A completes action
         │
         ▼
┌────────────────────┐
│  API Server        │
│  - Validates       │
│  - Updates score   │
│  - Publishes event │
└─────────┬──────────┘
          │
          │ Publish: "score.updated"
          │ Data: { userId, newScore, rank }
          ▼
┌─────────────────────────────────────┐
│    Redis Pub/Sub / Message Broker   │
└─────────┬───────────────────────────┘
          │
          │ Subscribe to "score.updated"
          │
    ┌─────┴─────┬─────────┬─────────┐
    │           │         │         │
    ▼           ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│WS Mgr 1│ │WS Mgr 2│ │WS Mgr 3│ │WS Mgr N│
└───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
    │          │          │          │
    │ Emit to  │ Emit to  │ Emit to  │ Emit to
    │ connected│ connected│ connected│ connected
    │ clients  │ clients  │ clients  │ clients
    │          │          │          │
    ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Client 1│ │Client 2│ │Client 3│ │Client N│
│(User A)│ │(User B)│ │(User C)│ │(User D)│
└────────┘ └────────┘ └────────┘ └────────┘
    │
    └─→ Leaderboard UI updates in real-time
```

### Optimization: Debouncing & Throttling

To prevent overwhelming clients with updates:

1. **Server-side throttling**: Max 1 leaderboard update per second
2. **Client-side debouncing**: Update UI every 500ms
3. **Delta updates**: Send only changed entries, not full leaderboard
4. **Rank change threshold**: Only broadcast if rank changes ≥ 1 position

---

## Security Measures

### 1. Anti-Cheat Mechanisms

**a) One-Time Action Tokens**
- Each action completion generates a unique, single-use token
- Token expires after 5 minutes
- Token is cryptographically signed and cannot be forged
- Token can only be used once (marked as used in database)

**b) Server-Side Action Verification**
```typescript
// Example verification flow
async function verifyAction(actionId: string, proof: any): Promise<boolean> {
  // 1. Check if action exists and is completable
  const action = await getAction(actionId);
  if (!action || action.completed) return false;
  
  // 2. Verify action completion proof
  // This could be: game server signature, cryptographic proof, etc.
  const isValid = await verifyActionProof(action, proof);
  if (!isValid) return false;
  
  // 3. Check action timestamp (prevent replay attacks)
  const isRecent = isWithinTimeWindow(proof.timestamp, 60); // 60 seconds
  if (!isRecent) return false;
  
  // 4. Mark action as completed
  await markActionCompleted(actionId);
  
  return true;
}
```

**c) Rate Limiting**
- User-level: Max 10 score updates per minute
- IP-level: Max 100 requests per minute
- Global: Max 10,000 requests per minute per server instance

**d) Client Signature Verification**
```typescript
// Client generates HMAC signature
const signature = HMAC_SHA256(
  secretKey,
  userId + actionId + timestamp + scoreIncrement
);

// Server verifies signature
function verifyClientSignature(request: ScoreUpdateRequest): boolean {
  const expectedSignature = HMAC_SHA256(
    getUserSecret(request.userId),
    request.userId + request.actionId + request.timestamp + request.scoreIncrement
  );
  return crypto.timingSafeEqual(
    Buffer.from(request.clientSignature),
    Buffer.from(expectedSignature)
  );
}
```

**e) Anomaly Detection**
- Flag users with suspiciously high score gains
- Monitor for impossible action completion times
- Track patterns of repeated actions
- Alert on unusual IP address changes

### 2. Rate Limiting Implementation

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Per-user rate limiter
const scoreUpdateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:score:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per user
  keyGenerator: (req) => req.user.id,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many score update requests',
        retryAfter: 60
      }
    });
  }
});

// Apply to score update endpoint
app.post('/api/v1/scores/update', 
  authenticate, 
  scoreUpdateLimiter, 
  updateScore
);
```

### 3. Input Validation & Sanitization

```typescript
import Joi from 'joi';

const scoreUpdateSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  actionType: Joi.string().valid(...Object.values(ActionType)).required(),
  actionId: Joi.string().uuid().required(),
  scoreIncrement: Joi.number().integer().min(1).max(1000).required(),
  timestamp: Joi.date().iso().max('now').required(),
  clientSignature: Joi.string().length(64).required()
});

// Middleware
function validateScoreUpdate(req, res, next) {
  const { error } = scoreUpdateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: error.details[0].message
      }
    });
  }
  next();
}
```

---

## Database Schema

### PostgreSQL Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  score BIGINT DEFAULT 0,
  rank INTEGER,
  country VARCHAR(2),
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_score ON users(score DESC);
CREATE INDEX idx_users_rank ON users(rank);
CREATE INDEX idx_users_username ON users(username);

-- Score updates table (audit log)
CREATE TABLE score_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  action_id UUID NOT NULL,
  score_increment INTEGER NOT NULL,
  previous_score BIGINT NOT NULL,
  new_score BIGINT NOT NULL,
  previous_rank INTEGER,
  new_rank INTEGER,
  ip_address INET,
  user_agent TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_score_updates_user_id ON score_updates(user_id);
CREATE INDEX idx_score_updates_created_at ON score_updates(created_at DESC);
CREATE INDEX idx_score_updates_action_id ON score_updates(action_id);

-- Action tokens table
CREATE TABLE action_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  action_id UUID NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(action_id) -- Prevent duplicate tokens for same action
);

CREATE INDEX idx_action_tokens_user_id ON action_tokens(user_id);
CREATE INDEX idx_action_tokens_token_hash ON action_tokens(token_hash);
CREATE INDEX idx_action_tokens_expires_at ON action_tokens(expires_at);

-- Actions table (define what actions exist and their point values)
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(50) UNIQUE NOT NULL,
  base_points INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboard snapshots (for historical data)
CREATE TABLE leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period VARCHAR(20) NOT NULL, -- 'DAILY', 'WEEKLY', 'MONTHLY'
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_snapshots_period ON leaderboard_snapshots(period, created_at DESC);
```

### Redis Data Structures

```redis
# Sorted set for live leaderboard (score is the value, userId is the member)
ZADD leaderboard:all_time <score> <userId>

# Example:
ZADD leaderboard:all_time 9850 "user-uuid-1"
ZADD leaderboard:all_time 8920 "user-uuid-2"

# Get top 10
ZREVRANGE leaderboard:all_time 0 9 WITHSCORES

# Get user rank
ZREVRANK leaderboard:all_time "user-uuid-123"

# User data cache (hash)
HSET user:<userId> username "ProGamer123" avatar "https://..." country "US"

# Rate limiting
INCR rate-limit:score:<userId>:<minute>
EXPIRE rate-limit:score:<userId>:<minute> 60

# Action token cache (for quick validation)
SET action-token:<token-hash> <userId>:<actionId> EX 300
```

---

## Implementation Guidelines

### Recommended Technology Stack

```
Backend:
- Node.js (v18+) with TypeScript
- Express.js or NestJS
- Socket.IO (WebSocket)

Databases:
- PostgreSQL 14+ (persistent storage)
- Redis 7+ (caching, leaderboard, pub/sub)

Authentication:
- JSON Web Tokens (JWT)
- bcrypt (password hashing)

Security:
- helmet (HTTP headers)
- express-rate-limit
- express-validator
- crypto (HMAC signatures)

Monitoring:
- Winston (logging)
- Prometheus (metrics)
- Grafana (visualization)

Testing:
- Jest (unit testing)
- Supertest (API testing)
- Artillery (load testing)
```

### Project Structure

```
scoreboard-api/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── websocket.ts
│   ├── controllers/
│   │   ├── score.controller.ts
│   │   ├── leaderboard.controller.ts
│   │   └── action.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   └── validation.middleware.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── scoreUpdate.model.ts
│   │   └── actionToken.model.ts
│   ├── services/
│   │   ├── score.service.ts
│   │   ├── leaderboard.service.ts
│   │   ├── action.service.ts
│   │   ├── websocket.service.ts
│   │   └── verification.service.ts
│   ├── routes/
│   │   ├── score.routes.ts
│   │   ├── leaderboard.routes.ts
│   │   └── action.routes.ts
│   ├── utils/
│   │   ├── crypto.util.ts
│   │   ├── logger.util.ts
│   │   └── validator.util.ts
│   ├── types/
│   │   └── index.ts
│   └── app.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── load/
├── docs/
│   └── API.md
├── .env.example
├── package.json
└── tsconfig.json
```

### Core Service Implementation Examples

**Score Service (score.service.ts):**

```typescript
export class ScoreService {
  /**
   * Update user score after action completion
   */
  async updateScore(
    userId: string,
    actionId: string,
    actionType: string,
    actionToken: string
  ): Promise<ScoreUpdateResult> {
    // 1. Verify action token
    const isValidToken = await this.verifyActionToken(
      userId,
      actionId,
      actionToken
    );
    
    if (!isValidToken) {
      throw new UnauthorizedError('Invalid or used action token');
    }
    
    // 2. Get action points
    const action = await this.getAction(actionType);
    const scoreIncrement = action.basePoints;
    
    // 3. Update user score in transaction
    const result = await db.transaction(async (trx) => {
      // Get current score
      const user = await trx('users')
        .where({ id: userId })
        .forUpdate()
        .first();
      
      const previousScore = user.score;
      const newScore = previousScore + scoreIncrement;
      
      // Update score
      await trx('users')
        .where({ id: userId })
        .update({ 
          score: newScore,
          updated_at: new Date()
        });
      
      // Log score update
      await trx('score_updates').insert({
        user_id: userId,
        action_type: actionType,
        action_id: actionId,
        score_increment: scoreIncrement,
        previous_score: previousScore,
        new_score: newScore,
        verified: true
      });
      
      // Mark token as used
      await trx('action_tokens')
        .where({ action_id: actionId })
        .update({ 
          used_at: new Date(),
          is_valid: false
        });
      
      return { previousScore, newScore, scoreIncrement };
    });
    
    // 4. Update Redis leaderboard
    await redis.zadd('leaderboard:all_time', result.newScore, userId);
    
    // 5. Get new rank
    const newRank = await redis.zrevrank('leaderboard:all_time', userId) + 1;
    
    // 6. Publish update event
    await this.publishScoreUpdate(userId, result.newScore, newRank);
    
    return {
      ...result,
      rank: newRank
    };
  }
  
  /**
   * Publish score update to message broker
   */
  private async publishScoreUpdate(
    userId: string,
    newScore: number,
    newRank: number
  ): Promise<void> {
    await redis.publish('score.updated', JSON.stringify({
      userId,
      newScore,
      newRank,
      timestamp: new Date().toISOString()
    }));
  }
}
```

**WebSocket Service (websocket.service.ts):**

```typescript
export class WebSocketService {
  private io: Server;
  
  constructor(httpServer: any) {
    this.io = new Server(httpServer, {
      cors: { origin: process.env.CORS_ORIGIN },
      transports: ['websocket', 'polling']
    });
    
    this.setupMiddleware();
    this.setupHandlers();
    this.subscribeToRedis();
  }
  
  /**
   * Authenticate WebSocket connections
   */
  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const user = await verifyJWT(token);
        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }
  
  /**
   * Setup event handlers
   */
  private setupHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.data.user.id}`);
      
      // Subscribe to leaderboard updates
      socket.on('subscribe', (data) => {
        if (data.channel === 'leaderboard.top10') {
          socket.join('leaderboard');
          this.sendCurrentLeaderboard(socket);
        }
      });
      
      // Unsubscribe
      socket.on('unsubscribe', (data) => {
        if (data.channel === 'leaderboard.top10') {
          socket.leave('leaderboard');
        }
      });
      
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.data.user.id}`);
      });
    });
  }
  
  /**
   * Subscribe to Redis Pub/Sub for score updates
   */
  private subscribeToRedis(): void {
    const subscriber = redis.duplicate();
    
    subscriber.subscribe('score.updated', (message) => {
      const update = JSON.parse(message);
      this.handleScoreUpdate(update);
    });
  }
  
  /**
   * Handle score update and broadcast to clients
   */
  private async handleScoreUpdate(update: any): Promise<void> {
    // Get updated leaderboard
    const leaderboard = await this.getTopLeaderboard();
    
    // Broadcast to all clients in leaderboard room
    this.io.to('leaderboard').emit('leaderboard.update', {
      leaderboard,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Send current leaderboard to newly connected client
   */
  private async sendCurrentLeaderboard(socket: any): Promise<void> {
    const leaderboard = await this.getTopLeaderboard();
    socket.emit('leaderboard.update', {
      leaderboard,
      timestamp: new Date().toISOString()
    });
  }
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error context
    },
    "timestamp": "2025-10-30T10:30:00Z",
    "requestId": "req-uuid-123"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | User doesn't have permission |
| `INVALID_ACTION_TOKEN` | 403 | Action token is invalid or already used |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INVALID_INPUT` | 400 | Request validation failed |
| `ACTION_NOT_FOUND` | 404 | Action doesn't exist |
| `USER_NOT_FOUND` | 404 | User doesn't exist |
| `ACTION_ALREADY_COMPLETED` | 409 | Action was already completed |
| `TOKEN_EXPIRED` | 401 | Token has expired |
| `INTERNAL_ERROR` | 500 | Server error |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `REDIS_ERROR` | 500 | Redis operation failed |

---

## Performance Considerations

### 1. Database Optimization

**Indexing Strategy:**
- Index on `users.score` (DESC) for fast leaderboard queries
- Index on `users.rank` for rank-based queries
- Index on `score_updates.created_at` for audit queries
- Composite index on `action_tokens(user_id, expires_at, is_valid)`

**Query Optimization:**
```sql
-- Efficient leaderboard query with user data
SELECT 
  u.id,
  u.username,
  u.score,
  u.avatar,
  u.country,
  RANK() OVER (ORDER BY u.score DESC) as rank
FROM users u
WHERE u.is_active = true
ORDER BY u.score DESC
LIMIT 10;
```

**Connection Pooling:**
```typescript
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 2. Redis Optimization

**Use Sorted Sets for Leaderboard:**
- O(log N) insertion time
- O(log N) rank lookup
- O(M log N) for top M users

**Pipeline Commands:**
```typescript
// Batch multiple Redis commands
const pipeline = redis.pipeline();
pipeline.zadd('leaderboard:all_time', score, userId);
pipeline.zrevrank('leaderboard:all_time', userId);
pipeline.hgetall(`user:${userId}`);
await pipeline.exec();
```

**Cache Strategy:**
```typescript
// Cache leaderboard for 1 second to reduce Redis load
const cacheKey = 'leaderboard:top10:cache';
let leaderboard = await cache.get(cacheKey);

if (!leaderboard) {
  leaderboard = await redis.zrevrange('leaderboard:all_time', 0, 9, 'WITHSCORES');
  await cache.set(cacheKey, leaderboard, 1); // 1 second TTL
}
```

### 3. WebSocket Optimization

**Message Throttling:**
```typescript
// Throttle leaderboard updates to max 1 per second
const throttledBroadcast = throttle(
  (data) => io.to('leaderboard').emit('leaderboard.update', data),
  1000 // 1 second
);
```

**Room Management:**
- Clients only subscribe to channels they need
- Automatically clean up disconnected clients
- Use namespaces to separate different leaderboard types

**Load Distribution:**
- Use sticky sessions for WebSocket connections
- Implement Redis adapter for Socket.IO (socket.io-redis)
- Scale horizontally with multiple servers

### 4. API Optimization

**Response Caching:**
```typescript
// Cache leaderboard API response
app.get('/api/v1/leaderboard/top',
  authenticate,
  cacheMiddleware(1), // Cache for 1 second
  getLeaderboard
);
```

**Compression:**
```typescript
import compression from 'compression';
app.use(compression()); // Gzip compression for responses
```

**Pagination:**
```typescript
// Don't return all users, use pagination
GET /api/v1/leaderboard/top?limit=10&offset=0
```

---

## Improvements & Recommendations

### Immediate Improvements (MVP)

1. **Action Verification Service**
   - Implement dedicated microservice for action verification
   - Use cryptographic proofs to validate action completion
   - Store action completion evidence for audit trails

2. **Enhanced Security**
   - Implement IP-based geolocation checks
   - Add device fingerprinting
   - Use machine learning for anomaly detection
   - Implement CAPTCHA for suspicious activity

3. **Better Rate Limiting**
   - Dynamic rate limits based on user reputation
   - Different limits for different user tiers (free vs premium)
   - Exponential backoff for repeated violations

4. **Monitoring & Alerts**
   - Real-time dashboards for API performance
   - Alerts for suspicious score patterns
   - Automated anomaly detection
   - Performance metrics tracking

### Future Enhancements

1. **Multiple Leaderboard Types**
   ```typescript
   // Daily, weekly, monthly leaderboards
   GET /api/v1/leaderboard/top?period=DAILY
   GET /api/v1/leaderboard/top?period=WEEKLY
   GET /api/v1/leaderboard/top?period=MONTHLY
   
   // Country-specific leaderboards
   GET /api/v1/leaderboard/top?country=US
   
   // Friend leaderboards
   GET /api/v1/leaderboard/friends
   ```

2. **Achievements & Badges**
   - Award badges for reaching milestones
   - Special achievements for leaderboard positions
   - Streak tracking (consecutive days in top 10)

3. **Historical Data & Analytics**
   - Score progression graphs
   - Rank history tracking
   - Personal best records
   - Achievement timeline

4. **Social Features**
   - Follow/unfollow other users
   - Challenge friends to beat scores
   - Share achievements on social media
   - Clan/team leaderboards

5. **Advanced Anti-Cheat**
   - **Behavioral Analysis**: Track playing patterns and flag anomalies
   - **Server-Side Validation**: Move critical game logic to server
   - **Cryptographic Proofs**: Use zero-knowledge proofs for action completion
   - **Peer Verification**: Cross-validate actions with other players
   - **Honeypot Actions**: Plant fake high-value actions to catch cheaters

6. **Performance Enhancements**
   - **CDN Integration**: Cache leaderboard data at edge locations
   - **Read Replicas**: Separate read/write database instances
   - **Sharding**: Partition leaderboard by region or user tier
   - **GraphQL**: Allow clients to request only needed fields
   - **Server-Sent Events (SSE)**: Alternative to WebSocket for one-way updates

7. **Scalability**
   - **Microservices Architecture**: Separate score, leaderboard, and action services
   - **Event Sourcing**: Store all score changes as immutable events
   - **CQRS Pattern**: Separate command (write) and query (read) models
   - **Distributed Caching**: Multi-region Redis clusters
   - **Message Queue**: Use RabbitMQ/Kafka for async processing

8. **Developer Experience**
   - **API Versioning**: Support multiple API versions (v1, v2, etc.)
   - **SDK/Client Libraries**: Provide SDKs for popular languages
   - **Webhooks**: Allow developers to subscribe to score events
   - **API Playground**: Interactive API documentation (Swagger/OpenAPI)
   - **Rate Limit Headers**: Include `X-RateLimit-*` headers in responses

9. **Compliance & Privacy**
   - **GDPR Compliance**: Right to be forgotten, data export
   - **Data Retention Policies**: Automatic cleanup of old data
   - **Audit Logs**: Complete history of all score changes
   - **Data Encryption**: Encrypt sensitive data at rest and in transit
   - **Privacy Controls**: Allow users to hide from leaderboards

10. **Testing & Quality Assurance**
    - **Load Testing**: Regular stress tests with tools like Artillery
    - **Chaos Engineering**: Test system resilience with controlled failures
    - **A/B Testing**: Test different scoring algorithms
    - **Automated Security Scans**: Regular vulnerability assessments
    - **Performance Budgets**: Set and monitor performance thresholds

### Architectural Considerations

**Microservices Migration Path:**
```
Monolith → Modular Monolith → Microservices

Phase 1: Single API server with clear module boundaries
Phase 2: Extract services to separate processes (same server)
Phase 3: Deploy services to separate servers
Phase 4: Implement service mesh (Istio, Linkerd)
```

**Event-Driven Architecture:**
```
Action Completed → Event Published → Multiple Consumers
                                    ├─ Score Service (update score)
                                    ├─ Achievement Service (check achievements)
                                    ├─ Analytics Service (track metrics)
                                    └─ Notification Service (notify user)
```

**Data Consistency Strategies:**
- Use eventual consistency for non-critical operations
- Strong consistency for score updates (database transactions)
- Compensating transactions for distributed operations
- Idempotency keys to prevent duplicate processing

---

## Testing Strategy

### Unit Tests
- Test individual functions in isolation
- Mock external dependencies (database, Redis, etc.)
- Aim for >90% code coverage

### Integration Tests
- Test API endpoints with real database (test instance)
- Test WebSocket connections and events
- Test authentication and authorization flows

### Load Tests
- Simulate concurrent users (1000+)
- Test score update throughput
- Test WebSocket connection limits
- Identify bottlenecks and optimize

### Security Tests
- Test authentication bypass attempts
- Test rate limit evasion
- Test action token reuse attempts
- Test SQL injection vulnerabilities
- Test XSS and CSRF attacks

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (unit, integration, load)
- [ ] Code review completed
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database migrations prepared
- [ ] Redis configuration verified

### Deployment Steps
1. Deploy database migrations
2. Deploy Redis configuration changes
3. Deploy API servers (blue-green deployment)
4. Verify health checks pass
5. Monitor error rates and latency
6. Gradually shift traffic to new version
7. Rollback plan ready if needed

### Post-Deployment
- [ ] Monitor application metrics
- [ ] Check error logs for anomalies
- [ ] Verify WebSocket connections working
- [ ] Test score updates from production client
- [ ] Monitor database performance
- [ ] Check Redis memory usage
- [ ] Verify rate limiting working
- [ ] Run smoke tests on production

---

## Monitoring & Observability

### Key Metrics to Track

**API Metrics:**
- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate (%)
- Success rate (%)

**Business Metrics:**
- Score updates per minute
- Active WebSocket connections
- Leaderboard updates per second
- Failed action token validations
- Rate limit triggers per minute

**Infrastructure Metrics:**
- CPU usage
- Memory usage
- Database connection pool size
- Redis memory usage
- Network I/O

**Security Metrics:**
- Failed authentication attempts
- Suspicious score patterns detected
- Rate limit violations
- Invalid action tokens submitted

### Alerting Rules

```yaml
# High error rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  annotations:
    summary: "High error rate detected"
    
# High latency
- alert: HighLatency
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
  annotations:
    summary: "API latency is too high"
    
# Database connection pool exhausted
- alert: DatabasePoolExhausted
  expr: database_connection_pool_active / database_connection_pool_max > 0.9
  annotations:
    summary: "Database connection pool almost full"
```

---

## Conclusion

This specification provides a comprehensive foundation for implementing a secure, scalable, and real-time scoreboard API. The architecture balances security (anti-cheat mechanisms), performance (Redis caching, WebSocket optimization), and user experience (live updates, fast leaderboard).

The implementation team should prioritize:
1. **Security first**: Implement all anti-cheat measures from day one
2. **Scalability**: Design for horizontal scaling from the start
3. **Monitoring**: Set up comprehensive observability before launch
4. **Testing**: Write tests alongside implementation, not after

For questions or clarifications, please refer to this document or contact the architecture team.
