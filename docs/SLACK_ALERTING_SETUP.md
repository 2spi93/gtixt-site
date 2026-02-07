# 🔔 Configuration des Alertes Slack

## 📋 Ce que tu as

✅ **Backup OVH automatique** - Ton MinIO est déjà sauvegardé  
✅ **Système d'alertes Slack** - Code prêt, juste besoin du webhook  
✅ **Monitoring complet** - Toutes les API routes envoient des alertes

---

## 🚨 Alertes Configurées

Le système t'envoie un message Slack automatiquement quand:

| Alerte | Quand | Gravité |
|--------|-------|---------|
| **MinIO Connection Failure** | Ton MinIO ne répond plus | 🚨 Critical |
| **Stale Data Detected** | Données >48h | ⚠️ Warning |
| **Rate Limit Exhausted** | Trop de requêtes d'une IP | ⚠️ Warning |
| **Data Sync Failure** | Échec après 3 tentatives | ❌ Error |

---

## ⚙️ Setup (5 minutes)

### Étape 1: Créer le Webhook Slack

1. Va sur **https://api.slack.com/apps**
2. Clique "**Create New App**" → "**From scratch**"
3. Nom: **GPTI Monitoring**
4. Sélectionne ton workspace
5. Dans le menu gauche: **Incoming Webhooks**
6. Active le toggle "**Activate Incoming Webhooks**"
7. Scroll down → "**Add New Webhook to Workspace**"
8. Choisis le channel (ex: **#alerts** ou **#monitoring**)
9. Copie l'URL webhook qui ressemble à:
   ```
   https://hooks.slack.com/services/T123ABC456/B789DEF012/xyz1234567890abcdefghijklmn
   ```

### Étape 2: Ajouter le Webhook à ton Environnement

**Pour développement local:**
```bash
cd /opt/gpti/gpti-site
nano .env.local
```

Ajoute:
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/TON/WEBHOOK/URL
```

**Pour production (Netlify):**
```bash
netlify env:set SLACK_WEBHOOK_URL "https://hooks.slack.com/services/TON/WEBHOOK/URL"
```

**Pour production (Vercel):**
```bash
vercel env add SLACK_WEBHOOK_URL production
# Colle ton webhook URL quand demandé
```

### Étape 3: Tester

```bash
# Test manuel du webhook
curl -X POST \
  -H 'Content-type: application/json' \
  --data '{"text":"🧪 Test GPTI - Système d'\''alertes actif!"}' \
  https://hooks.slack.com/services/TON/WEBHOOK/URL

# Tu devrais recevoir un message dans ton channel Slack
```

---

## 📊 Exemple d'Alerte Slack

Quand ton MinIO tombe, tu reçois:

```
🚨 MinIO Connection Failure

Failed to connect to MinIO bucket `gpti-snapshots`.

Bucket: gpti-snapshots
Error: ECONNREFUSED 51.210.246.61:9000
Timestamp: 2026-02-04T10:30:45Z
```

Quand tes données deviennent vieilles:

```
⚠️ Stale Data Detected

Data is 175200000ms old, exceeding max age of 172800000ms.

Data Age: 175200000
Max Age: 172800000
Age Hours: 49
Timestamp: 2026-02-04T10:35:12Z
```

---

## 🔍 Où les Alertes Sont Envoyées

Les alertes Slack sont intégrées dans:

- ✅ **[pages/api/latest-pointer.ts](../pages/api/latest-pointer.ts)** - MinIO failures
- ✅ **[pages/api/firms.ts](../pages/api/firms.ts)** - Stale data + MinIO failures
- ✅ **[pages/api/firm.ts](../pages/api/firm.ts)** - MinIO failures
- ✅ **[lib/alerting.ts](../lib/alerting.ts)** - 5 fonctions d'alerte

---

## 🧪 Scénarios de Test

### Test 1: MinIO Down
```bash
# Arrête MinIO temporairement
sudo systemctl stop minio

# Essaye d'accéder à l'API
curl http://localhost:3000/api/latest-pointer

# Tu devrais recevoir une alerte Slack "MinIO Connection Failure"

# Redémarre
sudo systemctl start minio
```

### Test 2: Stale Data
```bash
# Utilise un vieux snapshot de test (>48h)
# L'API détecte automatiquement et envoie alerte
```

### Test 3: Rate Limit
```bash
# Spam l'API (>120 requêtes/min)
for i in {1..130}; do curl http://localhost:3000/api/firms & done

# Tu devrais recevoir "Rate Limit Exhausted"
```

---

## 💰 Coût

**GRATUIT** (€0/mois)
- Slack webhooks: gratuits et illimités
- Pas d'abonnement nécessaire
- Pas de limite de messages

---

## ✅ Checklist de Production

Avant de déployer:

- [ ] Webhook Slack créé et testé
- [ ] `SLACK_WEBHOOK_URL` ajouté à `.env.local` (dev)
- [ ] `SLACK_WEBHOOK_URL` ajouté à Netlify/Vercel (prod)
- [ ] Test manuel avec `curl` réussi
- [ ] Channel Slack configuré (#alerts ou similaire)
- [ ] Équipe notifiée du nouveau système d'alertes

---

## 🛠️ Troubleshooting

### "Webhook URL not configured"
- Vérifie que `SLACK_WEBHOOK_URL` est dans `.env.local`
- Redémarre le serveur dev: `npm run dev`
- Check les logs: `[Alerting] SLACK_WEBHOOK_URL not configured`

### "Failed to send Slack alert"
- Vérifie que le webhook URL commence par `https://hooks.slack.com/`
- Test manuel avec `curl` (voir Étape 3)
- Vérifie que l'app Slack n'a pas été supprimée

### "Aucune alerte reçue"
- Vérifie le bon channel Slack
- Check que le webhook est actif (https://api.slack.com/apps)
- Regarde les logs serveur pour `[Alerting]`

---

## 📚 Code Source

Toutes les fonctions d'alerte sont dans:
**[lib/alerting.ts](../lib/alerting.ts)**

```typescript
// Exemples d'utilisation:

// Alerte MinIO down
await alertMinIOFailure('gpti-snapshots', 'Connection refused');

// Alerte données vieilles
await alertStaleData(dataAge, maxAge);

// Alerte rate limit
await alertRateLimitExhausted('/api/firms', '192.168.1.1');

// Alerte générique
await sendSlackAlert('Titre', 'Message', 'error', { extra: 'data' });
```

---

## 🎯 Résumé

**Tu as:**
- ✅ Backup OVH automatique (suffisant)
- ✅ Système d'alertes Slack (gratuit)
- ✅ Monitoring complet des APIs
- ✅ Pas de coûts supplémentaires

**Il te faut juste:**
1. Créer webhook Slack (5 min)
2. Ajouter `SLACK_WEBHOOK_URL` à `.env.local`
3. Tester avec `curl`
4. Déployer en production

**C'est tout!** 🚀
