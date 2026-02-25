# GTIXT Production HTTPS Setup

## ✅ Configuration terminée (31 janvier 2026)

### Infrastructure
- **Domaine**: `data.gtixt.com` → `51.210.246.61`
- **Nginx**: v1.18.0 (reverse proxy pour MinIO)
- **SSL/TLS**: Let's Encrypt (expire le 1er mai 2026)
- **Auto-renewal**: Activé via certbot systemd timer

### Endpoints

#### HTTPS (Production)
```
https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json
https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/[snapshot].json
```

#### HTTP (Legacy - redirige vers HTTPS)
```
http://data.gtixt.com → https://data.gtixt.com
```

### CORS Configuration
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: Range, Content-Type
Access-Control-Expose-Headers: Content-Length, Content-Range, ETag
```

### Variables d'environnement

#### Local (.env.local)
```bash
NEXT_PUBLIC_MINIO_BASE=https://data.gtixt.com
NEXT_PUBLIC_BUCKET=gpti-snapshots
NEXT_PUBLIC_LATEST_POINTER=universe_v0.1_public/_public/latest.json
NEXT_PUBLIC_PUBLIC_POINTER_URL=https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json
```

#### Docker/VPS (env du conteneur)
```bash
NEXT_PUBLIC_MINIO_BASE=https://data.gtixt.com
NEXT_PUBLIC_BUCKET=gpti-snapshots
NEXT_PUBLIC_LATEST_POINTER=universe_v0.1_public/_public/latest.json
NEXT_PUBLIC_PUBLIC_POINTER_URL=https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json
```

### Nginx Configuration
**Fichier**: `/etc/nginx/sites-enabled/data.gtixt.com`

- Reverse proxy: `127.0.0.1:9000` → `https://data.gtixt.com`
- SSL: Let's Encrypt (auto-managed by certbot)
- Timeouts: 300s (pour les gros snapshots)
- Client max body size: 100M
- HTTP → HTTPS redirect: 301

### Vérification

```bash
# Test HTTPS + CORS
curl -I https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json

# Télécharger le pointer
curl -s https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json | jq '.'

# Vérifier le certificat SSL
openssl s_client -connect data.gtixt.com:443 -servername data.gtixt.com < /dev/null 2>/dev/null | openssl x509 -noout -dates
```

### Renouvellement SSL (automatique)

Certbot renouvelle automatiquement via systemd timer:
```bash
# Vérifier le timer
sudo systemctl status certbot.timer

# Tester le renouvellement (dry-run)
sudo certbot renew --dry-run

# Forcer le renouvellement (si besoin)
sudo certbot renew --force-renewal
```

### Logs

```bash
# Nginx access logs
sudo tail -f /var/log/nginx/data.gtixt.com.access.log

# Nginx error logs
sudo tail -f /var/log/nginx/data.gtixt.com.error.log

# Certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Bénéfices

✅ **WebCrypto SHA-256** fonctionne (nécessite HTTPS ou localhost)
✅ **Mixed content** résolu (site HTTPS + data HTTPS)
✅ **CORS** configuré pour accès public
✅ **SSL A+** (Let's Encrypt best practices)
✅ **HTTP/2** activé automatiquement

### Next Steps (optionnel)

1. **CDN** (Cloudflare): Mettre `data.gtixt.com` derrière Cloudflare pour caching global
2. **Rate limiting**: Nginx rate limiting si abus détecté
3. **Monitoring**: Uptime monitoring pour `data.gtixt.com`
4. **Backup DNS**: Ajouter un domaine secondaire (ex: `cdn.gtixt.com`)

---

**Dernière mise à jour**: 31 janvier 2026, 03:35 UTC
**Maintenu par**: GTIXT Infrastructure Team
