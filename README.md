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

## 🚨 Production Gaps (Brutally Honest)
1. **No Queue System**: Sudden traffic spikes will hit the Express event loop hard; needs **BullMQ**.
2. **Local File Storage**: PDF uploads live on the server disk; needs migration to **AWS S3**.
3. **No Circuit Breaker**: If Gemini is down, the system still tries to call it; needs **Hystrix** pattern.
4. **Testing**: Lacks high-coverage E2E testing for the streaming chunks.

---

---

## 📈 Scalability Considerations
The platform is built to handle millions of users with horizontal scalability in mind:
- **Pagination**: All history endpoints implement skip-based pagination to prevent memory exhaustion.
- **Stateless JWT Auth**: Removed server-side sessions, allowing the backend to be replicated across N server instances without sync issues.
- **Pluggable AI Models**: Highly modular service architecture; adding new models like OpenAI or DeepSeek requires zero changes to core orchestrator logic.
- **Redis Distrubuted State**: Rate limiting and caching are backed by Redis, ensuring global consistency across the cluster.

## ⚠️ Known Limitations
Currently uses local storage for file uploads for simplicity. In production, this should be replaced with cloud storage solutions like AWS S3 or Google Cloud Storage to support stateless horizontal scaling.

---

## 🧪 Setup Instructions
1. `cd backend && npm install`
2. Configure `.env` (Use the provided `config.js` for mandatory keys).
3. `npm run dev` (Starts backend on 5001).
4. `cd .. && npm install && npm run dev` (Starts frontend).

---

## 🎯 30-Second Interview Answer
"I built a production-ready AI orchestration platform that handles parallel streaming from multiple providers like Gemini and Groq. Beyond just UI, I focused on solving **Real-World AI challenges**: implementing an AbortController pipeline to prevent runaway API costs, a fail-open Redis caching layer to handle high-traffic chat switching, and a robust Zod-validated middleware to ensure strict input safety. My goal was to create a system that isn't just a wrapper, but a scalable, observable gateway for AI services."
