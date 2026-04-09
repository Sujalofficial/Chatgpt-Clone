# 🏗️ Architecture & Scaling Guide

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   React 18 + TypeScript + Tailwind CSS              │  │
│  │   - Zustand (State Management)                       │  │
│  │   - React Markdown (Content Rendering)               │  │
│  │   - Radix UI (Component Library)                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Supabase Edge Functions (Deno + Hono)             │  │
│  │   - JWT Authentication                               │  │
│  │   - Request Validation                               │  │
│  │   - CORS Management                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
┌──────────────────┐ ┌──────────────┐ ┌────────────────┐
│  Auth Service    │ │  Data Layer  │ │  AI Services   │
│                  │ │              │ │                │
│  - Supabase Auth │ │  - KV Store  │ │  - Groq API    │
│  - User Mgmt     │ │  - PostgreSQL│ │  - Gemini API  │
└──────────────────┘ └──────────────┘ └────────────────┘
```

---

## Current Implementation

### Frontend Architecture

**State Management (Zustand)**
```typescript
// Two main stores:
1. auth-store.ts
   - User authentication state
   - Session management
   - Sign in/up/out logic

2. chat-store.ts
   - Chat history
   - Current conversation
   - Model selection
   - Message sending/receiving
```

**Component Hierarchy**
```
App.tsx
├── AuthPage.tsx (unauthenticated)
└── Main Layout (authenticated)
    ├── ChatSidebar.tsx
    │   └── Chat history list
    └── ChatWindow.tsx
        ├── ModelSelector.tsx
        ├── Messages Area
        │   └── ChatMessage.tsx (with markdown)
        └── ChatInput.tsx
```

### Backend Architecture

**Edge Function Structure**
```typescript
server/index.tsx
├── Auth Endpoints
│   └── POST /auth/signup
├── Chat Endpoints
│   ├── GET /chats (list all)
│   ├── POST /chats (create)
│   ├── GET /chats/:id (retrieve)
│   └── DELETE /chats/:id
└── AI Endpoints
    └── POST /chat/stream
        ├── callGroqAPI()
        └── callGeminiAPI()
```

**Data Storage**
- Key-Value Store (current)
- Keys: `chat:{userId}:{chatId}`
- Values: JSON-serialized chat objects

---

## Production Scaling Strategy

### Phase 1: Immediate Optimizations (0-1K users)

#### 1.1 Add Request Rate Limiting
```typescript
// Implement in server/index.tsx
import { rateLimiter } from 'npm:hono-rate-limiter';

app.use('/make-server-68e31ce4/chat/*', rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  keyGenerator: (c) => c.req.header('Authorization'), // Per user
}));
```

#### 1.2 Input Validation & Sanitization
```typescript
// Add Zod schema validation
import { z } from 'npm:zod';

const messageSchema = z.object({
  chatId: z.string().uuid(),
  message: z.string().min(1).max(10000),
  models: z.array(z.enum(['groq', 'gemini'])),
});
```

#### 1.3 Error Handling Enhancement
```typescript
// Centralized error handler
app.onError((err, c) => {
  console.error(`Error: ${err.message}`, err);
  return c.json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'dev' ? err.message : undefined,
  }, 500);
});
```

### Phase 2: Database Migration (1K-10K users)

#### 2.1 Migrate from KV Store to Relational Tables

**Schema Design**
```sql
-- Users table (managed by Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_user_chats (user_id, updated_at DESC)
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  model TEXT CHECK (model IN ('groq', 'gemini', NULL)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_chat_messages (chat_id, created_at ASC)
);

-- Row Level Security
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chats"
  ON chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages from their chats"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );
```

**Benefits**
- Better query performance with indexes
- Proper data relationships
- Easier analytics and reporting
- Built-in pagination support

### Phase 3: Caching Layer (10K-100K users)

#### 3.1 Implement Redis Cache

**Use Cases**
```typescript
// 1. Cache common prompts
const cacheKey = `prompt:${hashPrompt(message)}:${model}`;
const cached = await redis.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

// 2. Cache user sessions
const sessionKey = `session:${userId}`;
await redis.setex(sessionKey, 3600, JSON.stringify(userData));

// 3. Cache chat metadata
const chatListKey = `chats:${userId}`;
await redis.setex(chatListKey, 300, JSON.stringify(chats));
```

**Implementation**
```typescript
// server/redis.ts
import { Redis } from 'npm:ioredis';

const redis = new Redis(Deno.env.get('REDIS_URL'));

export async function getCached<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCache(
  key: string,
  value: any,
  ttl: number = 300
): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(value));
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

### Phase 4: Horizontal Scaling (100K+ users)

#### 4.1 Load Balancing

**Architecture**
```
                      ┌─────────────┐
                      │   Nginx LB  │
                      └─────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
    ┌─────────┐       ┌─────────┐       ┌─────────┐
    │ Edge    │       │ Edge    │       │ Edge    │
    │ Func #1 │       │ Func #2 │       │ Func #3 │
    └─────────┘       └─────────┘       └─────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                      ┌─────────────┐
                      │  Shared DB  │
                      │  + Redis    │
                      └─────────────┘
```

**Configuration**
```nginx
upstream edge_functions {
  least_conn;
  server edge1.example.com;
  server edge2.example.com;
  server edge3.example.com;
  
  keepalive 32;
}

server {
  listen 443 ssl http2;
  
  location /functions/ {
    proxy_pass http://edge_functions;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
  }
}
```

#### 4.2 Message Queue for AI Requests

**Benefits**
- Decouple request handling from AI processing
- Handle traffic spikes gracefully
- Retry failed requests automatically
- Monitor queue depth for scaling

**Implementation with BullMQ**
```typescript
// server/queue.ts
import { Queue, Worker } from 'npm:bullmq';

const aiQueue = new Queue('ai-requests', {
  connection: { host: 'redis.example.com', port: 6379 }
});

// Producer (API endpoint)
app.post('/chat/stream', async (c) => {
  const job = await aiQueue.add('generate', {
    chatId,
    message,
    models,
    userId,
  });
  
  return c.json({ jobId: job.id });
});

// Consumer (separate worker process)
const worker = new Worker('ai-requests', async (job) => {
  const { chatId, message, models, userId } = job.data;
  
  const responses = await Promise.all(
    models.map(model => callAIModel(model, message))
  );
  
  await saveResponsesToDatabase(chatId, responses);
  await notifyUser(userId, chatId); // WebSocket or SSE
}, {
  connection: { host: 'redis.example.com', port: 6379 }
});
```

### Phase 5: Microservices Architecture (1M+ users)

#### 5.1 Service Decomposition

```
┌──────────────────────────────────────────────────────────┐
│                     API Gateway                          │
│              (Authentication, Routing)                   │
└──────────────────────────────────────────────────────────┘
                          │
    ┌─────────────────────┼──────────────────────┐
    │                     │                      │
    ▼                     ▼                      ▼
┌─────────┐         ┌──────────┐          ┌──────────┐
│  Auth   │         │   Chat   │          │    AI    │
│ Service │         │ Service  │          │ Service  │
│         │         │          │          │          │
│ - Login │         │ - CRUD   │          │ - Groq   │
│ - Signup│         │ - History│          │ - Gemini │
└─────────┘         └──────────┘          └──────────┘
     │                   │                      │
     └───────────────────┴──────────────────────┘
                         │
                    ┌────────┐
                    │ Event  │
                    │  Bus   │
                    │(Kafka) │
                    └────────┘
```

**Service Definitions**

**Auth Service**
- User registration/login
- JWT token generation
- Session management
- OAuth integrations

**Chat Service**
- Chat CRUD operations
- Message history
- Search functionality
- Export features

**AI Service**
- Model orchestration
- Response streaming
- Token counting
- Usage analytics

**Benefits**
- Independent scaling per service
- Technology flexibility
- Fault isolation
- Team autonomy

---

## Performance Optimizations

### Frontend Optimizations

#### 1. Code Splitting
```typescript
// Lazy load heavy components
const ChatWindow = lazy(() => import('./components/ChatWindow'));
const ChatSidebar = lazy(() => import('./components/ChatSidebar'));
```

#### 2. Virtual Scrolling for Messages
```typescript
// For chats with 1000+ messages
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={100}
>
  {({ index, style }) => (
    <div style={style}>
      <ChatMessage message={messages[index]} />
    </div>
  )}
</FixedSizeList>
```

#### 3. Optimize Re-renders
```typescript
// Memoize expensive components
const ChatMessage = memo(({ message }) => {
  // ...
}, (prev, next) => prev.message.id === next.message.id);
```

### Backend Optimizations

#### 1. Database Connection Pooling
```typescript
const pool = new Pool({
  max: 20, // maximum pool size
  min: 5,  // minimum pool size
  idleTimeoutMillis: 30000,
});
```

#### 2. Batch API Requests
```typescript
// Instead of sequential calls
const responses = await Promise.all([
  callGroqAPI(messages),
  callGeminiAPI(messages),
]);
```

#### 3. Response Compression
```typescript
import { compress } from 'npm:hono/compress';

app.use('*', compress());
```

---

## Monitoring & Observability

### Key Metrics to Track

#### Application Metrics
```typescript
// Track in real-time
- Request rate (requests/second)
- Error rate (errors/total requests)
- Response time (p50, p95, p99)
- Active users
- Concurrent connections
```

#### AI Metrics
```typescript
- AI API latency per model
- Token usage per request
- API error rates
- Cost per conversation
- Average response time
```

#### Business Metrics
```typescript
- Daily active users (DAU)
- Monthly active users (MAU)
- Average messages per user
- User retention rate
- Feature adoption rate
```

### Monitoring Stack

**Recommended Tools**
```
1. Application Performance Monitoring (APM)
   - Datadog
   - New Relic
   - Sentry (error tracking)

2. Logging
   - CloudWatch Logs
   - Elasticsearch + Kibana
   - Grafana Loki

3. Metrics
   - Prometheus + Grafana
   - CloudWatch Metrics
   
4. Alerting
   - PagerDuty
   - Opsgenie
   - Slack webhooks
```

---

## Security Hardening

### API Security

#### 1. Request Signing
```typescript
// Verify request authenticity
const signature = hmacSHA256(requestBody, SECRET_KEY);
if (signature !== requestHeader['X-Signature']) {
  throw new Error('Invalid signature');
}
```

#### 2. API Key Rotation
```typescript
// Implement key rotation
const API_KEYS = {
  current: Deno.env.get('GROQ_API_KEY'),
  previous: Deno.env.get('GROQ_API_KEY_PREV'),
};
```

#### 3. Content Security Policy
```typescript
app.use('*', async (c, next) => {
  await next();
  c.header('Content-Security-Policy', 
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
  );
});
```

### Data Security

#### 1. Encryption at Rest
```sql
-- Enable PostgreSQL encryption
ALTER DATABASE chatdb SET encrypt = true;
```

#### 2. Sensitive Data Masking
```typescript
// Mask sensitive info in logs
const logMessage = message.replace(
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  '***@***.***'
);
```

---

## Disaster Recovery

### Backup Strategy

```typescript
// Automated daily backups
1. Database snapshots (retain 30 days)
2. Configuration backups
3. User data exports
4. Chat history archives
```

### Recovery Procedures

```
RPO (Recovery Point Objective): < 1 hour
RTO (Recovery Time Objective): < 15 minutes

1. Database Restore: 5 minutes
2. Service Deployment: 5 minutes
3. Verification: 5 minutes
```

---

## Cost Optimization

### Current Cost Structure
```
Supabase: $0-25/month (free tier + scaling)
Groq API: ~$0.10 per 1M tokens
Gemini API: ~$0.25 per 1M tokens
Edge Functions: ~$0.40 per 1M requests
```

### Optimization Strategies

1. **Smart Caching**: Reduce duplicate API calls by 60%
2. **Response Truncation**: Limit max tokens to reduce costs
3. **Model Selection**: Use cheaper models for simple queries
4. **Batch Processing**: Group requests to reduce overhead

---

## Deployment Strategy

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm test
      - run: npm run build
      - run: supabase functions deploy
```

### Blue-Green Deployment

```
1. Deploy to "green" environment
2. Run smoke tests
3. Switch traffic from "blue" to "green"
4. Monitor for issues
5. Keep "blue" as rollback option
```

---

## Conclusion

This architecture is designed to scale from prototype to production:

- **0-1K users**: Current implementation (KV store + Edge functions)
- **1K-10K users**: Migrate to relational DB + add caching
- **10K-100K users**: Add Redis + load balancing
- **100K-1M users**: Message queues + horizontal scaling
- **1M+ users**: Microservices architecture

Each phase builds on the previous one, allowing for incremental scaling without major rewrites.
