# 🔒 ADMIN PANEL - AUTHENTICATION GUIDE
**Last Updated**: 2026-02-27 15:13 UTC  
**System**: ✅ Operational & Secure

---

## Quick Start

### 1️⃣ Access Admin Panel
```
URL: https://admin.gtixt.com/admin/login
OR: http://localhost:3000/admin/login (Development)
```

### 2️⃣ Login Credentials
```
Username: founder
Password: <configured-admin-password>
```

### 3️⃣ After Login
- ✅ Dashboard accessible
- ✅ All admin routes available
- ✅ session valid for 24 hours
- ✅ Cookie-based authentication (httpOnly)

---

## Technical Details

### Authentication Method
- **Type**: Cookie-based (httpOnly)
- **Transport**: HTTPS only
- **Storage**: Server-side httpOnly cookie
- **Validation**: Server-side (no client-side tokens)
- **Duration**: 24 hours (86400 seconds)

### Security Features
```
Set-Cookie: auth_token=...; 
  HttpOnly         ← JavaScript cannot access
  Secure           ← HTTPS only
  SameSite=Strict  ← CSRF protection
  Max-Age=86400    ← 24 hour expiration
```

### Protected Routes
All routes under `/admin/*` require authentication:
```
/admin/login/          ← Public (login form)
/admin/                ← Protected (dashboard)
/admin/audit/          ← Protected
/admin/jobs/           ← Protected
/admin/users/          ← Protected
/admin/monitoring/     ← Protected
... (all other admin routes)
```

---

## API Endpoints

### Login
```bash
POST /api/internal/auth/login
Content-Type: application/json

{
  "username": "founder",
  "password": "<configured-admin-password>",
  "totp": "123456"  # Optional (if 2FA enabled)
}

Response:
{
  "token": "<redacted-example-token>",
  "user": {
    "id": 1,
    "username": "founder",
    "email": "founder@gtixt.com",
    "role": "admin"
  },
  "requires_totp": false,
  "password_expired": false
}

Set-Cookie: auth_token=...; HttpOnly; Secure; ...
```

### Get Current User
```bash
GET /api/internal/auth/me
Cookie: auth_token=...

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "username": "founder",
    "email": "founder@gtixt.com",
    "role": "admin"
  },
  "password_expired": false,
  "password_rotation_days": 90,
  "password_days_remaining": 89
}
```

### Logout
```bash
POST /api/internal/auth/logout
Cookie: auth_token=...

Response: { "success": true }

Set-Cookie: auth_token=; Max-Age=0  ← Clears cookie
```

---

## Troubleshooting

### Problem: Login page shows 404
**Status**: ✅ FIXED (was broken, now working)
- ✅ Page `/admin/login` returns 200 OK
- ✅ Form renders correctly
- ✅ Ready for login

### Problem: Can't login
**Check**:
1. Username/password correct? (founder / <configured-admin-password>)
2. Database running? (Port 5434)
3. Server running? (Port 3000)

**Fix**:
```bash
# Restart server
cd /opt/gpti/gpti-site
npm run start

# Verify connectivity
curl http://localhost:3000/admin/login
# Should return 200 OK
```

### Problem: Logged in but can't access admin pages
**Check**:
1. Cookie set after login?
   ```bash
   # In browser dev tools → Application → Cookies
   # Should see: auth_token (HttpOnly, Secure)
   ```

2. Session valid?
   ```bash
   curl -s -H "Cookie: auth_token=YOUR_TOKEN" \
     http://localhost:3000/api/internal/auth/me | jq '.'
   # Should return user info
   ```

### Problem: Session expires
**Duration**: 24 hours from login  
**After expiration**: Redirected to login page  
**Solution**: Login again

---

## Architecture

### Authentication Flow
```
Browser (client)
    ↓
/app/login/page.tsx (form)
    ↓
POST /api/internal/auth/login/
    ↓
/pages/api/internal/auth/login.ts (API)
    ↓
- Verify credentials
- Create session in DB
- Set Set-Cookie header
    ↓
Browser receives Set-Cookie
    ↓
Cookie stored (httpOnly, can't access via JS)
    ↓
User redirected to /admin/
    ↓
Middleware validates auth_token cookie ✓
    ↓
Layout renders + calls useAdminAuth() hook
    ↓
Hook calls /api/internal/auth/me
    (with Cookie header, credentials: 'include')
    ↓
Page renders dashboard ✓
```

### Key Components
| File | Purpose |
|------|---------|
| `/app/login/page.tsx` | Root login form |
| `/app/admin/login/page.tsx` | Admin login form |
| `/app/admin/layout.tsx` | Admin UI wrapper |
| `/middleware.ts` | Server-side route protection |
| `/lib/admin-auth-guard.ts` | useAdminAuth hook |
| `/pages/api/internal/auth/login.ts` | Authentication API |
| `/pages/api/internal/auth/me.ts` | User info API |
| `/pages/api/internal/auth/logout.ts` | Logout API |

---

## Security Best Practices

### ✅ DO
- ✅ Use HTTPS only (never HTTP in production)
- ✅ Keep session duration reasonable (4-8 hours recommended)
- ✅ Never share credentials
- ✅ Use TOTP/2FA for sensitive accounts
- ✅ Log admin actions
- ✅ Monitor for suspicious activity

### ❌ DON'T
- ❌ Store tokens in sessionStorage/localStorage
- ❌ Send credentials in URLs
- ❌ Share auth cookies
- ❌ Use simple passwords
- ❌ Disable HTTPS
- ❌ Set very long session timeouts (>8h)

---

## Configuration

### Session Duration
**Current**: 24 hours (86400 seconds)  
**File**: `/pages/api/internal/auth/login.ts`
```typescript
// Set Max-Age to different value (in seconds)
res.setHeader('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`);
```

### Security Headers
**File**: `/middleware.ts` (set security headers)
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: ...
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=63072000
```

---

## Monitoring

### Log Successful Logins
```bash
# Check server logs
tail -f /tmp/server.log
# Look for login attempts and results
```

### Check Active Sessions
```bash
# Database query
psql -h localhost -p 5434 -U gpti -d gpti

SELECT COUNT(*) FROM internal_sessions;
SELECT * FROM internal_sessions LIMIT 5;
```

### Monitor Token Usage
```bash
# Check auth_token cookie usage
curl -v https://admin.gtixt.com/admin/login
# Look for Set-Cookie in response headers
```

---

## FAQ

**Q: How long until my session expires?**  
A: 24 hours from login. After that, you'll be redirected to login page.

**Q: Is my password stored securely?**  
A: Yes, passwords are hashed with SHA256 and stored in the database.

**Q: Can I access admin pages without logging in?**  
A: No. Middleware will redirect you to `/admin/login` if no valid `auth_token` cookie is found.

**Q: What if I forget my password?**  
A: Contact the system administrator. Password reset feature available at `/admin/security/password/`.

**Q: Is HTTPS required?**  
A: Yes. Cookies have `Secure` flag, so they won't be sent over HTTP.

**Q: Can JavaScript steal my auth token?**  
A: No. Token is stored in `httpOnly` cookie, which JavaScript cannot access (only HTTP(S) requests can use it).

**Q: What if my session is hijacked?**  
A: All sessions are stored in the database and validated on every request. Even if cookie is stolen, server can revoke it.

---

## Support

### Check System Status
```bash
# Server running?
ps aux | grep "npm run start"

# Database running?
netstat -tlnp | grep 5434

# API responding?
curl http://localhost:3000/api/internal/auth/me
```

### Restart Server
```bash
# Kill old process
pkill -f "npm run start"

# Start new process
cd /opt/gpti/gpti-site
npm run start &
```

### View Logs
```bash
# Tail server logs
tail -100 /tmp/server.log

# View error logs
cat /var/log/nginx/error.log
```

---

**System Status**: 🟢 **OPERATIONAL**  
**Last Health Check**: 2026-02-27 15:13 UTC  
**Authentication**: ✅ **SECURE & FUNCTIONAL**

