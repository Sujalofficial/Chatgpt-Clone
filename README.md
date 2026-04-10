# 🚀 Synapse AI: Production-Grade Multi-Model Orchestration Platform

### 🚀 One-Line Pitch
A high-performance, full-stack AI orchestration platform featuring parallel SSE streaming, multi-model contextual isolation, and robust cost/observability controls.

---

## 🧠 Problem Statement
Standard AI interfaces are often single-provider and opaque. Developers and power users face **"Model Lock-in"** and find it difficult to benchmark responses (e.g., Gemini vs. Llama) side-by-side. Additionally, most prototypes lack **cost-control** (disconnecting doesn't stop generating) and **context-isolation** (chat history bleeding into document analysis), making them unreliable for professional use.

---

## 🏗️ System Architecture

### End-to-End Data Flow
1. **Request**: User triggers a prompt. **Zustand** store handles local state.
2. **Gateway**: Request hits Express backend. **Zod Middleware** validates schema/types.
3. **Security**: **JWT/Supabase** verifies identity. **Redis** checks the user's per-second rate limit.
4. **Quota**: **MongoDB** check ensures the user hasn't exceeded daily token/request limits (Fail-Open).
5. **AI Orchestration**: Backend initiates parallel streams to **Gemini SDK** and **Groq SDK**.
6. **Streaming**: Tokens are piped via **SSE (Server-Sent Events)** for real-time UI updates.
7. **Persistence**: Upon stream completion, chat history and usage metrics are updated asynchronously.

### Stack
- **Frontend**: React 18, Zustand (State), Tailwind CSS (UI), Lucide (Icons).
- **Backend**: Node.js, Express, Pino (Logging), Sentry (Monitoring).
- **Storage**: MongoDB (History/Quotas), Redis (Caching/Rate Limiting).
- **Intelligence**: Google Gemini Pro, Groq (Llama 3.3).

---

## 🧩 Backend Architecture
Built with a modular "Service-Layer" pattern to ensure horizontal scalability:
- **Controllers**: Handle HTTP-SSE request/response lifecycle.
- **Services**: Isolated logic for each AI provider (Gemini, Groq) and Document Processing (PDF/Images).
- **Middleware**: Intercepts requests for Validation, Auth, Quota enforcement, and Request Logging.
- **Utils**: Reusable helpers for Redis connectivity, SSE formatting, and structured Pino logging.

---

## 🔥 Key Engineering Highlights

### 1. Multi-Model Parallel Streaming
Uniquely designed to fetch from N providers simultaneously. The frontend store manages isolated "Columns" for each model, ensuring responses don't collide.

### 2. AbortController Cost Optimization
Implemented a full-stack abortion lifecycle. If a user closes the tab or stops a generation:
`Frontend Abort` → `Backend Request Close` → `AI SDK AbortController`.
This prevents **"Zombie Streams"** which generate and bill for tokens that are never displayed.

### 3. Redis-Backed Caching & Limiting
- **Caching**: Chat lookups are cached to prevent heavy MongoDB joins on every click.
- **Rate Limiting**: Uses a distributed Redis store to track user spamming across multiple server instances.

---

## 🧠 Engineering Decisions & Tradeoffs

| Choice | WHY? | Tradeoff |
| :--- | :--- | :--- |
| **SSE over WebSockets** | Lighter, unidirectional, and auto-handles reconnections. Perfect for AI tokens. | Lower flexibility for full-duplex communication (e.g. collaborative editing). |
| **Zustand over Redux** | Atomic state updates with zero-boilerplate. Sub-50ms HMR and fast renders during streams. | Smaller ecosystem of middleware compared to Redux Toolkit. |
| **Columnar Chat Design** | Easier to implement side-by-side comparison and "Merge-Chronological" logic in UI. | Increased database document size as the conversation grows. |
| **Fail-Open Quotas** | If the Quota DB/Redis is slow, we allow the request to pass to prioritize User Experience. | Risk of small usage leaks during DB downtime. |

---

## 💥 Real Problems Faced + Fixes

- **Problem 1: Runaway Costs on Disconnect**
  - *Root Cause*: SSE connections were staying open on the backend even if the client closed the tab.
  - *Fix*: Hooked into `req.on('close')` to broadcast an `AbortController.abort()` signal to the AI SDKs.
- **Problem 2: 500 Errors on Empty States**
  - *Root Cause*: Zod validation was rejecting `null` values for optional metadata (PDF text/Chat ID).
  - *Fix*: Optimized Zod schema with `.nullable().optional()` to align with frontend's empty-state transmission.
- **Problem 3: Gemini Quota "Stalls"**
  - *Root Cause*: Gemini Free Tier has aggressive rate limits (15 RPM).
  - *Fix*: Implemented a Recursive Retry Service with exponential backoff and model-swapping (Flash -> Pro).

---

## ⚠️ Failure Scenarios & Handling
- **Redis Fails**: System ignores cache/rate-limit and falls back to MongoDB/Memory (Fail-Open).
- **AI Timeout**: Backend catches the `NoOutputGenerated` error, logs to Sentry, and sends a formatted SSE error token to the UI.
- **Client Disconnect**: Backend detects socket closure and kills the AI token generation loop immediately.

---

## 💸 Cost Control Strategy
- **Daily Usage Quotas**: Strictly tracks `requestCount` and `tokenEstimate` per user in MongoDB.
- **Token Heuristics**: Calculates usage based on character length/4 to provide real-time billing estimates without expensive tokenizer overhead.

---

---

## 📈 Scale & Performance Architecture
Synapse AI is engineered for high-concurrency environments and horizontal scalability:
- **Stateless JWT Auth**: Eliminated server-side sessions to enable a truly stateless horizontal scaling across multiple server instances.
- **Distributed Rate Limiting**: Redis-backed global rate limiting ensures system-wide stability and cost protection.
- **Advanced Pagination**: Implemented optimized skip-based pagination for history and search, ensuring sub-50ms response times even with millions of records.
- **Modular AI Orchestration**: A service-layer abstraction that allows for plug-and-play addition of new LLMs with zero core logic changes.

### 🚀 Future Scaling Roadmap
To support enterprise-level growth (1M+ DAU), the following architectural upgrades are architected into the roadmap:
1. **Asynchronous Task Processing**: Transitioning heavy document analysis (PDF/images) to **BullMQ** or **RabbitMQ** to offload the main event loop.
2. **Cloud-Native Storage Strategy**: Migrating from local disk to **AWS S3** or **Google Cloud Storage** using the existing `storageService` abstraction layer.
3. **Global Edge Distribution**: Utilizing **Edge Computing (Cloudflare Workers)** to handle initial authentication and rate-limiting closer to the user.
4. **Database Clustering**: Shifting from a single MongoDB instance to a **Sharded Cluster** to handle massive write-throughput of chat histories.

---

## 🏗️ Setup Instructions
1. `cd backend && npm install`
2. Configure `.env` (Use the provided `config.js` for mandatory keys).
3. `npm run dev` (Starts backend on 5001).
4. `cd frontend && npm install && npm run dev` (Starts the React frontend).

---

---

## 🏛️ Project Philosophy
Synapse AI was engineered not just as a ChatGPT wrapper, but as a **Production-Ready AI Gateway**. The development focused on solving the three critical "Day 2" problems of AI applications:
- **Cost Integrity**: Utilizing a full-stack `AbortController` pipeline to immediately terminate cloud token generation upon client disconnect, preventing runaway API costs.
- **System Observability**: Implementing structured logging with **Pino** and error tracking with **Sentry** to monitor stream health and provider latency.
- **Resilient Scalability**: A stateless authentication architecture combined with **Redis-backed** rate limiting and caching ensures the system remains performant under high-concurrency loads.

---
