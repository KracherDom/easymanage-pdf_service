# PDF Generation Microservice

Ein eigenständiger, deploy-barer Microservice für PDF-Generierung, extrahiert aus dem EasyManage Nuxt-Projekt.

## 🎯 Features

- ✅ **Framework-agnostic**: Reiner Node.js/Express Service
- ✅ **PDF-Generierung**: Playwright + Chromium für High-Fidelity PDFs
- ✅ **PDF Post-Processing**: Unterstützung für Footer-Modi (alle Seiten / nur erste Seite)
- ✅ **API-Key-Authentifizierung**: Sichere Zugriffskontrolle
- ✅ **CORS-Support**: Konfigurierbare Cross-Origin-Requests
- ✅ **Health-Check**: `/health` Endpoint für Monitoring
- ✅ **Docker-ready**: Containerisierung für einfaches Deployment
- ✅ **Northflank/Render.com-ready**: Direkt deploy-bar auf Kubernetes

## 🚀 Quick Start

### Lokal starten

```bash
# Dependencies installieren
npm install

# .env-Datei erstellen
cp .env.example .env
# Öffne .env und setze deine API-Keys

# Service starten
npm start

# Oder im Development-Modus (mit Auto-Reload)
npm run dev
```

Der Service läuft jetzt auf `http://localhost:3001`

### Mit Docker

```bash
# Docker Image bauen
docker build -t pdf-service .

# Container starten
docker run -p 3001:3001 \
  -e API_KEY=your-secret-key \
  -e ALLOWED_ORIGINS=* \
  pdf-service
```

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "pdf-service",
  "version": "1.0.0",
  "timestamp": "2025-11-14T15:30:00.000Z",
  "uptime": 123.456
}
```

### PDF Generierung
```bash
POST /generate
```

**Headers:**
- `x-api-key`: Dein API-Key (required)
- `Content-Type`: application/json

**Body:**
```json
{
  "html": "<html><body><h1>Hello World</h1></body></html>",
  "filename": "document.pdf",
  "pdfFooterDisplay": "all"
}
```

**Parameter:**
- `html` (string, required): HTML-Content der gerendert werden soll
- `filename` (string, optional): Dateiname des PDFs (default: "document.pdf")
- `pdfFooterDisplay` (string, optional): Footer-Modus - `"all"` oder `"firstPage"` (default: "all")

**Response:**
- Content-Type: `application/pdf`
- Binary PDF data

## 🔧 Verwendung

### CURL Beispiel

```bash
curl -X POST http://localhost:3001/generate \
  -H "x-api-key: your-secret-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Test PDF</h1><p>Generated via API</p>"}' \
  --output test.pdf
```

### JavaScript Fetch (Frontend)

#### Production:
```javascript
async function generatePdf(htmlContent) {
  const response = await fetch('https://your-service.onrender.com/generate', {
    method: 'POST',
    headers: {
      'x-api-key': 'your-production-api-key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      html: htmlContent,
      filename: 'rechnung.pdf',
      pdfFooterDisplay: 'firstPage'
    })
  })

  if (!response.ok) {
    throw new Error(`PDF generation failed: ${response.statusText}`)
  }

  // PDF als Blob erhalten
  const pdfBlob = await response.blob()
  
  // Download triggern
  const url = URL.createObjectURL(pdfBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'rechnung.pdf'
  a.click()
  URL.revokeObjectURL(url)
}

// Verwendung
generatePdf('<h1>Meine Rechnung</h1>')
```

#### Development/Testing (Lokaler Service):
```javascript
async function generatePdfLocal(htmlContent) {
  const response = await fetch('http://localhost:3001/generate', {
    method: 'POST',
    headers: {
      'x-api-key': 'development-key-change-in-production',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      html: htmlContent,
      filename: 'test.pdf'
    })
  })

  const pdfBlob = await response.blob()
  const url = URL.createObjectURL(pdfBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'test.pdf'
  a.click()
  URL.revokeObjectURL(url)
}
```

### Node.js Beispiel

```javascript
import fetch from 'node-fetch'
import fs from 'fs'

async function generatePdf() {
  const response = await fetch('http://localhost:3001/generate', {
    method: 'POST',
    headers: {
      'x-api-key': 'your-secret-api-key-here',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      html: '<h1>Server-generated PDF</h1>',
      filename: 'server-pdf.pdf'
    })
  })

  const buffer = await response.buffer()
  fs.writeFileSync('output.pdf', buffer)
  console.log('PDF saved to output.pdf')
}

generatePdf()
```

## 🌐 Deployment (Northflank empfohlen)

### Deployment-Optionen

#### Option 1: Northflank (empfohlen ⭐)
- Kubernetes-basiert
- EU-Datacenter (DSGVO-konform)
- Kein Cold Start
- Bessere Performance
- **Siehe: [NORTHFLANK_DEPLOYMENT.md](NORTHFLANK_DEPLOYMENT.md)**

#### Option 2: Render.com (Alternative)
- Einfacher Setup
- US-Datacenter
- Free Tier verfügbar
- **Siehe unten für Anleitung**

---

## 🚀 Deployment auf Render.com (Alternative)

### Schritt 1: Repository vorbereiten

```bash
# Neues Git-Repository erstellen
git init
git add .
git commit -m "Initial commit: PDF microservice"

# Auf GitHub/GitLab pushen
git remote add origin https://github.com/your-username/pdf-service.git
git push -u origin main
```

### Schritt 2: Render.com Setup

1. Gehe zu [render.com](https://render.com) und melde dich an
2. Klicke auf **"New +"** → **"Web Service"**
3. Verbinde dein GitHub/GitLab Repository
4. Wähle das `pdf-service` Repository aus

### Schritt 3: Service konfigurieren

**Build Settings:**
- **Name**: `pdf-service` (oder eigener Name)
- **Environment**: `Node`
- **Region**: `Frankfurt` (EU) oder `Oregon` (US)
- **Branch**: `main`
- **Build Command**: `npm install && npx playwright install chromium`
- **Start Command**: `npm start`

**Environment Variables:**
Füge folgende Umgebungsvariablen hinzu:

| Key | Value | Beschreibung |
|-----|-------|--------------|
| `NODE_ENV` | `production` | Umgebung |
| `API_KEY` | `[generiere einen sicheren Key]` | API-Authentifizierung |
| `ALLOWED_ORIGINS` | `https://your-app.com` | CORS Origins (comma-separated) |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | `0` | Playwright Browser installieren |

**Sicheren API-Key generieren:**
```bash
# Auf deinem Mac/Linux:
openssl rand -hex 32

# Oder online:
# https://www.random.org/strings/
```

### Schritt 4: Deployen

1. Klicke auf **"Create Web Service"**
2. Render baut und deployed automatisch
3. Nach ~5-10 Minuten ist der Service live
4. URL: `https://pdf-service-xxxx.onrender.com`

### Schritt 5: Testen

```bash
# Health Check
curl https://pdf-service-xxxx.onrender.com/health

# PDF generieren
curl -X POST https://pdf-service-xxxx.onrender.com/generate \
  -H "x-api-key: YOUR_PRODUCTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Production PDF</h1>"}' \
  --output production.pdf
```

## 🔒 Sicherheit

### API-Key-Authentifizierung

Alle Requests an `/generate` benötigen einen API-Key im Header:

```bash
x-api-key: your-secret-api-key-here
```

**Wichtig:**
- ⚠️ Verwende NIEMALS den Development-Key in Production
- ✅ Generiere einen starken, zufälligen Key (min. 32 Zeichen)
- ✅ Speichere den Key sicher (Umgebungsvariable, Secrets Manager)
- ✅ Rotiere den Key regelmäßig

### CORS-Konfiguration

Beschränke `ALLOWED_ORIGINS` auf deine tatsächlichen Domains:

```bash
# .env
ALLOWED_ORIGINS=https://app.easymanage.com,https://easymanage.vercel.app
```

### Rate Limiting (Optional)

Für Production wird empfohlen, Rate Limiting hinzuzufügen:

```bash
npm install express-rate-limit
```

## 📊 Monitoring

### Logs anzeigen (Render.com)

1. Gehe zu deinem Service-Dashboard auf Render.com
2. Klicke auf **"Logs"** Tab
3. Sieh Echtzeit-Logs und Fehler

### Health Checks

Render.com prüft automatisch `/health` alle 30 Sekunden:

```json
{
  "status": "healthy",
  "uptime": 3600.5
}
```

## 🛠️ Development

### Lokale Entwicklung

```bash
# Mit Auto-Reload
npm run dev

# Test-Request
curl -X POST http://localhost:3001/generate \
  -H "x-api-key: development-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Test</h1>"}' \
  --output test.pdf
```

### Debugging

```bash
# Node.js mit Inspect-Modus
node --inspect src/server.js

# Dann Chrome DevTools öffnen: chrome://inspect
```

## 📦 Integration in EasyManage

### Beispiel: PDF-Preview ersetzen

In deinem Nuxt-Projekt (`PdfPreviewModal.vue`):

```javascript
async function generatePdfPreview() {
  try {
    isLoadingPreview.value = true
    
    // HTML generieren (wie bisher)
    const html = generatePdfHtml({
      form: props.form,
      type: props.type,
      // ... weitere Parameter
    })
    
    // OPTION 1: Lokaler Service (Development)
    const endpoint = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3001/generate'
      : 'https://your-pdf-service.onrender.com/generate'
    
    // OPTION 2: Immer Remote-Service
    // const endpoint = 'https://your-pdf-service.onrender.com/generate'
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.PDF_SERVICE_API_KEY || 'development-key',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html,
        filename: `${props.type}_${Date.now()}.pdf`,
        pdfFooterDisplay: footerDisplay.value
      })
    })
    
    if (!response.ok) {
      throw new Error(`PDF Service error: ${response.statusText}`)
    }
    
    const pdfBlob = await response.blob()
    pdfPreviewUrl.value = URL.createObjectURL(pdfBlob)
    
  } catch (error) {
    console.error('PDF generation failed:', error)
  } finally {
    isLoadingPreview.value = false
  }
}
```

## 🔧 Troubleshooting

### Problem: "Chromium not found"

**Lösung:**
```bash
# Playwright Chromium installieren
npx playwright install chromium
```

### Problem: "Out of memory" auf Render.com

**Lösung:**
- Upgrade auf einen größeren Render.com Plan (min. 1GB RAM empfohlen)
- Oder: Reduziere `deviceScaleFactor` in `src/pdf.js` von 2 auf 1

### Problem: "API key invalid"

**Lösung:**
- Stelle sicher, dass der Header exakt `x-api-key` heißt (lowercase)
- Prüfe, dass der Key in `.env` korrekt gesetzt ist
- Restart den Service nach Änderung der Umgebungsvariablen

### Problem: Langsame PDF-Generierung

**Normal:** 2-5 Sekunden für erste PDF (Chromium-Start)
**Danach:** ~1-2 Sekunden

**Optimierung:**
- Verwende Render.com's "Keep Service Alive" (verhindert Cold Starts)
- Oder: Upgrade auf einen "Reserved Instance" Plan

## 📝 Changelog

### Version 1.0.0 (2025-11-14)
- ✅ Initial release
- ✅ PDF-Generierung mit Playwright
- ✅ PDF Post-Processing (Footer-Modi)
- ✅ API-Key-Authentifizierung
- ✅ Docker-Support
- ✅ Render.com Deployment-ready

## 📄 Lizenz

MIT License - siehe LICENSE file

## 🤝 Support

Bei Fragen oder Problemen:
- Erstelle ein Issue im Repository
- Oder kontaktiere: support@easymanage.com

---

**Erstellt von:** EasyManage Team  
**Extrahiert aus:** EasyManage Nuxt Project  
**Version:** 1.0.0
