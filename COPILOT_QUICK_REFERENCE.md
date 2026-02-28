# GTIXT Copilot - Quick Start Guide

## 🚀 Getting Started

The copilot is now **ultra-powered** with new tools and capabilities. Here's how to use them:

---

## 1️⃣ Natural Language Usage (Easiest)

Just ask questions naturally - the copilot detects what you need automatically:

### Domain Verification
```
User: "Check if example.com.au is registered"
User: "Verify ABN 12345678999"
User: "What's the company status?"

→ Copilot automatically suggests domain_verify tool
→ Fetches ASIC data and checks GTIXT database
```

### Page Analysis
```
User: "Analyze their website"
User: "Extract metadata from the about page"
User: "What does their site contain?"

→ Copilot automatically suggests page_analyze tool
→ Extracts content, structure, and metadata
```

### System Health
```
User: "What's the system status?"
User: "Run a health check"
User: "Any issues right now?"

→ Copilot automatically suggests system_health tool
→ Returns live metrics for crawls, jobs, firms
```

### Data Quality
```
User: "Check data quality"
User: "How verified is our evidence?"
User: "Assess firm ABC123"

→ Copilot automatically suggests data_quality tool  
→ Returns verification rates and confidence levels
```

---

## 2️⃣ Direct Tool Invocation (For API Integration)

### Call system_health directly
```bash
curl -X POST http://localhost:3000/api/admin/copilot \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 127.0.0.1" \
  -d '{
    "action": {
      "type": "system_health"
    }
  }'
```

### Call domain_verify directly
```bash
curl -X POST http://localhost:3000/api/admin/copilot \
  -H "Content-Type: application/json" \
  -d '{
    "action": {
      "type": "domain_verify",
      "params": {
        "domain": "example.com.au",
        "abn": "12345678999"
      }
    }
  }'
```

### Call page_analyze directly
```bash
curl -X POST http://localhost:3000/api/admin/copilot \
  -H "Content-Type: application/json" \
  -d '{
    "action": {
      "type": "page_analyze",
      "params": {
        "url": "https://example.com/about"
      }
    }
  }'
```

### Call data_quality directly
```bash
curl -X POST http://localhost:3000/api/admin/copilot \
  -H "Content-Type: application/json" \
  -d '{
    "action": {
      "type": "data_quality",
      "params": {
        "firmId": "firm-123"
      }
    }
  }'
```

---

## 3️⃣ Conversation Memory (Automatic)

The copilot **remembers your conversation** automatically. No need to repeat context:

```
Chat Session:
─────────────

You: "I ran a crawl on TechCorp"
Copilot: "How did it go?"

You: "It failed with a timeout"
Copilot: "Ah, the TechCorp crawl timed out. 
         Let me help you troubleshoot..."
         
(No need to repeat "TechCorp" - I remember!)

You: "What should I do?"
Copilot: "Based on that timeout, here are options:
         1. Increase timeout to 30s
         2. Check network connectivity
         3. Review crawl logs"
         
(Context automatically included from memory!)
```

---

## 4️⃣ Response Modes

### Conversational Mode (Default)
```
You: "Hi"
→ "Hey Midou! What's on your mind?"
(Natural, no system noise)
```

### Operational Mode (Automatic)
```
You: "Patch the auth endpoint"
→ "Here's the fix:
   1. [Code change]
   2. [Risk assessment]
   3. [Deployment steps]"
(Technical, structured when needed)
```

---

## 5️⃣ Multi-Tool Chaining

The copilot can suggest multiple tools for one request:

```
You: "Check the domain and analyze their website"

Response:
✓ Suggested tools:
  - domain_verify: Check ASIC status
  - page_analyze: Extract website content

You can then click both to get complete picture
```

---

## 6️⃣ System Context Awareness

The copilot **injects real-time system metrics** automatically:

```
You: "Something seems off"
Copilot: [Checks system health internally]
         "You have 2 failed jobs and metrics look normal otherwise.
          Want me to investigate the failed jobs?"
         
(I fetched current state automatically - no extra step needed!)
```

---

## 7️⃣ Tips & Tricks

### Tip 1: Be Natural
❌ "Invoke action domain_verify with params domain=example.com"
✅ "Check if example.com is valid"

### Tip 2: Ask Follow-ups
❌ "Restart context. Check domain. Run health."
✅ Ask one thing, get result, then ask related follow-up

### Tip 3: Use Keywords for Tools
| Keyword | Tool Triggered |
|---------|---|
| domain, verify, abn, asic | domain_verify |
| page, analyze, website, metadata | page_analyze |
| health, status | system_health |
| evidence, data quality | data_quality |
| patch, fix, change | generate_patch |
| crawl | launch_crawl |

### Tip 4: Combine with Context
❌ Start from scratch each time
✅ Reference previous operations: "Like the crawl we just ran..."

---

## 8️⃣ Response Format

The copilot always returns:

```json
{
  "success": true,
  "response": "AI-generated response text",
  "actions": [
    {
      "type": "domain_verify",
      "label": "Verify Domain",
      "description": "Check registration details"
    }
  ],
  "model": "ollama:llama3.2:1b",
  "tokensUsed": 287
}
```

For tool invitations:
```json
{
  "success": true,
  "actionResult": {
    "success": true,
    "data": {
      "domain": "example.com",
      "asicStatus": "Active",
      ...
    },
    "duration": 245
  }
}
```

---

## 9️⃣ Conversation Examples

### Real Conversation 1: A Healthy Day
```
You: What's the current status?

Copilot: All systems nominal.
  • 228 firms in database (all active)
  • 0 crawls pending
  • 0 failed jobs
  • No recent errors
Everything is running smoothly.

You: Great, let's run a crawl on example.com

Copilot: I'll launch a crawl on example.com.
What priority level do you want?
- Normal (default queue)
- High (jump to front)

You: Make it priority  

Copilot: Crawl launched as priority.
I'll track the status. Should complete in ~5 minutes.
```

### Real Conversation 2: Troubleshooting
```
You: Something's broken

Copilot: Let me check...
You've got 2 failed scoring jobs.
The error pattern suggests a database connection timeout.
Want me to:
1. Investigate the job logs
2. Restart the scoring service
3. Check DB connections

You: Show me the logs

Copilot: [Displays formatted logs]
I see - the DB connection pool is exhausted.
Quick fix: Restart the worker process
Or scale: Add more DB connections

Which approach?

You: Restart the worker

Copilot: Worker process restarted.
Re-queuing those 2 failed jobs...
Status should clear in ~2 minutes.
```

---

## 🔟 Configuration

The copilot uses sensible defaults. Only configure if needed:

```bash
# Use local Ollama (default - free & private)
OLLAMA_MODEL=llama3.2:1b
OLLAMA_API_URL=http://localhost:11434

# Or use OpenAI for higher quality
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4-turbo

# Daily token limit
COPILOT_MAX_TOKENS_PER_DAY=50000
```

---

## 📊 Model Selection

### 🚀 Ollama (Default - Recommended)
- ✅ Free
- ✅ Private (data never leaves server)
- ✅ Fast (runs locally)
- ✅ No API keys needed
- ⚠️ Quality: Good for GTIXT domain

**Start it:**
```bash
ollama serve
```

### 💎 OpenAI GPT-4
- ✅ Highest quality
- ✅ Advanced reasoning
- ✅ Faster responses
- ❌ Costs $$$
- ❌ Data goes to OpenAI

**Enable it:**
```bash
export OPENAI_API_KEY=sk-your-key
npm run start
```

---

## 🆘 Common Issues

### "Tool returned empty result"
→ The tool ran but found no data. This is normal.
→ For domain_verify: Company may not be in registry yet

### "Rate limit exceeded"  
→ You've made 50 requests in 1 hour
→ Wait 1 hour or increase COPILOT_RATE_LIMIT

### "Ollama not responding"
→ Start Ollama: `ollama serve`
→ Or switch to OpenAI if available

### "System feels slow"
→ This is normal during Ollama inference
→ First request ~3s, subsequent ~1s
→ Switch to OpenAI for consistently fast responses

---

## 🎓 Learning More

- **Read**: `/opt/gpti/gpti-site/COPILOT_OPTIMIZATION_COMPLETE.md` (Full technical docs)
- **Explore**: `/opt/gpti/gpti-site/lib/copilot-engine.ts` (Tool implementations)
- **Integrate**: `/opt/gpti/gpti-site/app/api/admin/copilot/route.ts` (API layer)

---

## ⚡ Summary

| Feature | How to Use |
|---------|-----------|
| **Domain Verify** | Say "check domain" |
| **Page Analysis** | Say "analyze website" |
| **System Health** | Say "what's the status" |
| **Data Quality** | Say "check data quality" |
| **Memory** | Just chat naturally, context carries over |
| **Multiple Tools** | Ask one complex question |

**That's it!** The copilot handles the rest automatically. 🚀

---

**Version**: 2.0 (Ultra-Powered)  
**Status**: Production Ready ✅  
**Last Updated**: 2026-02-26  
