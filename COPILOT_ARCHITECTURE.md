# GTIXT Copilot v2 - System Architecture & Data Flow

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE (React)                              │
│                  /app/admin/copilot/page.tsx (597 lines)                    │
├──────────────────────────────────────────────────────────────────────────────┤
│  • Message history display         • Model selector dropdown                │
│  • Input text area                 • Action buttons panel                   │
│  • API key configuration           • System context display                 │
│  • Session management              • Response streaming readiness           │
└─────────────────────┬──────────────────────────────────────────────────────┘
                      │ HTTP POST /api/admin/copilot
                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                   API ENDPOINT (Next.js App Router)                         │
│              /app/api/admin/copilot/route.ts (578 lines)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────── REQUEST HANDLER ───────────┐                                 │
│  │ • Rate limiting check                 │                                 │
│  │ • Token quota validation              │                                 │
│  │ • Request authentication              │                                 │
│  │ • IP address tracking                 │                                 │
│  └───────────────────┬───────────────────┘                                 │
│                      │                                                       │
│  ┌─────────── ACTION DETECTION ─────────┐                                  │
│  │ • Parse message content               │                                 │
│  │ • buildActions() analyzes keywords    │                                 │
│  │ • Suggest relevant tools              │                                 │
│  │ • Handle direct action invocation     │                                 │
│  └───────────────────┬───────────────────┘                                 │
│                      │                                                       │
│  ┌─────────── TOOL EXECUTION ───────────┐                                  │
│  │ case 'domain_verify'       ──► CopilotTools.verifyDomain()             │
│  │ case 'page_analyze'        ──► CopilotTools.analyzePage()              │
│  │ case 'system_health'       ──► CopilotTools.getSystemHealth()          │
│  │ case 'data_quality'        ──► CopilotTools.assessDataQuality()        │
│  │ case 'read_file'           ──► sandboxManager.readFile()               │
│  │ case 'write_file'          ──► sandboxManager.writeFile()              │
│  │ Plus: list_files, generate_diff, etc.                                  │
│  └───────────────────┬───────────────────┘                                 │
│                      │                                                       │
│  ┌─── CONTEXT ENRICHMENT PIPELINE ────┐                                    │
│  │ 1. Fetch live system metrics       │                                    │
│  │    ├─ ActiveCrawls, FailedJobs     │                                    │
│  │    ├─ FirmStats, Errors            │                                    │
│  │    └─ HealthStatus (OK/warning)    │                                    │
│  │                                    │                                     │
│  │ 2. Retrieve session memory         │                                    │
│  │    ├─ Recent user messages         │                                    │
│  │    ├─ Recent AI responses          │                                    │
│  │    └─ Extracted topics             │                                    │
│  │                                    │                                     │
│  │ 3. Generate dynamic prompt         │                                    │
│  │    ├─ Embed domain expertise       │                                    │
│  │    ├─ Inject real-time metrics     │                                    │
│  │    └─ Mode selection (conv/ops)    │                                    │
│  │                                    │                                     │
│  │ 4. Build message history           │                                    │
│  │    ├─ System prompt                │                                    │
│  │    ├─ Recent context               │                                    │
│  │    ├─ Conversation history (last 5)│                                    │
│  │    └─ Current user message         │                                    │
│  │                                    │                                     │
│  │ 5. Inject into AI model            │                                    │
│  └───────────────────┬───────────────────┘                                 │
│                      │                                                       │
│  ┌─── AI MODEL SELECTION ────────────┐                                     │
│  │ If ('ollama')                     │                                     │
│  │ ├─► callOllamaAPI()               │                                     │
│  │ │   └─► HTTP POST to localhost:11434/api/chat                          │
│  │ └─► Fallback: buildFallbackResponse()                                   │
│  │                                   │                                      │
│  │ If ('openai' || 'gpt-5')          │                                     │
│  │ ├─► openai.chat.completions.create()                                   │
│  │ │   • temperature: 0.6 (normal) / 0.8 (agent)                          │
│  │ │   • max_tokens: 2000                                                 │
│  │ │   • presence_penalty: 0.2                                            │
│  │ │   • frequency_penalty: 0.3                                           │
│  │ └─► Fallback: buildFallbackResponse()                                   │
│  └───────────────────┬───────────────────┘                                 │
│                      │                                                       │
│  ┌─── MEMORY MANAGEMENT ────────────┐                                      │
│  │ memoryManager.addMessage()        │                                      │
│  │ ├─ Store user message            │                                      │
│  │ ├─ Track tokens used             │                                      │
│  │ └─ Auto-extract topics           │                                      │
│  │                                  │                                       │
│  │ memoryManager.addMessage()        │                                      │
│  │ ├─ Store AI response             │                                      │
│  │ ├─ Track tokens used             │                                      │
│  │ └─ Update session metadata       │                                      │
│  └───────────────────┬───────────────────┘                                 │
│                      │                                                       │
│  ┌────── AUDIT LOGGING ──────────┐                                         │
│  │ auditLogger.logCopilotAction() │                                         │
│  │ ├─ Action type                 │                                         │
│  │ ├─ Input message               │                                         │
│  │ ├─ Response output             │                                         │
│  │ ├─ Tools suggested             │                                         │
│  │ ├─ Model used                  │                                         │
│  │ └─ Timestamp, user, IP         │                                         │
│  └───────────────────┬───────────────────┘                                 │
│                      │                                                       │
│  ┌────── METRICS & QUOTAS ───────┐                                         │
│  │ copilotRequestsTotal.inc()     │                                         │
│  │ copilotTokensUsed.inc()        │                                         │
│  │ copilotRequestDuration measure │                                         │
│  │ trackTokenUsage() for quota    │                                         │
│  └───────────────────┬───────────────────┘                                 │
│                      │                                                       │
│  ┌────── RESPONSE FORMATTING ────┐                                         │
│  │ {                              │                                         │
│  │   success: boolean             │                                         │
│  │   response: string             │                                         │
│  │   actions: Tool[]              │                                         │
│  │   model: string                │                                         │
│  │   tokensUsed: number           │                                         │
│  │   sandboxMode: boolean         │                                         │
│  │ }                              │                                         │
│  └───────────────────┬───────────────────┘                                 │
└──────────────────────┼─────────────────────────────────────────────────────┘
                       │ HTTP 200 JSON Response
                       ▼
        ┌──────────────────────────────┐
        │  BROWSER (React Component)   │
        │  • Display response          │
        │  • Show action buttons       │
        │  • Update chat history       │
        │  • Add to localStorage       │
        └──────────────────────────────┘
```

---

## 🔄 Data Flow - Natural Language to Result

```
         ┌─────────────────────────────────────────┐
         │ User Input: "Check domain status"       │
         └────────────────┬────────────────────────┘
                          │
        [1] Parse & Detect Keywords
                ↓
         ┌─────────────────────────────────────────┐
         │ Keywords found: "domain", "status"      │
         │ → Triggers: domain_verify, system_health│
         └────────────────┬────────────────────────┘
                          │
        [2] Fetch Real-Time Context
                ↓
         ┌─────────────────────────────────────────┐
         │ CopilotTools.getSystemHealth()          │
         │ → Returns: 228 firms, 0 failed jobs     │
         │ → Status: OK                            │
         └────────────────┬────────────────────────┘
                          │
        [3] Retrieve Session Memory
                ↓
         ┌─────────────────────────────────────────┐
         │ memoryManager.getMemory(sessionId)      │
         │ → Recent messages (last 3)              │
         │ → Extracted topics: domain, firms       │
         └────────────────┬────────────────────────┘
                          │
        [4] Generate Dynamic Prompt
                ↓
    ┌────────────────────────────────────────────────────┐
    │ generateSystemPrompt({                             │
    │   systemStatus: "System operational",              │
    │   activeCrawls: 0,                                 │
    │   totalFirms: 228,                                 │
    │   failedJobs: 0,                                   │
    │   recentErrors: []                                 │
    │ })                                                 │
    │ ↓                                                  │
    │ Generates: 800+ line ultra-powerful prompt         │
    │ • Elite identity                                   │
    │ • GTIXT expertise embedded                         │
    │ • Real-time metrics injected                       │
    │ • Response guidelines                              │
    └────────────────┬─────────────────────────────────┘
                     │
        [5] Build Message Array
                ↓
    ┌────────────────────────────────────────────────────┐
    │ messages = [                                       │
    │   {role: "system", content: "ULTRA-PROMPT..."},   │
    │   {role: "system", content: "MEMORY_CONTEXT..."},  │
    │   {role: "user", content: "Check domain status"},  │
    │ ]                                                  │
    └────────────────┬─────────────────────────────────┘
                     │
        [6] Send to AI Model
                ↓
    ┌────────────────────────────────────────────────────┐
    │ if (selectedModel === 'ollama')                    │
    │   callOllamaAPI(messages, 'llama3.2:1b')          │
    │ else                                               │
    │   openai.chat.completions.create({...})           │
    └────────────────┬─────────────────────────────────┘
                     │ HTTP POST to AI Backend
                     ▼
    ┌────────────────────────────────────────────────────┐
    │ AI Model Processing                                │
    │ • Reads ultra-powered system prompt                │
    │ • Understands GTIXT domain context                 │
    │ • Sees real-time metrics                           │
    │ • References conversation memory                   │
    │ • Generates contextual response                    │
    └────────────────┬─────────────────────────────────┘
                     │ Response Token Stream
                     ▼
        [7] Process Response
                ↓
    ┌────────────────────────────────────────────────────┐
    │ response = "Domain status looks good.              │
    │ You have 228 firms (all active).                   │
    │ System is operational with no issues.              │
    │ No failed jobs to investigate."                    │
    │                                                    │
    │ actions = [                                        │
    │   {type: "domain_verify", ...},                    │
    │   {type: "system_health", ...}                     │
    │ ]                                                  │
    └────────────────┬─────────────────────────────────┘
                     │
        [8] Store in Memory
                ↓
    ┌────────────────────────────────────────────────────┐
    │ memoryManager.addMessage(sessionId, 'user', ...)   │
    │ memoryManager.addMessage(sessionId, 'assistant'...)│
    │ → Topics auto-extracted: ['domain', 'status']      │
    │ → Tokens counted and tracked                       │
    │ → Session metadata updated                         │
    └────────────────┬─────────────────────────────────┘
                     │
        [9] Audit Logger
                ↓
    ┌────────────────────────────────────────────────────┐
    │ auditLogger.logCopilotAction(...)                  │
    │ → Logs all details for compliance                  │
    │ → Traceable to user and time                       │
    │ → Includes input/output and tools used             │
    └────────────────┬─────────────────────────────────┘
                     │
        [10] Return Response
                ↓
    ┌────────────────────────────────────────────────────┐
    │ NextResponse.json({                                │
    │   success: true,                                   │
    │   response: "Domain status looks good...",         │
    │   actions: [{type: "domain_verify"}, ...],         │
    │   model: "ollama:llama3.2:1b",                     │
    │   tokensUsed: 245                                  │
    │ })                                                 │
    └────────────────┬─────────────────────────────────┘
                     │ HTTP Response
                     ▼
         ┌─────────────────────────────────┐
         │ Browser Receives Response       │
         │ • Display AI response           │
         │ • Show action button options    │
         │ • Add to chat history           │
         │ • Update localStorage           │
         │ • Ready for next message        │
         └─────────────────────────────────┘
```

---

## 🗺️ Internal Tools Architecture

```
                    CopilotTools Class
                         (static)
                            │
            ┌───────────────┼───────────────┐
            │               │               │
       ┌────▼────┐     ┌────▼────┐     ┌──▼──────┐
       │verifyDOM│     │analyzePa│     │getSystem│
       │ain()    │     │ge()      │     │Health() │
       └────┬────┘     └────┬────┘     └──┬──────┘
            │               │              │
     ┌──────▼──────┐  ┌─────▼──────┐ ┌───▼───────┐
     │ ASIC Lookup │  │HTML Parser │ │DB Queries │
     │ ABN Registry│  │Metadata    │ │System     │
     │ GTIXT DB    │  │Structure   │ │Metrics    │
     │            │  │Content     │ │           │
     └──────┬──────┘  └─────┬──────┘ └───┬───────┘
            │               │              │
     Returns:         Returns:        Returns:
     • Domain         • Title         • Crawls
     • ASIC Status    • Description   • Jobs
     • Licence        • Keywords      • Firms
     • Firm Record    • Structure     • Errors
                      • Quality       • Health
                      • Links Count   • Status
                      • Scripts Count

                    ┌──────────────────┐
                    │data_quality()    │
                    │(assessmentTool)  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │Prisma Queries    │
                    │• Evidence Count  │
                    │• Verified %      │
                    │• Confidence Dist │
                    │• Staleness       │
                    └────────┬─────────┘
                             │
                    Returns:
                    • Total Evidence
                    • Verification Rate
                    • Quality Rating
                    • Stale Count
```

---

## 🧠 Memory Management Architecture

```
       MemoryManager Instance
              (singleton)
                  │
    ┌─────────────┴─────────────┐
    │                           │
Memory Map:           Methods:
key: sessionId    ┌─ createSession()
val: ConversationMemory
    │            ├─ addMessage()
    ├─ s1:Mem1   │
    ├─ s2:Mem2   ├─ getMemory()
    ├─ s3:Mem3   │
    └─ sN:MemN   ├─ getRecentContext()
                 │
    ConversationMemory = {  ├─ extractTopics()
      sessionId,           │
      userId,              └─ (internal utilities)
      messages: [
        {
          role: 'user',
          content: "Check domain",
          timestamp: Date,
          tokens: 120
        },
        {
          role: 'assistant',
          content: "Domain verified...",
          timestamp: Date,
          tokens: 240
        }
      ],
      topics: ['domain', 'verify'],
      metadata: {
        createdAt: Date,
        lastUpdated: Date,
        model: 'ollama:llama3.2:1b',
        totalTokens: 360
      }
    }

    Data Flow (per message):
    ┌──────────────────────────────┐
    │ User sends message           │
    └────────────┬─────────────────┘
                 │
    ┌────────────▼─────────────┐
    │ memoryManager.addMessage()│
    │ • Creates message object │
    │ • Calculates tokens      │
    │ • Adds to messages array │
    └────────────┬─────────────┘
                 │
    ┌────────────▼──────────────────┐
    │ extractTopics()               │
    │ • Parse content               │
    │ • Find keywords:              │
    │   - crawl, score, audit       │
    │   - firm, domain, health      │
    │   - job, error, patch, deploy │
    │ • Add to topics array         │
    └────────────┬──────────────────┘
                 │
    ┌────────────▼──────────────────┐
    │ Update metadata               │
    │ • lastUpdated = now           │
    │ • totalTokens += msgTokens    │
    └────────────┬──────────────────┘
                 │
    ┌────────────▼──────────────────┐
    │ Memory Ready for Retrieval    │
    │ • getRecentContext(5) returns │
    │   last 5 messages formatted   │
    │ • Used in next prompt gen     │
    └──────────────────────────────┘
```

---

## 📊 Request Processing Timeline

```
      User sends message
            │
      [0ms] ▼
      ┌─ Parse request
      │  Validate auth
      │  Check rate limit
      │  Extract params
      │
      [5ms] ▼
      ├─ Fetch system metrics
      │  (DB queries)
      │
      [50ms] ▼
      ├─ Retrieve session memory
      │
      [60ms] ▼
      ├─ Generate system prompt
      │  (CPU-bound, fast)
      │
      [65ms] ▼
      ├─ Build message array
      │  (Format context)
      │
      [70ms] ▼
      ├─ Send to AI model
      │  (Network request)
      │
      [1000ms] ▼ (Ollama response)
             or
      [2000ms] ▼ (OpenAI response)
      ├─ Receive response
      │  Parse response
      │  Count tokens
      │
      [2100ms] ▼
      ├─ Add to memory
      │  Extract topics
      │  Update metadata
      │
      [2110ms] ▼
      ├─ Log to audit trail
      │
      [2115ms] ▼
      ├─ Track metrics
      │
      [2120ms] ▼
      └─ Return JSON response
            │
      Response sent to browser
      Total latency: ~2.1 seconds (Ollama)
                or ~2.5 seconds (OpenAI)
```

---

## 🔐 Security Layers

```
                 User Request
                      │
            ┌─────────▼─────────┐
            │ Authentication    │
            │ Check JWT/session │
            └─────────┬─────────┘
                      │
            ┌─────────▼─────────┐
            │ Rate Limiting     │
            │ 50 req/hour limit │
            └─────────┬─────────┘
                      │
            ┌─────────▼─────────┐
            │ Token Quota       │
            │ Daily max enforced│
            └─────────┬─────────┘
                      │
            ┌─────────▼─────────┐
            │ Input Validation  │
            │ Sanitize message  │
            │ Validate params   │
            └─────────┬─────────┘
                      │
            ┌─────────▼─────────┐
            │ IP Tracking       │
            │ Log for audit     │
            └─────────┬─────────┘
                      │
            ┌─────────▼─────────┐
            │ Sandbox Checks    │
            │ File ops isolated │
            └─────────┬─────────┘
                      │
            ┌─────────▼─────────┐
            │ Audit Logging     │
            │ Full trail record │
            └─────────┬─────────┘
                      │
                    Request Processed Securely
```

---

## 📦 Dependencies

```
Core Dependencies:
├─ next (13.5.6)              ← Framework
├─ react (18.x)               ← UI library
├─ typescript (5.x)           ← Language
├─ prisma (6.19.2)            ← Database ORM
├─ openai (latest)            ← OpenAI API
├─ node-fetch (implicit)      ← HTTP client
└─ prom-client               ← Metrics

Custom Modules:
├─ lib/copilot-engine.ts     ← Copilot logic
├─ lib/copilot-context.ts    ← System state
├─ lib/audit-logger.ts       ← Audit trail
├─ lib/rate-limit.ts         ← Rate limiting
├─ lib/metrics.ts            ← Prometheus metrics
├─ lib/sandbox-manager.ts    ← File operations
└─ lib/path-guard.ts         ← Path validation

External Services:
├─ Ollama API (localhost:11434)  ← Local AI
├─ OpenAI API (optional)         ← GPT-4
├─ PostgreSQL Database           ← Data store
├─ Redis (optional)              ← Caching
└─ MinIO (optional)              ← Object storage
```

---

## 🎯 Complete Integration Summary

```
          HTTP Request
              │
        API Router (/copilot)
              │
        ┌─────┴──────┬──────────┬──────────┐
        │            │          │          │
    Memory      Context      Tools      Prompt
    Manager     Builder      Executor   Engine
        │            │          │          │
        ├─ Store     ├─ Fetch  ├─ Domain  ├─ Generate
        │ msg       │ metrics │ verify   │ dynamic
        ├─ Retrieve├─ Inject ├─ Page    ├─ State
        │ context  │ state   │ analyze  │ aware
        └─ Topics  └─ Build  ├─ Health  ├─ GTIXT
                        msg  ├─ Quality │ aware
                        array└─ Execute ├─ Two
                            result      │ mode
                                        └─ Rich
                                          params
        │            │          │          │
        └─────┬───────┴──────────┴─────────┘
              │
        AI Model (Ollama/OpenAI)
              │
        Response Tokens
              │
        Response Factory
              │
        JSON Response
              │
        User Browser
```

This completes the comprehensive architecture visualization of the newly optimized GTIXT Copilot system!

