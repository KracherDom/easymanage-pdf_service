# JWT Authentication Guide - PDF Service

## 🔐 Übersicht

Der PDF-Service nutzt jetzt **Supabase JWT-Authentifizierung** statt API-Keys:

- ✅ **Frontend (Nuxt)**: Sendet Supabase Access Token im Authorization Header
- ✅ **PDF-Service (Railway)**: Verifiziert JWT mit Supabase Auth
- ✅ **Development**: JWT-Check optional (skip wenn Supabase nicht konfiguriert)
- ✅ **Production**: JWT zwingend erforderlich

---

## 🚀 Setup

### 1. Frontend (Nuxt App)

**Keine Änderungen nötig!** Der `usePdfService` Composable wurde aktualisiert:

```typescript
// composables/usePdfService.ts
async function generatePdfViaRailway(...) {
  // Holt automatisch Supabase Session
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  // Sendet JWT im Authorization Header
  const response = await fetch(`${serviceUrl}/generate`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    ...
  })
}
```

**Voraussetzung**: User muss eingeloggt sein (bereits durch `middleware/auth.ts` gewährleistet)

---

### 2. PDF-Service (Railway)

#### Lokale Entwicklung

```bash
cd pdf-service

# Kopiere Supabase Credentials
# SUPABASE_URL und SUPABASE_ANON_KEY sind bereits in .env

# Installiere Dependencies (falls noch nicht geschehen)
npm install

# Starte Service
npm start
```

**Output sollte zeigen:**
```
✅ Supabase client initialized for JWT verification
Auth: ✅ Supabase JWT enabled
```

#### Railway Deployment

**Environment Variables auf Railway setzen:**

```bash
# Via Railway CLI
railway variables set SUPABASE_URL=https://rbitryvfkvlxyjevwoxm.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
railway variables set ALLOWED_ORIGINS=https://your-app.netlify.app

# Oder via Railway Dashboard:
# Service → Variables → Add Variable
```

**Benötigte Variables:**
- `SUPABASE_URL` - Deine Supabase Project URL
- `SUPABASE_ANON_KEY` - Supabase Anon/Public Key (nicht Service Role!)
- `ALLOWED_ORIGINS` - Netlify URL deiner App

---

## 🔄 Wie funktioniert die JWT-Authentifizierung?

### Flow-Diagramm:

```
┌─────────────────┐
│  Nuxt Frontend  │
│   (Netlify)     │
└────────┬────────┘
         │
         │ 1. User logged in?
         │    → useSupabaseUser()
         │
         │ 2. Get JWT Token
         │    → session.access_token
         │
         │ 3. POST /generate
         │    Authorization: Bearer <token>
         │
         ▼
┌─────────────────┐
│  PDF Service    │
│   (Railway)     │
└────────┬────────┘
         │
         │ 4. Verify JWT
         │    → supabase.auth.getUser(token)
         │
         │ 5. Valid? → Generate PDF
         │    Invalid? → 401 Unauthorized
         │
         ▼
    PDF Response
```

### Middleware-Logik:

```javascript
// pdf-service/src/server.js
async function verifySupabaseJWT(req, res, next) {
  // Skip in development (wenn Supabase nicht konfiguriert)
  if (!supabase) {
    return next()
  }
  
  // Extract Bearer token
  const token = req.headers['authorization']?.substring(7)
  
  // Verify with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  req.user = user  // Attach user to request
  next()
}
```

---

## 🧪 Testing

### Lokaler Test (Development)

```bash
# Terminal 1: Nuxt Frontend
cd /Users/philiprosenecker/Projects/easymanage-nuxt
npm run dev
# → http://localhost:3000

# Terminal 2: PDF Service (optional - nur wenn du PDF-Service lokal testen willst)
cd pdf-service
npm start
# → http://localhost:3001
```

**PDF generieren:**
1. Login in Nuxt App
2. Rechnung/Angebot erstellen
3. PDF Preview öffnen
4. Console sollte zeigen:
   ```
   💻 Using local PDF service: /api/generate-pdf
   ✅ PDF generated locally
   ```

**Mit lokalem PDF-Service testen:**
```bash
# Setze temporär Railway URL auf localhost
export PDF_SERVICE_URL=http://localhost:3001

npm run dev
```

Console sollte zeigen:
```
🚂 Using Railway PDF service: http://localhost:3001
✅ Authenticated user: user@example.com (uuid)
✅ PDF generated via Railway
```

---

### Production Test (Netlify → Railway)

**Vorbereitung:**
1. ✅ Railway PDF-Service deployed mit Supabase ENV Variables
2. ✅ Netlify App deployed mit `PDF_SERVICE_URL` gesetzt
3. ✅ User in Nuxt App eingeloggt

**Test:**
1. Öffne Netlify App
2. Generiere PDF (Rechnung/Angebot)
3. Browser DevTools → Network Tab
4. Suche Request zu Railway (`/generate`)
5. Prüfe Headers:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
6. Response sollte 200 OK sein mit PDF

**Railway Logs prüfen:**
```bash
railway logs --follow

# Sollte zeigen:
# ✅ Authenticated user: user@example.com (uuid)
# 📄 [PDF-Service] Generating PDF
# ✅ PDF generated in 1234ms
```

---

## 🛠️ Troubleshooting

### Problem: "No active session - user must be logged in"

**Symptom:**
```javascript
Error: No active session - user must be logged in
```

**Ursache:** User ist nicht eingeloggt oder Session abgelaufen.

**Lösung:**
1. Prüfe ob `useSupabaseUser()` einen User zurückgibt
2. Login erneut
3. Prüfe Supabase Session: `supabase.auth.getSession()`

---

### Problem: "Invalid or expired token" (401)

**Symptom:**
```json
{"error":"Unauthorized","message":"Invalid or expired token"}
```

**Railway Logs zeigen:**
```
❌ JWT verification failed: Invalid token
```

**Mögliche Ursachen:**

1. **Token abgelaufen**
   ```bash
   # Lösung: Frontend refresht Token automatisch
   # Oder User muss neu einloggen
   ```

2. **Falsche Supabase Credentials auf Railway**
   ```bash
   # Prüfe Railway Variables
   railway variables | grep SUPABASE
   
   # Sollte zeigen:
   # SUPABASE_URL=https://rbitryvfkvlxyjevwoxm.supabase.co
   # SUPABASE_ANON_KEY=eyJhbGci...
   ```

3. **SUPABASE_ANON_KEY vs SERVICE_ROLE_KEY verwechselt**
   ```bash
   # ⚠️ WICHTIG: Nutze ANON_KEY, nicht SERVICE_ROLE_KEY!
   # ANON_KEY: Für JWT-Verifikation (öffentlich)
   # SERVICE_ROLE_KEY: Für Admin-Operationen (geheim!)
   ```

---

### Problem: JWT-Check wird übersprungen (Development)

**Symptom:**
```
👨‍💻 Development mode: Skipping JWT verification
```

**Ursache:** `SUPABASE_URL` oder `SUPABASE_ANON_KEY` nicht in PDF-Service `.env` gesetzt.

**Lösung:**
```bash
# pdf-service/.env
SUPABASE_URL=https://rbitryvfkvlxyjevwoxm.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...

# Service neustarten
npm start
```

---

### Problem: CORS Error

**Symptom:**
```
Access to fetch at 'https://...railway.app/generate' from origin 'https://...netlify.app' 
has been blocked by CORS policy
```

**Lösung:**
```bash
# Railway: ALLOWED_ORIGINS muss Netlify URL enthalten
railway variables set ALLOWED_ORIGINS=https://your-app.netlify.app

# Mehrere Origins (comma-separated)
railway variables set ALLOWED_ORIGINS=https://app.netlify.app,https://app-staging.netlify.app

# Service restartet automatisch
```

---

## ✅ Security Best Practices

### 1. **Nutze ANON_KEY, nicht SERVICE_ROLE_KEY**

```bash
# ✅ RICHTIG (Railway PDF-Service)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ❌ FALSCH
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # NUR im Nuxt Backend!
```

**Warum?**
- `ANON_KEY` kann JWT verifizieren (ausreichend für PDF-Service)
- `SERVICE_ROLE_KEY` bypassed RLS → Sicherheitsrisiko wenn exposed

---

### 2. **CORS richtig konfigurieren**

```bash
# ✅ RICHTIG (Production)
ALLOWED_ORIGINS=https://your-app.netlify.app

# ❌ FALSCH (Security-Risk)
ALLOWED_ORIGINS=*
```

---

### 3. **Token-Refresh automatisch**

Nuxt Supabase Module handled Token-Refresh automatisch:
```typescript
// nuxt.config.ts
supabase: {
  clientOptions: {
    auth: {
      persistSession: true,
      autoRefreshToken: true,  // ✅ Enabled
    },
  },
}
```

---

### 4. **Railway Environment Secrets**

Markiere sensitive Variables als "Secret" im Railway Dashboard:
- ✅ `SUPABASE_ANON_KEY` → Secret
- ✅ `SUPABASE_URL` → Kann public bleiben (ist eh in Frontend)

---

## 📊 Monitoring

### Railway Logs überwachen

```bash
railway logs --follow

# Erfolgreiche Authentifizierung:
# ✅ Authenticated user: user@example.com (uuid)

# Fehlgeschlagene Versuche:
# ❌ JWT verification failed: Invalid token
```

### Metriken

**Erfolgsrate:**
```bash
# Anzahl erfolgreicher Requests
railway logs | grep "Authenticated user" | wc -l

# Anzahl fehlgeschlagener Requests
railway logs | grep "JWT verification failed" | wc -l
```

---

## 🎯 Zusammenfassung

### Was wurde implementiert?

1. **Frontend (`usePdfService.ts`):**
   - ✅ Automatisches Auslesen des Supabase JWT
   - ✅ Token wird im `Authorization: Bearer` Header gesendet
   - ✅ Fallback zu lokalem Service bei Fehler

2. **PDF-Service (`server.js`):**
   - ✅ `@supabase/supabase-js` Dependency
   - ✅ JWT Verification Middleware
   - ✅ Development Mode (skip auth wenn Supabase nicht konfiguriert)
   - ✅ User-Info wird an Request angehängt (`req.user`)

3. **Environment Variables:**
   - ✅ `SUPABASE_URL` (Railway)
   - ✅ `SUPABASE_ANON_KEY` (Railway)
   - ✅ `ALLOWED_ORIGINS` (Railway)

### Deployment Checklist:

**Railway PDF-Service:**
- [ ] `@supabase/supabase-js` installiert (`npm install`)
- [ ] Environment Variables gesetzt:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `ALLOWED_ORIGINS` (Netlify URL)
- [ ] Deployed (`railway up`)
- [ ] Logs zeigen: "✅ Supabase JWT enabled"

**Netlify Frontend:**
- [ ] `PDF_SERVICE_URL` gesetzt
- [ ] User eingeloggt beim Testen
- [ ] PDF-Generierung funktioniert

**Testing:**
- [ ] Lokaler Test (ohne Railway): ✅
- [ ] Lokaler Test (mit Railway): ✅
- [ ] Production Test (Netlify → Railway): ✅
- [ ] JWT Verification in Logs sichtbar: ✅

---

🎉 **Fertig!** Dein PDF-Service ist jetzt sicher mit Supabase JWT authentifiziert!
