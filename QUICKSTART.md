# 🚀 PDF Microservice - Quick Start Guide

## ✅ Was wurde erstellt?

Ein vollständig funktionsfähiger, deploy-barer PDF-Microservice wurde aus deinem EasyManage Nuxt-Projekt extrahiert.

### 📁 Projekt-Struktur

```
pdf-service/
├── src/
│   ├── server.js          ✅ Express-Server mit API endpoints
│   ├── pdf.js             ✅ PDF-Generierungslogik (Playwright + pdf-lib)
│   └── templates/         📁 (Platzhalter für HTML-Templates)
├── package.json           ✅ Dependencies
├── Dockerfile             ✅ Docker-Container
├── render.yaml            ✅ Render.com Deployment-Config
├── .env                   ✅ Lokale Konfiguration
├── .env.example           ✅ Template für Environment Variables
├── .gitignore             ✅ Git-Ignore-Rules
├── .dockerignore          ✅ Docker-Ignore-Rules
├── README.md              ✅ Vollständige Dokumentation
├── DEPLOYMENT.md          ✅ Deployment-Anleitung
├── INTEGRATION.md         ✅ Integration in EasyManage
└── test-service.js        ✅ Test-Suite
```

## 🎯 Nächste Schritte

### 1. Service lokal testen (läuft bereits!)

Der Service läuft bereits auf: **http://localhost:3001**

```bash
# Health Check
curl http://localhost:3001/health

# PDF generieren
curl -X POST http://localhost:3001/generate \
  -H "x-api-key: development-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Test PDF</h1>"}' \
  --output test.pdf
```

### 2. Git Repository erstellen

```bash
cd pdf-service

# Git initialisieren
git init

# Alle Dateien hinzufügen
git add .

# Erster Commit
git commit -m "Initial commit: PDF Generation Microservice"

# Remote Repository hinzufügen (GitHub/GitLab)
git remote add origin https://github.com/DEIN-USERNAME/pdf-service.git

# Pushen
git push -u origin main
```

### 3. Auf Render.com deployen

#### Option A: Über Render Dashboard (empfohlen)

1. Gehe zu [render.com](https://render.com)
2. Klicke **"New +"** → **"Web Service"**
3. Verbinde dein GitHub Repository
4. Wähle `pdf-service` aus
5. Konfiguration:
   - **Name**: `pdf-service`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx playwright install chromium`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     API_KEY=<generiere-einen-sicheren-key>
     ALLOWED_ORIGINS=https://your-app.vercel.app
     ```
6. Klicke **"Create Web Service"**
7. Warten (~5-10 Minuten)
8. ✅ Service ist live!

#### Option B: Mit render.yaml (Blueprint)

```bash
# render.yaml ist bereits erstellt
# Einfach auf Render.com importieren:
# Dashboard → Blueprints → Connect Repository
```

### 4. API-Key generieren

```bash
# Auf Mac/Linux:
openssl rand -hex 32

# Kopiere den Output und setze ihn als API_KEY in Render.com
```

### 5. In dein Nuxt-Projekt integrieren

Siehe **INTEGRATION.md** für Details. Kurz:

1. In `.env` hinzufügen:
   ```bash
   PDF_SERVICE_URL=http://localhost:3001  # lokal
   PDF_SERVICE_API_KEY=development-key-change-in-production
   ```

2. In Vercel Environment Variables:
   ```bash
   PDF_SERVICE_URL=https://your-service.onrender.com
   PDF_SERVICE_API_KEY=<production-key>
   ```

3. `composables/usePdfService.ts` erstellen (siehe INTEGRATION.md)

4. `PdfPreviewModal.vue` anpassen (siehe INTEGRATION.md)

## 🧪 Testing

### Lokaler Test

```bash
cd pdf-service
node test-service.js
```

Oder manuell:

```bash
# Service starten
npm start

# In anderem Terminal:
# 1. Health Check
curl http://localhost:3001/health

# 2. Simple PDF
curl -X POST http://localhost:3001/generate \
  -H "x-api-key: development-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Hello World</h1>"}' \
  --output hello.pdf

# 3. Multi-Page PDF with Footer
curl -X POST http://localhost:3001/generate \
  -H "x-api-key: development-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{
    "html":"<html><head><style>@page{margin:20mm;}.footer{position:fixed;bottom:0;}</style></head><body><h1>Page 1</h1><div style=\"page-break-after:always;\"></div><h1>Page 2</h1><div class=\"footer\">Footer</div></body></html>",
    "pdfFooterDisplay":"firstPage"
  }' \
  --output multi-page.pdf

# 4. Ungültiger API-Key (sollte 401 zurückgeben)
curl -X POST http://localhost:3001/generate \
  -H "x-api-key: wrong-key" \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Test</h1>"}'
```

### Production Test (nach Deployment)

```bash
# Ersetze URL mit deiner Render.com URL
export PDF_SERVICE_URL="https://pdf-service-xxxx.onrender.com"
export PDF_API_KEY="dein-production-key"

# Health Check
curl $PDF_SERVICE_URL/health

# PDF generieren
curl -X POST $PDF_SERVICE_URL/generate \
  -H "x-api-key: $PDF_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Production PDF</h1>"}' \
  --output production.pdf
```

## 📊 Monitoring

### Logs ansehen (Render.com)

1. Gehe zu deinem Service-Dashboard
2. Klicke **"Logs"** Tab
3. Sieh Echtzeit-Logs

Typische Log-Ausgaben:

```
📄 [PDF-Service] Generating PDF: document.pdf
📄 [PDF-Service] Generating PDF (footer mode: all)
✅ [PDF-Service] PDF generated in 2746ms
```

### Health Check

```bash
# Lokal
curl http://localhost:3001/health

# Production
curl https://your-service.onrender.com/health
```

## 🔒 Sicherheit

### API-Key Rotation

1. Generiere neuen Key:
   ```bash
   openssl rand -hex 32
   ```

2. Update in Render.com:
   - Dashboard → Service → Environment → API_KEY
   - Save Changes
   - Service wird automatisch neu gestartet

3. Update in Vercel (Nuxt App):
   - Settings → Environment Variables → PDF_SERVICE_API_KEY
   - Redeploy

### CORS konfigurieren

In `.env` oder Render.com:

```bash
# Nur spezifische Domains erlauben
ALLOWED_ORIGINS=https://app.easymanage.com,https://easymanage.vercel.app

# Alle Domains erlauben (nur für Development!)
ALLOWED_ORIGINS=*
```

## 💰 Kosten

### Render.com Free Tier
- ✅ 750 Stunden/Monat gratis
- ⚠️ Service schläft nach 15 Min Inaktivität
- ⚠️ Cold Start: ~30-60 Sekunden

### Render.com Starter ($7/Monat)
- ✅ Immer online (kein Cold Start)
- ✅ Schnellere Performance
- ✅ 512MB RAM (genug für Chromium)

**Empfehlung**: Starter Plan für Production

## 🛠️ Troubleshooting

### Service läuft nicht

```bash
# Prüfe ob Port 3001 frei ist
lsof -i :3001

# Oder anderen Port verwenden
PORT=3002 npm start
```

### "Chromium not found" Fehler

```bash
# Playwright Chromium installieren
npx playwright install chromium
```

### PDF-Generierung langsam

- Normal: 2-5 Sekunden (erste PDF wegen Chromium-Start)
- Danach: 1-2 Sekunden
- Auf Render.com: Cold Start kann länger dauern

### API-Key funktioniert nicht

- Prüfe Header-Name: muss exakt `x-api-key` sein (lowercase)
- Prüfe, dass `.env` geladen wird
- Restart Service nach `.env` Änderungen

## 📚 Weitere Ressourcen

- **README.md** - Vollständige API-Dokumentation
- **INTEGRATION.md** - Integration in EasyManage Nuxt-Projekt
- **DEPLOYMENT.md** - Detaillierte Deployment-Anleitung
- **test-service.js** - Automatisierte Test-Suite

## ✅ Checklist

### Lokal
- [x] Service läuft auf localhost:3001
- [x] Health-Check funktioniert
- [x] PDF-Generierung funktioniert
- [ ] Test-Suite läuft durch (`node test-service.js`)

### Git
- [ ] Git-Repository erstellt
- [ ] Alle Dateien committed
- [ ] Auf GitHub/GitLab gepusht

### Deployment
- [ ] Render.com Account erstellt
- [ ] Service deployed
- [ ] API-Key gesetzt
- [ ] Production-Test erfolgreich

### Integration
- [ ] `usePdfService.ts` erstellt
- [ ] `nuxt.config.ts` angepasst
- [ ] Environment Variables gesetzt
- [ ] `PdfPreviewModal.vue` updated
- [ ] Lokal getestet (beide Services)
- [ ] Production getestet

## 🎉 Fertig!

Dein PDF-Microservice ist jetzt bereit für Production!

**Lokaler Service**: http://localhost:3001  
**Production Service**: https://your-service.onrender.com  
**API Documentation**: GET /

---

**Fragen?** Siehe README.md oder erstelle ein Issue im Repository.
