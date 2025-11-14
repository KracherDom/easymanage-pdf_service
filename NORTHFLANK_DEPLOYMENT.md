# Northflank Deployment Guide

Diese Anleitung zeigt, wie du den PDF-Service auf Northflank hostest.

## 🌐 Warum Northflank?

**Vorteile gegenüber Render.com:**
- ✅ Kubernetes-basiert (bessere Skalierung)
- ✅ EU-Datacenter (Frankfurt/London) für DSGVO-Compliance
- ✅ Bessere Performance für Chromium/Playwright
- ✅ Flexiblere Resource-Limits
- ✅ Kein Cold Start (auch im Free Tier)
- ✅ Integriertes CI/CD
- ✅ PostgreSQL, Redis, Object Storage inklusive

## 🚀 Deployment auf Northflank

### Schritt 1: Account erstellen

1. Gehe zu [northflank.com](https://northflank.com)
2. Klicke **"Sign Up"** oder **"Start Free"**
3. Wähle **"GitHub"** Login (empfohlen)
4. Bestätige deine E-Mail-Adresse

### Schritt 2: Git Repository vorbereiten

```bash
cd pdf-service

# Git initialisieren (falls noch nicht geschehen)
git init
git add .
git commit -m "Initial commit: PDF Service for Northflank"

# Auf GitHub/GitLab pushen
git remote add origin https://github.com/DEIN-USERNAME/pdf-service.git
git push -u origin main
```

### Schritt 3: Projekt in Northflank erstellen

1. **Dashboard** → **"Create Project"**
2. **Project Name**: `pdf-service` oder `easymanage-services`
3. **Region**: `europe-west` (Frankfurt) für EU oder `us-east` für USA
4. Klicke **"Create Project"**

### Schritt 4: Service erstellen

#### Option A: Via GitHub Integration (empfohlen)

1. Im Projekt: **"Create Service"** → **"Deployment"** → **"Combined"**
2. **Connect Repository**:
   - Wähle GitHub
   - Autorisiere Northflank
   - Wähle dein `pdf-service` Repository
   - Branch: `main`
3. **Build Settings**:
   - Build Type: **"Dockerfile"**
   - Dockerfile Path: `/Dockerfile`
   - Build Arguments: (leer lassen)
4. **Port Configuration**:
   - Port: `3001`
   - Protocol: **HTTP**
   - Public: ✅ Aktivieren
5. Klicke **"Create Service"**

#### Option B: Via Northflank CLI (für Fortgeschrittene)

```bash
# Northflank CLI installieren
npm install -g @northflank/cli

# Login
nf login

# Projekt erstellen
nf create project --name pdf-service --region europe-west

# Service deployen
nf create service \
  --name pdf-service \
  --project pdf-service \
  --type combined \
  --repo-url https://github.com/DEIN-USERNAME/pdf-service.git \
  --branch main \
  --dockerfile /Dockerfile \
  --port 3001
```

### Schritt 5: Environment Variables konfigurieren

1. Gehe zu deinem Service → **"Environment"** Tab
2. Klicke **"Add Variable"**
3. Füge folgende Variablen hinzu:

| Variable | Wert | Typ | Beschreibung |
|----------|------|-----|--------------|
| `NODE_ENV` | `production` | Plain | Node.js Umgebung |
| `PORT` | `3001` | Plain | Server Port (muss mit Dockerfile übereinstimmen) |
| `API_KEY` | `<generiere-mit-openssl>` | **Secret** | API-Authentifizierung |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Plain | CORS Whitelist |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | `0` | Plain | Playwright Browser installieren |

**API-Key generieren:**
```bash
openssl rand -hex 32
# Kopiere den Output und füge ihn als Secret ein
```

4. Klicke **"Save Changes"**

### Schritt 6: Resource Limits setzen

1. Service → **"Resources"** Tab
2. **Empfohlene Einstellungen für PDF-Service**:

   **Free Tier (zum Testen):**
   - CPU: 0.2 vCPU
   - Memory: 512 MB
   - Replicas: 1

   **Production (empfohlen):**
   - CPU Requests: 0.25 vCPU
   - CPU Limits: 0.5 vCPU
   - Memory Requests: 512 MB
   - Memory Limits: 1 GB
   - Replicas: 1-3 (mit Autoscaling)

3. **Autoscaling aktivieren** (Production):
   - Min Replicas: 1
   - Max Replicas: 3
   - Target CPU: 80%
   - Target Memory: 80%

### Schritt 7: Health Checks konfigurieren

Northflank übernimmt die Health Checks automatisch aus dem Dockerfile.

**Manuelle Konfiguration** (optional):
1. Service → **"Health"** Tab
2. **Liveness Probe**:
   - Type: HTTP
   - Path: `/health`
   - Port: `3001`
   - Initial Delay: 30s
   - Period: 10s
   - Timeout: 5s
   - Failure Threshold: 3

3. **Readiness Probe**:
   - Type: HTTP
   - Path: `/health`
   - Port: `3001`
   - Initial Delay: 10s
   - Period: 5s
   - Timeout: 3s
   - Failure Threshold: 3

### Schritt 8: Deployment starten

1. Klicke **"Deploy"** oder warte auf Auto-Deploy
2. Northflank baut das Docker Image
3. Installiert Playwright + Chromium
4. Startet den Service
5. Nach ~3-5 Minuten ist der Service live

**Build-Logs ansehen:**
- Service → **"Builds"** Tab → Neuester Build → **"View Logs"**

**Runtime-Logs ansehen:**
- Service → **"Logs"** Tab → Live-Stream

### Schritt 9: URL abrufen

1. Service → **"Networking"** Tab
2. **Public URL** kopieren, z.B.:
   ```
   https://pdf-service-12345.code.run
   ```

### Schritt 10: Service testen

```bash
# Setze deine Northflank URL
export PDF_SERVICE_URL="https://pdf-service-12345.code.run"
export PDF_API_KEY="dein-api-key-hier"

# Health Check
curl $PDF_SERVICE_URL/health

# PDF generieren
curl -X POST $PDF_SERVICE_URL/generate \
  -H "x-api-key: $PDF_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Test PDF von Northflank</h1><p>Deployment erfolgreich!</p>"}' \
  --output northflank-test.pdf

# PDF öffnen
open northflank-test.pdf  # macOS
```

**Erwartete Response:**
- Status: 200 OK
- Content-Type: application/pdf
- File Size: ~10-20 KB
- Generierungszeit: 2-5 Sekunden (erste PDF), dann 1-2s

## 🔧 Konfiguration & Optimierung

### Custom Domain einrichten

1. Service → **"Networking"** Tab
2. **"Add Domain"**
3. Füge deine Domain hinzu, z.B.: `pdf.easymanage.com`
4. Folge den DNS-Anweisungen:
   ```
   CNAME pdf.easymanage.com → pdf-service-12345.code.run
   ```
5. SSL-Zertifikat wird automatisch generiert (Let's Encrypt)

### Autoscaling konfigurieren

**Für hohe Last (z.B. Monatsende mit vielen Rechnungen):**

1. Service → **"Resources"** Tab
2. **Horizontal Autoscaling** aktivieren:
   - Min: 2 Replicas
   - Max: 5 Replicas
   - Scale up: bei 80% CPU oder Memory
   - Scale down: bei 30% CPU/Memory für 5 Minuten

**Kosten-Kalkulation:**
- 1 Replica (0.25 vCPU, 512MB): ~$5-7/Monat
- Autoscaling 2-5 Replicas: ~$10-35/Monat (je nach Auslastung)

### Logs & Monitoring

**Live-Logs ansehen:**
```bash
# Via CLI
nf logs --service pdf-service --follow

# Via Dashboard
Service → Logs Tab → Enable Live Stream
```

**Log-Filter:**
```
# Nur Errors
level:error

# Nur PDF-Generierungen
"PDF-Service"

# Langsame Requests (> 5 Sekunden)
duration:>5000
```

**Metriken:**
- Service → **"Metrics"** Tab
- CPU, Memory, Network, Requests/s
- Response Times (P50, P95, P99)

### Secrets Management

**API-Key rotieren:**

1. Generiere neuen Key:
   ```bash
   openssl rand -hex 32
   ```

2. Service → **"Environment"** Tab
3. Bearbeite `API_KEY` Secret
4. Füge neuen Wert ein
5. **"Save & Restart"**

**Best Practices:**
- ✅ Verwende Northflank Secrets (nicht Plain Variables)
- ✅ Rotiere API-Keys alle 90 Tage
- ✅ Dokumentiere Key-Rotation in Calendar
- ✅ Update auch Vercel Environment Variables

## 🔐 Sicherheit

### Network Policies

**CORS richtig konfigurieren:**

```bash
# In Environment Variables:
ALLOWED_ORIGINS=https://app.easymanage.com,https://easymanage.vercel.app

# NICHT:
ALLOWED_ORIGINS=*  # Unsicher für Production!
```

### Rate Limiting (optional)

Northflank bietet kein eingebautes Rate Limiting. Erweitere den Service:

```bash
npm install express-rate-limit
```

In `src/server.js`:
```javascript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // Max 100 Requests pro IP
  message: 'Too many PDF generation requests, please try again later'
})

app.post('/generate', limiter, verifyApiKey, async (req, res) => {
  // ... existing code
})
```

### IP Whitelisting (Enterprise)

Northflank Enterprise unterstützt IP Whitelisting:
1. Service → **"Security"** Tab
2. **"IP Whitelist"** aktivieren
3. Füge Vercel IP-Ranges hinzu

## 💰 Kosten

### Free Tier
- ✅ 2 Free Services
- ✅ 1 GB RAM gesamt
- ✅ 0.2 vCPU pro Service
- ⚠️ Ausreichend für Testing, nicht für Production

### Developer Plan ($20/Monat)
- ✅ Unlimited Services
- ✅ 4 GB RAM
- ✅ 2 vCPU
- ✅ Custom Domains
- ✅ SSL Zertifikate
- ✅ Empfohlen für PDF-Service

### Kosten-Optimierung

**Tipp 1: Sleep Schedule (Development)**
```yaml
# Nur Development-Services nachts schlafen lassen
# Production-Services: immer online
```

**Tipp 2: Shared Resources**
```
Nutze dasselbe Northflank-Projekt für:
- PDF-Service
- Mögliche zukünftige Microservices (Email, Export, etc.)
```

**Tipp 3: Autoscaling richtig einstellen**
```
Min: 1 Replica (normale Auslastung)
Max: 3 Replicas (Peak-Zeiten)
Spart Kosten vs. "always 3 replicas"
```

## 🔄 CI/CD Pipeline

### Automatisches Deployment

**Bei Git Push:**
1. Push zu `main` Branch
2. Northflank erkennt Änderung
3. Baut neues Docker Image
4. Führt Health Check aus
5. Deployed neue Version (zero-downtime)

**Bei Pull Request:**
1. Erstelle PR
2. Northflank erstellt Preview-Environment (optional)
3. Test im Preview
4. Nach Merge → Auto-Deploy zu Production

### Deployment-Strategien konfigurieren

1. Service → **"Deployment"** Tab
2. **Strategy**: `RollingUpdate` (empfohlen)
   - Max Unavailable: 0 (zero-downtime)
   - Max Surge: 1 (eine neue Replica vor Shutdown der alten)

## 📊 Monitoring & Alerts

### Alerts einrichten

1. Service → **"Alerts"** Tab
2. **"Create Alert"**

**Empfohlene Alerts:**

**1. Service Down:**
- Condition: Health Check failed for 2 minutes
- Action: Email + Slack
- Severity: Critical

**2. High Memory:**
- Condition: Memory > 90% for 5 minutes
- Action: Email
- Severity: Warning

**3. High CPU:**
- Condition: CPU > 90% for 5 minutes
- Action: Email
- Severity: Warning

**4. Slow Response Times:**
- Condition: P95 Response Time > 10s
- Action: Slack
- Severity: Warning

### Integration mit externem Monitoring

**Sentry (Error Tracking):**
```bash
npm install @sentry/node
```

```javascript
// In src/server.js
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
})

app.use(Sentry.Handlers.errorHandler())
```

## 🧪 Testing vor Production

### Staging Environment

1. Erstelle zweiten Service: `pdf-service-staging`
2. Verbinde mit `staging` Branch
3. Teste neue Features hier zuerst
4. Nach erfolgreichen Tests → Merge zu `main`

### Load Testing

```bash
# Mit Apache Bench
ab -n 100 -c 10 \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -p payload.json \
  $PDF_SERVICE_URL/generate

# Mit Artillery
npm install -g artillery
artillery quick --count 10 --num 50 $PDF_SERVICE_URL/health
```

## 🆘 Troubleshooting

### Problem: Build schlägt fehl

**Lösung 1: Build-Logs prüfen**
```
Service → Builds → Latest Build → View Logs
```

**Lösung 2: Playwright Installation**
```dockerfile
# In Dockerfile: Stelle sicher, dass --with-deps verwendet wird
RUN npx playwright install --with-deps chromium
```

### Problem: Service startet nicht

**Lösung: Runtime-Logs prüfen**
```
Service → Logs → Filter by "error"
```

**Häufige Fehler:**
- `EADDRINUSE`: Port 3001 bereits belegt → Northflank mapped automatisch
- `Chromium not found`: Playwright nicht korrekt installiert
- `Out of memory`: Memory Limit zu niedrig → Erhöhe auf 1GB

### Problem: PDF-Generierung langsam

**Ursachen:**
1. Erste PDF: Chromium-Start (~2-5s) → Normal
2. Zu wenig CPU: 0.1 vCPU zu niedrig → Erhöhe auf 0.25+
3. Zu wenig Memory: 256MB zu niedrig → Erhöhe auf 512MB+

**Optimierung:**
```javascript
// In src/pdf.js: Reduziere deviceScaleFactor
deviceScaleFactor: 1  // statt 2 (reduziert Qualität, aber schneller)
```

### Problem: Health Check failed

**Prüfe:**
1. Service → Logs → Suche nach "health"
2. Teste manuell: `curl $URL/health`
3. Prüfe Port: Muss 3001 sein (wie in Dockerfile)

## 📚 Weiterführende Ressourcen

- **Northflank Docs**: https://northflank.com/docs
- **Northflank CLI**: https://github.com/northflank/cli
- **Playwright Docs**: https://playwright.dev
- **Docker Best Practices**: https://docs.docker.com/develop/dev-best-practices/

## ✅ Deployment Checklist

### Vor dem Deployment
- [ ] Git Repository erstellt und gepusht
- [ ] `Dockerfile` optimiert
- [ ] `northflank.json` konfiguriert
- [ ] API-Key generiert (32+ Zeichen)
- [ ] ALLOWED_ORIGINS definiert

### Während des Deployments
- [ ] Northflank Account erstellt
- [ ] Projekt in EU-Region erstellt
- [ ] Service mit GitHub verbunden
- [ ] Environment Variables gesetzt (inkl. Secrets)
- [ ] Resource Limits konfiguriert (min. 512MB RAM)
- [ ] Health Checks aktiviert
- [ ] Build erfolgreich
- [ ] Service läuft (Status: Running)

### Nach dem Deployment
- [ ] Health Check funktioniert (`/health`)
- [ ] PDF-Generierung funktioniert (`/generate`)
- [ ] API-Key-Validierung funktioniert (401 bei falschem Key)
- [ ] Response Times akzeptabel (<5s erste PDF)
- [ ] Logs ohne Errors
- [ ] Alerts konfiguriert
- [ ] Custom Domain eingerichtet (optional)
- [ ] Vercel Environment Variables updated
- [ ] Integration in EasyManage getestet

---

**Geschätzte Deployment-Zeit**: 30-45 Minuten  
**Kosten**: $20/Monat (Developer Plan empfohlen)  
**Performance**: Besser als Render.com (kein Cold Start, mehr RAM)

🎉 **Viel Erfolg mit Northflank!** 🎉
