# Deployment Guide - Railway.com

Dieses Dokument beschreibt das Deployment des PDF-Service auf **Railway.com**.

Für eine ausführliche Railway.com-Anleitung siehe: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

---

## 🚀 Quick Deploy

### 1. Railway.com Account

1. Gehe zu [railway.app](https://railway.app)
2. Login mit GitHub
3. Du erhältst **$5 Startguthaben** 🎉

### 2. Repository vorbereiten

```bash
cd pdf-service

# Git initialisieren
git init
git add .
git commit -m "PDF Service for Railway.com"

# Auf GitHub pushen
git remote add origin https://github.com/USERNAME/pdf-service.git
git push -u origin main
```

### 3. Deployment

#### Via Railway Dashboard (empfohlen)

1. **"New Project"** → **"Deploy from GitHub repo"**
2. Repository auswählen
3. Railway erkennt `Dockerfile` automatisch ✅
4. **Environment Variables** setzen:
   ```bash
   NODE_ENV=production
   API_KEY=<generiere-mit-openssl>
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
5. Deploy starten (~2-3 Minuten)
6. **"Generate Domain"** für Public URL

#### Via Railway CLI

```bash
# Railway CLI installieren
npm install -g @railway/cli

# Login & initialisieren
railway login
railway init

# Variables setzen
railway variables set NODE_ENV=production
railway variables set API_KEY=$(openssl rand -hex 32)
railway variables set ALLOWED_ORIGINS=https://app-easymanage-at.netlify.app/  

# Deployen
railway up

# Domain generieren
railway domain
```

---

## 📋 Environment Variables

**Pflicht-Variablen:**

| Variable | Wert | Beschreibung |
|----------|------|--------------|
| `NODE_ENV` | `production` | Node.js Umgebung |
| `API_KEY` | `<32-char-hex>` | API-Authentifizierung |
| `ALLOWED_ORIGINS` | `https://app.com` | CORS Whitelist |

**API-Key generieren:**
```bash
openssl rand -hex 32
   cp .env.example .env
   # Edit .env and set your API_KEY
   ```

3. **Start the service:**
   ```bash
   npm start
   ```

4. **Test the service:**
   ```bash
   node test-service.js
   ```

## Deployment

See full [README.md](README.md) for detailed deployment instructions.

### Render.com Quick Deploy

1. Push to GitHub/GitLab
2. Connect to Render.com
3. Deploy with `render.yaml` configuration
4. Set environment variables
5. Done!

## API Endpoints

- `GET /health` - Health check
- `POST /generate` - Generate PDF from HTML (requires API key)

See [README.md](README.md) for full API documentation and examples.

## License

MIT
