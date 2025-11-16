# Railway.com Deployment Guide - PDF Service

Vollständige Anleitung für das Deployment des PDF-Microservice auf Railway.com.

## 🚂 Warum Railway.com?

Railway ist eine moderne Cloud-Plattform, die sich perfekt für Microservices eignet:

| Feature | Railway.com | Render.com | Vercel |
|---------|-------------|------------|--------|
| **Setup-Zeit** | ⚡ 2-3 Minuten | 🐢 5-10 Minuten | ❌ Nicht für Chromium |
| **Cold Start** | ❌ Kein (Hobby+) | ✅ Ja (Free) | ✅ Ja (Functions) |
| **Dockerfile Support** | ✅ Automatisch | ✅ Manuell | ❌ Nein |
| **Free Credits** | 💰 $5 Start | ✅ 750h Free | ❌ Nur Frontend |
| **Region Choice** | 🌍 US + EU | 🇺🇸 Nur US | 🌍 Global |
| **Deployment Speed** | ⚡ 2-3 Min | 🐢 5-10 Min | ⚡ 30s |
| **Environment Vars** | ✅ UI + CLI | ✅ UI | ✅ UI |
| **Custom Domains** | ✅ Kostenlos | ✅ Kostenlos | ✅ Kostenlos |
| **Monitoring** | ✅ Integriert | ⚠️ Basic | ✅ Analytics |
| **Kosten (Hobby)** | $5/Monat | $7/Monat | - |

**Empfehlung**: Railway.com für die beste Balance aus Einfachheit, Performance und Preis.

---

## 🚀 Deployment in 3 Schritten

### Schritt 1: Railway Account erstellen

1. Gehe zu [railway.app](https://railway.app)
2. Klicke **"Start a New Project"**
3. Login mit **GitHub** (empfohlen)
4. Railway gibt dir **$5 Startguthaben** 🎉

### Schritt 2: Git Repository vorbereiten

```bash
cd pdf-service

# Git initialisieren (falls noch nicht geschehen)
git init
git add .
git commit -m "PDF Service for Railway.com"

# Auf GitHub pushen
git remote add origin https://github.com/DEIN-USERNAME/pdf-service.git
git push -u origin main
```

### Schritt 3: Service auf Railway deployen

#### Option A: Via Railway Dashboard (empfohlen für Einsteiger)

1. **Dashboard** → **"New Project"**

2. **"Deploy from GitHub repo"** wählen

3. **Repository auswählen**:
   - Wähle dein `pdf-service` Repository
   - Railway fragt nach GitHub-Zugriff → Authorisieren

4. **Auto-Detection**:
   - Railway erkennt automatisch das `Dockerfile` ✅
   - Kein zusätzlicher Setup nötig!

5. **Environment Variables setzen**:
   
   Klicke auf dein Deployment → **"Variables"** Tab:
   
   ```bash
   NODE_ENV=production
   API_KEY=<generiere-mit-openssl-rand-hex-32>
   ALLOWED_ORIGINS=https://your-app.vercel.app
   PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0
   ```
   
   **API-Key generieren**:
   ```bash
   openssl rand -hex 32
   # Kopiere den Output
   ```

6. **Deploy starten**:
   - Railway startet automatisch das Deployment
   - Build dauert ~2-3 Minuten
   - Status siehst du Live im Dashboard

7. **Public URL generieren**:
   - Klicke auf **"Settings"** Tab
   - Unter **"Networking"** → **"Generate Domain"**
   - Du erhältst eine URL wie: `https://pdf-service-production-xxxx.up.railway.app`

8. **Fertig!** 🎉
   - Service ist live
   - Auto-Deploy bei jedem Git Push aktiviert

#### Option B: Via Railway CLI (für Fortgeschrittene)

```bash
# Railway CLI installieren
npm install -g @railway/cli

# Login
railway login

# Neues Projekt erstellen
railway init

# Projekt-Name eingeben: pdf-service

# Environment Variables setzen
railway variables set NODE_ENV=production
railway variables set API_KEY=$(openssl rand -hex 32)
railway variables set ALLOWED_ORIGINS=https://your-app.vercel.app
railway variables set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

# Deployen
railway up

# Public URL generieren
railway domain
```

---

## 🔧 Konfiguration & Einstellungen

### Environment Variables

**Pflicht-Variablen:**

| Variable | Wert | Beschreibung |
|----------|------|--------------|
| `NODE_ENV` | `production` | Node.js Umgebung |
| `API_KEY` | `<32-char-hex>` | API-Authentifizierung (Secret!) |
| `ALLOWED_ORIGINS` | `https://app.com` | CORS Whitelist (comma-separated) |

**Optional:**

| Variable | Wert | Beschreibung |
|----------|------|--------------|
| `PORT` | `3001` | Server Port (Railway setzt automatisch) |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | `0` | Playwright Browser installieren |
| `LOG_LEVEL` | `info` | Logging-Level |

**Secrets setzen** (via Dashboard):
1. Deployment → **"Variables"** Tab
2. Klicke **"New Variable"**
3. Für `API_KEY`: Aktiviere 🔒 **"Secret"** Toggle
4. Wert wird verschlüsselt gespeichert

### Resource Limits

**Automatische Limits** (Railway verwaltet diese):
- CPU: Dynamisch (shared)
- Memory: 512MB (Hobby), bis 8GB (Pro)
- Disk: 10GB (Hobby), 50GB (Pro)

**Für PDF-Service empfohlen:**
- Memory: Min. 512MB (für Chromium)
- Plan: **Hobby ($5/Monat)** oder höher

**Memory erhöhen** (falls OOM-Errors):
1. Upgrade zu **Pro Plan** ($20/Monat)
2. Memory wird automatisch angepasst

### Custom Domain einrichten

1. **Service** → **"Settings"** → **"Networking"**
2. **"Custom Domain"** klicken
3. Domain eingeben: `pdf.easymanage.com`
4. DNS bei deinem Provider konfigurieren:
   ```
   CNAME pdf.easymanage.com → pdf-service-production-xxxx.up.railway.app
   ```
5. SSL-Zertifikat wird automatisch generiert (Let's Encrypt)
6. Nach ~5 Minuten: ✅ Domain aktiv

### Health Checks

Railway überwacht automatisch:
- **HTTP Health Check**: GET `/health` alle 30s
- **Container Status**: Automatischer Neustart bei Crash
- **Build Status**: Email-Benachrichtigung bei Fehlern

**Manuell testen:**
```bash
curl https://pdf-service-production-xxxx.up.railway.app/health
```

---

## 📊 Monitoring & Logs

### Live-Logs ansehen

**Via Dashboard:**
1. Service → **"Deployments"** Tab
2. Klicke auf aktives Deployment
3. **"Logs"** → Live-Stream

**Via CLI:**
```bash
railway logs
# Oder mit Follow-Mode:
railway logs --follow
```

**Log-Filter:**
```bash
# Nur Errors
railway logs | grep "ERROR"

# PDF-Generierungen
railway logs | grep "PDF-Service"

# Letzte 100 Zeilen
railway logs --tail 100
```

### Metriken

**Via Dashboard:**
1. Service → **"Metrics"** Tab
2. Zeigt:
   - CPU Usage (%)
   - Memory Usage (MB)
   - Network Traffic (MB)
   - Request Count
   - Response Times

**Alerts konfigurieren:**
1. **Settings** → **"Alerts"**
2. **"New Alert"** → z.B. "Memory > 90%"
3. Email oder Webhook

### Performance Monitoring

**Response Times überwachen:**

Typische Werte:
- Health Check: ~50-100ms
- Erste PDF: 2-5 Sekunden (Chromium-Start)
- Weitere PDFs: 1-2 Sekunden

**Bei langsamen Requests:**
1. Prüfe Logs: `railway logs | grep "PDF-Service"`
2. Prüfe Memory: Dashboard → Metrics
3. Ggf. Plan upgraden (mehr RAM)

---

## 💰 Kosten & Abrechnung

### Pricing-Übersicht

**Trial (Startguthaben):**
- 💰 **$5 kostenlos** bei Registrierung
- Gültig für alle Services
- Kein Credit-Card nötig

**Hobby Plan:**
- 💰 **$5/Monat**
- 512MB RAM pro Service
- 1 vCPU (shared)
- Unlimited Builds/Deployments
- **Empfohlen für PDF-Service**

**Pro Plan:**
- 💰 **$20/Monat** (pro User)
- Bis 8GB RAM pro Service
- Mehr CPU
- Priority Support
- Für Production mit hoher Last

### Kosten-Rechner

**Szenario 1: Development/Testing**
- Plan: Trial ($5 Guthaben)
- Service: 1x PDF-Service
- Laufzeit: ~1 Monat
- **Kosten**: $0 (Guthaben reicht)

**Szenario 2: Production (Low Traffic)**
- Plan: Hobby ($5/Monat)
- Service: 1x PDF-Service
- RAM: 512MB
- **Kosten**: $5/Monat = $60/Jahr

**Szenario 3: Production (High Traffic)**
- Plan: Pro ($20/Monat)
- Service: 1x PDF-Service
- RAM: 2GB
- **Kosten**: $20/Monat = $240/Jahr

**Vergleich mit Alternativen:**

| Plattform | Free | Paid | Chromium Support |
|-----------|------|------|------------------|
| Railway | $5 Credit | $5/Monat | ✅ Excellent |
| Render | 750h Free | $7/Monat | ✅ Good |
| Vercel | ✅ | $20/Monat | ❌ Nein |
| Heroku | ❌ | $7/Monat | ⚠️ Schlecht |

**Kosten optimieren:**
- ✅ Nutze Trial-Guthaben zum Testen
- ✅ Hobby Plan reicht für die meisten Use Cases
- ✅ Teile Railway-Account für mehrere Microservices

---

## 🔐 Sicherheit

### API-Key Management

**Best Practices:**

1. **Generiere starken Key:**
   ```bash
   openssl rand -hex 32
   # Output: 64-Zeichen-Hex-String
   ```

2. **Als Secret speichern:**
   - Railway Dashboard → Variables → 🔒 Secret-Toggle
   - Niemals in Code committen!

3. **Key rotieren** (alle 90 Tage):
   ```bash
   # Neuen Key generieren
   NEW_KEY=$(openssl rand -hex 32)
   
   # In Railway setzen
   railway variables set API_KEY=$NEW_KEY
   
   # Service restarted automatisch
   
   # Update auch in Vercel!
   ```

### CORS-Konfiguration

**Sichere Einstellung:**

```bash
# NUR spezifische Domains erlauben
ALLOWED_ORIGINS=https://app.easymanage.com,https://easymanage.vercel.app

# NICHT in Production:
ALLOWED_ORIGINS=*  # ⚠️ Unsicher!
```

**CORS-Header prüfen:**
```bash
curl -H "Origin: https://app.easymanage.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://your-service.railway.app/generate
```

### SSL/TLS

**Automatisch aktiviert:**
- ✅ Railway generiert SSL-Zertifikat (Let's Encrypt)
- ✅ HTTPS erzwungen (HTTP → HTTPS Redirect)
- ✅ TLS 1.2+ Support
- ✅ Automatische Renewal

**Zertifikat prüfen:**
```bash
openssl s_client -connect your-service.railway.app:443 -servername your-service.railway.app
```

### Network Security

**IP-Whitelisting** (nur Pro Plan):
1. Settings → Security → IP Whitelist
2. Füge Vercel IP-Ranges hinzu
3. Alle anderen IPs blockiert

**Rate Limiting** (app-level):
```javascript
// Optional in src/server.js
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100 // Max 100 requests pro IP
})

app.use('/generate', limiter)
```

---

## 🔄 CI/CD Pipeline

### Auto-Deploy Setup

**Standard (automatisch aktiv):**

1. Push zu `main` Branch
2. Railway erkennt Änderung
3. Baut neues Docker Image
4. Deployed automatisch (zero-downtime)
5. Email-Benachrichtigung bei Erfolg/Fehler

**Deploy-Trigger konfigurieren:**

Railway Dashboard → Settings → Deploy Triggers:
- ✅ Push to main
- ✅ Pull Request merged
- ❌ Manual deploys only

### Preview Deployments

**Für Pull Requests:**

1. **Settings** → **"PR Deploys"** aktivieren
2. Jeder PR bekommt eigene URL:
   ```
   https://pdf-service-pr-123.up.railway.app
   ```
3. Teste neue Features isoliert
4. Nach Merge: Auto-Deploy zu Production

**Beispiel Workflow:**
```bash
# Feature-Branch erstellen
git checkout -b feature/faster-pdf

# Änderungen machen
# ... code changes ...

# Commit & Push
git add .
git commit -m "Optimize PDF generation speed"
git push origin feature/faster-pdf

# PR erstellen auf GitHub
# Railway erstellt automatisch Preview-URL

# Nach Tests: PR mergen
# Railway deployed automatisch zu Production
```

### Rollback

**Zu vorherigem Deployment zurückkehren:**

Via Dashboard:
1. **Deployments** Tab
2. Finde funktionierende Version
3. Klicke **"⋯"** → **"Redeploy"**

Via CLI:
```bash
# Liste alle Deployments
railway deployments

# Rollback zu spezifischem Deployment
railway rollback <deployment-id>
```

---

## 🧪 Testing

### Lokaler Test (vor Deployment)

```bash
# Service lokal starten
npm start

# Health Check
curl http://localhost:3001/health

# PDF generieren
curl -X POST http://localhost:3001/generate \
  -H "x-api-key: development-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Local Test</h1>"}' \
  --output local-test.pdf
```

### Production Test (nach Deployment)

```bash
# Setze deine Railway URL
export PDF_SERVICE_URL="https://pdf-service-production-xxxx.up.railway.app"
export PDF_API_KEY="dein-production-api-key"

# Health Check
curl $PDF_SERVICE_URL/health

# PDF generieren
curl -X POST $PDF_SERVICE_URL/generate \
  -H "x-api-key: $PDF_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Railway Production Test</h1>"}' \
  --output railway-test.pdf

# PDF öffnen
open railway-test.pdf  # macOS
xdg-open railway-test.pdf  # Linux
```

### Load Testing

```bash
# Mit Apache Bench
ab -n 100 -c 10 \
  -H "x-api-key: $PDF_API_KEY" \
  -H "Content-Type: application/json" \
  -p payload.json \
  $PDF_SERVICE_URL/generate

# Mit Artillery
npm install -g artillery
artillery quick \
  --count 50 \
  --num 10 \
  --header "x-api-key: $PDF_API_KEY" \
  $PDF_SERVICE_URL/health
```

---

## 🆘 Troubleshooting

### Problem: Build schlägt fehl

**Symptom:**
```
Error: Failed to build Dockerfile
```

**Lösung 1: Build-Logs prüfen**
- Dashboard → Deployments → Failed Build → **"View Logs"**
- Suche nach Error-Messages

**Lösung 2: Playwright Installation**
```dockerfile
# In Dockerfile: Stelle sicher, dass --with-deps verwendet wird
RUN npx playwright install --with-deps chromium
```

**Lösung 3: Rebuild triggern**
```bash
railway up --force
```

### Problem: Service startet nicht

**Symptom:**
```
Container exited with code 1
```

**Lösung: Runtime-Logs prüfen**
```bash
railway logs | grep "error"
```

**Häufige Fehler:**
- `PORT not set` → Railway setzt PORT automatisch, verwende `process.env.PORT`
- `Chromium not found` → `--with-deps` fehlt im Dockerfile
- `Out of memory` → Upgrade zu Pro Plan (mehr RAM)

### Problem: PDF-Generierung langsam

**Symptom:**
- Erste PDF: > 10 Sekunden
- Weitere PDFs: > 5 Sekunden

**Diagnose:**
```bash
railway logs | grep "PDF generated in"
```

**Lösungen:**

1. **Memory erhöhen** (Pro Plan):
   - Mehr RAM = schnellere Chromium-Performance

2. **DeviceScaleFactor reduzieren**:
   ```javascript
   // In src/pdf.js
   deviceScaleFactor: 1  // statt 2
   ```

3. **Region optimieren**:
   - Settings → Region → Wähle näher zu deinen Usern

### Problem: "API key invalid"

**Symptom:**
```json
{"error":"Unauthorized","message":"Invalid API key"}
```

**Lösung:**

1. **Prüfe Environment Variable:**
   ```bash
   railway variables
   # API_KEY sollte gesetzt sein
   ```

2. **Header-Name prüfen:**
   ```bash
   # MUSS lowercase sein:
   x-api-key: your-key
   
   # NICHT:
   X-API-Key: your-key
   ```

3. **Key neu generieren:**
   ```bash
   railway variables set API_KEY=$(openssl rand -hex 32)
   ```

### Problem: CORS Errors

**Symptom:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS
```

**Lösung:**

1. **ALLOWED_ORIGINS prüfen:**
   ```bash
   railway variables | grep ALLOWED_ORIGINS
   ```

2. **Origin hinzufügen:**
   ```bash
   railway variables set ALLOWED_ORIGINS=https://app1.com,https://app2.com
   ```

3. **Restart Service:**
   - Automatisch nach Variable-Änderung

---

## 📚 Weiterführende Ressourcen

- **Railway Docs**: https://docs.railway.app
- **Railway CLI**: https://docs.railway.app/develop/cli
- **Playwright Docs**: https://playwright.dev
- **Docker Best Practices**: https://docs.docker.com/develop/dev-best-practices/
- **Railway Discord**: https://discord.gg/railway (Community Support)

---

## ✅ Deployment Checklist

### Vor dem Deployment
- [ ] Git Repository erstellt
- [ ] `Dockerfile` optimiert (--with-deps)
- [ ] `railway.json` konfiguriert (optional)
- [ ] API-Key generiert (32+ Zeichen)
- [ ] ALLOWED_ORIGINS definiert

### Während des Deployments
- [ ] Railway Account erstellt
- [ ] GitHub Repository verbunden
- [ ] Environment Variables gesetzt
- [ ] API_KEY als Secret markiert
- [ ] Build erfolgreich (~2-3 Minuten)
- [ ] Service läuft (Status: Active)
- [ ] Public URL generiert

### Nach dem Deployment
- [ ] Health Check funktioniert
- [ ] PDF-Generierung funktioniert
- [ ] API-Key-Validierung funktioniert (401 bei falschem Key)
- [ ] Response Times akzeptabel (<5s erste PDF)
- [ ] Logs ohne Errors
- [ ] Custom Domain eingerichtet (optional)
- [ ] Vercel ENV Variables aktualisiert
- [ ] Integration in EasyManage getestet

---

## 🎯 Zusammenfassung

**Railway.com Vorteile für PDF-Service:**

✅ **Einfachstes Setup**: 2-3 Minuten von Git-Push bis Live  
✅ **Automatische Erkennung**: Dockerfile wird sofort erkannt  
✅ **$5 Startguthaben**: Kostenlos zum Testen  
✅ **Kein Cold Start**: Service bleibt warm (Hobby+)  
✅ **Integriertes Monitoring**: Logs, Metrics, Alerts  
✅ **Auto-Deploy**: Bei jedem Git Push  
✅ **Preview Deployments**: Für Pull Requests  
✅ **Flexible Regionen**: US + EU  

**Kosten:** $5/Monat (Hobby) - Perfekt für Production  
**Performance:** Exzellent für Chromium/Playwright  
**Empfehlung:** ⭐⭐⭐⭐⭐ Beste Wahl für PDF-Microservice

---

**Geschätzte Deployment-Zeit**: 15-20 Minuten (inkl. Testing)  
**Schwierigkeitsgrad**: ⭐☆☆☆☆ Sehr einfach  

🚂 **Viel Erfolg mit Railway.com!** 🚂
