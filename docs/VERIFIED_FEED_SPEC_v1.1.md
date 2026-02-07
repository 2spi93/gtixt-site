# GPTI Verified Feed Specification v1.1

**Version:** 1.1  
**Date:** 2026-02-01  
**Status:** Draft for Partner Review

## Overview

The GPTI Verified Feed provides vetted, compliance-checked proprietary trading firm data to partners via authenticated API access. This specification defines data format, access methods, rate limits, and integration patterns for v1.1.

## Core Principles

1. **Data Integrity:** All scores IOSCO-compliant with immutable audit trail
2. **Transparency:** Full methodology disclosure and score explanations available
3. **Real-Time Updates:** Scores refreshed daily, critical events within hours
4. **Partner Control:** Partners decide how to present/use data
5. **Compliance-First:** Built for regulatory scrutiny from day one

## Data Format

### Primary Feed Endpoint

```
GET /api/feed/verified
```

**Authentication:** Bearer token (JWT)  
**Rate Limit:** 100 requests/hour per partner  
**Response Format:** JSON

### Response Structure

```json
{
  "metadata": {
    "version": "v1.1.20260201",
    "generated_at": "2026-02-01T12:00:00Z",
    "total_firms": 106,
    "data_coverage": 74.6,
    "validation_status": "PASS",
    "next_update": "2026-02-02T12:00:00Z"
  },
  "firms": [
    {
      "firm_id": "ftmocom",
      "name": "FTMO",
      "score_0_100": 75,
      "tier": "VERIFIED",
      "confidence": "high",
      "jurisdiction": "CZE",
      "jurisdiction_tier": "B",
      "last_updated": "2026-02-01T06:00:00Z",
      "url": "https://ftmo.com",
      "pillar_scores": {
        "regulatory": 72,
        "financial": 78,
        "operational": 75,
        "reputation": 73,
        "transparency": 77
      },
      "indicators": {
        "regulated": true,
        "license_verified": true,
        "payout_verified": true,
        "public_disclosure": true,
        "complaint_rate": "low"
      },
      "metadata": {
        "data_sources": 15,
        "last_verified": "2026-02-01T06:00:00Z",
        "evidence_count": 47,
        "na_rate": 17.2
      }
    }
  ],
  "validation_summary": {
    "tests_passed": 4,
    "tests_failed": 2,
    "total_alerts": 3,
    "data_quality": "GOOD"
  }
}
```

## Feed Tiers

### Tier 1: Verified (Score 70-100)
- **Characteristics:** Licensed, verified payouts, strong transparency
- **Confidence:** High data quality (NA rate <20%)
- **Monitoring:** Daily updates, event-triggered alerts
- **Partner Display:** Full firm profile recommended

### Tier 2: Monitored (Score 50-69)
- **Characteristics:** Some verification, acceptable reputation
- **Confidence:** Medium data quality (NA rate 20-30%)
- **Monitoring:** Daily updates, standard validation
- **Partner Display:** Profile with caveats

### Tier 3: Caution (Score 30-49)
- **Characteristics:** Limited verification, concerning signals
- **Confidence:** Variable data quality
- **Monitoring:** Enhanced scrutiny, frequent checks
- **Partner Display:** Warning indicators required

### Tier 4: Alert (Score 0-29)
- **Characteristics:** Serious issues, regulatory problems
- **Confidence:** Based on available evidence
- **Monitoring:** Continuous monitoring, immediate alerts
- **Partner Display:** Strong warnings recommended

## Authentication

### Obtaining API Credentials

1. **Partner Application:** Submit form at gpti.io/partners
2. **Review Process:** 2-5 business days
3. **Credentials Issued:** API key + secret
4. **Token Generation:** Exchange credentials for JWT

### Token Request

```bash
POST /api/auth/token
Content-Type: application/json

{
  "api_key": "your_api_key",
  "api_secret": "your_api_secret"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "feed:read"
}
```

### Using the Token

```bash
GET /api/feed/verified
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Rate Limits

| Plan | Requests/Hour | Requests/Day | Webhook Events |
|------|---------------|--------------|----------------|
| **Starter** | 100 | 1,000 | 10/day |
| **Professional** | 500 | 10,000 | 50/day |
| **Enterprise** | 2,000 | 50,000 | Unlimited |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706803200
```

**429 Response:**
```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded. Retry after 3600 seconds.",
  "retry_after": 3600
}
```

## Filtering & Pagination

### Query Parameters

```
GET /api/feed/verified?min_score=70&jurisdiction=USA&limit=20&offset=0
```

**Available Filters:**
- `min_score` (0-100): Minimum score threshold
- `max_score` (0-100): Maximum score threshold
- `jurisdiction` (ISO 3166-1 alpha-3): Country code
- `jurisdiction_tier` (A/B/C/D/UNKNOWN): Regulatory tier
- `confidence` (high/medium/low): Data confidence level
- `regulated` (true/false): Licensed/regulated status
- `limit` (1-100): Results per page (default: 50)
- `offset` (0+): Pagination offset

### Response with Pagination

```json
{
  "metadata": {...},
  "firms": [...],
  "pagination": {
    "total": 106,
    "limit": 20,
    "offset": 0,
    "has_more": true,
    "next_url": "/api/feed/verified?offset=20&limit=20"
  }
}
```

## Webhooks (Optional)

### Event Types

Partners can subscribe to real-time events:

- `firm.score_changed` - Score update >5 points
- `firm.tier_changed` - Tier upgrade/downgrade
- `firm.alert_raised` - New alert/issue detected
- `firm.verified` - Firm newly verified
- `firm.unverified` - Verification lost
- `system.validation_failed` - Validation test failure

### Webhook Configuration

```bash
POST /api/webhooks
Content-Type: application/json
Authorization: Bearer {token}

{
  "url": "https://partner.com/gpti-webhook",
  "events": ["firm.score_changed", "firm.alert_raised"],
  "secret": "your_webhook_secret"
}
```

### Webhook Payload

```json
{
  "event": "firm.score_changed",
  "timestamp": "2026-02-01T14:30:00Z",
  "data": {
    "firm_id": "ftmocom",
    "firm_name": "FTMO",
    "previous_score": 75,
    "new_score": 68,
    "change": -7,
    "reason": "regulatory_event"
  },
  "signature": "sha256=..."
}
```

### Webhook Security

Verify webhook authenticity using HMAC:

```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

## Audit Trail Access

### Score Explanation Endpoint

```
GET /api/feed/explain/{firm_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "firm_id": "ftmocom",
  "score": 75,
  "breakdown": [
    {
      "pillar": "regulatory",
      "score": 72,
      "weight": 0.2,
      "contribution": 14.4,
      "metrics": [...]
    }
  ],
  "evidence_summary": {
    "total_evidence_items": 47,
    "by_type": {...},
    "recent_evidence": [...]
  },
  "confidence_factors": [...]
}
```

### Validation Status Endpoint

```
GET /api/feed/validation
Authorization: Bearer {token}
```

Returns current validation test results (same as transparency report summary).

## Integration Patterns

### Pattern 1: Full Mirror (Recommended)

Cache entire feed, update daily:

```python
import requests
from datetime import datetime, timedelta

class GPTIFeedClient:
    def __init__(self, api_key, api_secret):
        self.api_key = api_key
        self.api_secret = api_secret
        self.token = None
        self.token_expires = None
    
    def get_token(self):
        if self.token and self.token_expires > datetime.utcnow():
            return self.token
        
        resp = requests.post(
            'https://api.gpti.io/auth/token',
            json={'api_key': self.api_key, 'api_secret': self.api_secret}
        )
        data = resp.json()
        
        self.token = data['access_token']
        self.token_expires = datetime.utcnow() + timedelta(seconds=data['expires_in'])
        return self.token
    
    def fetch_all_firms(self):
        token = self.get_token()
        firms = []
        offset = 0
        
        while True:
            resp = requests.get(
                'https://api.gpti.io/feed/verified',
                headers={'Authorization': f'Bearer {token}'},
                params={'limit': 100, 'offset': offset}
            )
            data = resp.json()
            
            firms.extend(data['firms'])
            
            if not data['pagination']['has_more']:
                break
            
            offset += 100
        
        return firms

# Usage
client = GPTIFeedClient('your_key', 'your_secret')
firms = client.fetch_all_firms()
```

### Pattern 2: On-Demand Lookup

Query specific firms when needed:

```python
def get_firm_score(firm_id):
    resp = requests.get(
        f'https://api.gpti.io/feed/verified?firm_id={firm_id}',
        headers={'Authorization': f'Bearer {token}'}
    )
    data = resp.json()
    return data['firms'][0] if data['firms'] else None
```

### Pattern 3: Webhook-Driven

Subscribe to events, update cache:

```python
@app.route('/gpti-webhook', methods=['POST'])
def handle_gpti_webhook():
    payload = request.data.decode()
    signature = request.headers.get('X-GPTI-Signature')
    
    if not verify_webhook(payload, signature, WEBHOOK_SECRET):
        return 'Invalid signature', 401
    
    event = request.json
    
    if event['event'] == 'firm.score_changed':
        update_firm_in_cache(event['data'])
    
    return 'OK', 200
```

## Error Handling

### HTTP Status Codes

- `200 OK` - Success
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Invalid/missing token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource doesn't exist
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server issue
- `503 Service Unavailable` - Maintenance

### Error Response Format

```json
{
  "error": "invalid_parameter",
  "message": "Invalid value for 'min_score': must be 0-100",
  "details": {
    "parameter": "min_score",
    "provided": "150",
    "expected": "0-100"
  }
}
```

## Data Freshness Guarantees

| Data Type | Update Frequency | Latency |
|-----------|------------------|---------|
| **Firm Scores** | Daily (12:00 UTC) | <15 minutes |
| **Critical Events** | Real-time | <1 hour |
| **Validation Results** | Daily | <30 minutes |
| **Evidence Collection** | Continuous | <24 hours |
| **Audit Trail** | Real-time | Immediate |

## Compliance & Legal

### Data Usage Terms

1. **Attribution:** "Powered by GPTI" required on display
2. **No Resale:** Cannot resell raw feed data
3. **Transparency:** Must link to gpti.io for full methodology
4. **Updates:** Must refresh data within 48 hours
5. **Accuracy:** Display scores with confidence indicators

### IOSCO Compliance

This feed implements:
- **Article 13:** Methodology Transparency (full disclosure)
- **Article 15:** Methodology Rigor (6-test validation)
- **Article 16:** Public Disclosure (transparency reports)

### Liability

GPTI scores are informational only. Partners responsible for:
- User disclaimers
- Investment/trading warnings
- Compliance with local regulations
- Independent due diligence

## Support & SLA

### Support Channels

- **Technical Issues:** api-support@gpti.io
- **Partnership Questions:** partners@gpti.io
- **Security Concerns:** security@gpti.io
- **Documentation:** docs.gpti.io

### SLA (Enterprise Only)

- **Uptime:** 99.5% monthly
- **Response Time:** <100ms (p95)
- **Support Response:** <4 hours (business days)
- **Incident Updates:** Real-time via status.gpti.io

## Versioning

### Current Version: v1.1

**Breaking Changes:** None planned for v1.x  
**Deprecation Notice:** 90 days minimum  
**Version Header:** `X-GPTI-API-Version: 1.1`

### Migration from v1.0

Changes in v1.1:
- Added `evidence_count` to metadata
- Added `validation_summary` to feed
- Added `/api/feed/explain` endpoint
- Improved error responses with `details` field

All v1.0 endpoints remain functional.

## Testing & Sandbox

### Sandbox Environment

```
Base URL: https://sandbox.gpti.io
```

**Differences from Production:**
- Test data only (mock firms)
- No rate limits
- Instant token expiration (for testing)
- No webhooks (simulate with GET requests)

### Test Credentials

```
API Key: test_key_abc123
API Secret: test_secret_xyz789
```

### Sample Integration Test

```bash
# 1. Get token
TOKEN=$(curl -s -X POST https://sandbox.gpti.io/auth/token \
  -H "Content-Type: application/json" \
  -d '{"api_key":"test_key_abc123","api_secret":"test_secret_xyz789"}' \
  | jq -r '.access_token')

# 2. Fetch feed
curl -H "Authorization: Bearer $TOKEN" \
  https://sandbox.gpti.io/feed/verified?min_score=70

# 3. Get explanation
curl -H "Authorization: Bearer $TOKEN" \
  https://sandbox.gpti.io/feed/explain/test_firm_001
```

## Changelog

### v1.1 (2026-02-01)
- Added evidence count to firm metadata
- Added validation summary to feed response
- New `/api/feed/explain` endpoint for score transparency
- Improved error messages with structured details
- Added webhook support for real-time events

### v1.0 (2025-12-01)
- Initial release
- Basic feed endpoint with authentication
- Filtering and pagination
- Rate limiting

---

**Questions?** Contact partners@gpti.io  
**Full Documentation:** https://docs.gpti.io/feed-spec-v1.1
