# 🎯 Schritt-für-Schritt Tutorial: GitLab CI/CD → Railway Setup

**Ziel:** PDF-Service wird ausschließlich über GitLab CI/CD deployed (nicht über Railway Auto-Deploy).

**Zeitaufwand:** ~15-20 Minuten

---

## 📋 Voraussetzungen

- ✅ Railway Account existiert
- ✅ Railway Projekt + Service existiert
- ✅ GitLab Repository `easymanage-pdf_service` existiert
- ✅ Railway CLI lokal installiert (`npm install -g @railway/cli`)

---

## TEIL 1: Railway Konfiguration

### Schritt 1: Railway CLI Login

```bash
# Terminal öffnen
railway login

# Browser öffnet sich automatisch
# → Klicke "Authorize"
# → Terminal zeigt: "✅ Logged in as: your-email@example.com"
```

---

### Schritt 2: Railway Token generieren

#### Option A: Via Railway Dashboard (Empfohlen)

```bash
# 1. Öffne Railway Dashboard
open https://railway.app/account/tokens

# Oder manuell:
# https://railway.app/account/tokens
```

**Im Browser:**
```
1. Railway Dashboard öffnen
2. Klicke auf dein Profil (rechts oben)
3. → "Account Settings"
4. → "Tokens" (linke Sidebar)
5. → "Create New Token"
6. Name: "GitLab CI/CD"
7. → "Create"
8. Token wird angezeigt → KOPIEREN ✅
```

#### Option B: Via CLI (Falls verfügbar)

```bash
# Versuche (funktioniert nicht bei allen Railway CLI Versionen):
railway whoami

# Dann im Output nach "Token" suchen
# Oder Token aus ~/.railway/config.json auslesen:
cat ~/.railway/config.json | grep token
```

**🔴 WICHTIG:** Diesen Token kopieren und sicher aufbewahren!

**Wo speichern?**
- ✅ Temporär in Notizen/Texteditor (für nächste Schritte)
- ❌ NICHT im Code committen
- ❌ NICHT öffentlich teilen

---

### Schritt 3: Project & Service IDs holen

```bash
# Im PDF-Service Verzeichnis
cd /Users/philiprosenecker/Projects/easymanage-pdf_service

# Railway Status anzeigen
railway status
```

**Output (Beispiel):**
```
📝 Project: easymanage-pdf-service
   ID: 3fa85f64-5717-4562-b3fc-2c963f66afa6  ← RAILWAY_PROJECT_ID

🚀 Service: pdf-service
   ID: 7c9e6679-7425-40de-944b-e07fc1f90ae7  ← RAILWAY_SERVICE_ID
   Status: Running
   Last deployed: 2 hours ago
```

**Notiere:**
- `RAILWAY_PROJECT_ID` = Die lange ID unter "Project"
- `RAILWAY_SERVICE_ID` = Die lange ID unter "Service"

---

### Schritt 4: Railway Domain ermitteln

#### 🔀 Wichtige Entscheidung: Public oder Private?

**Frage:** Läuft deine Nuxt App auch auf Railway?

---

#### ✅ Option A: Private Networking (Nuxt App AUCH auf Railway) ⭐ Empfohlen

**Railway erstellt automatisch private DNS-Namen:**

```bash
# Service Name finden
railway status

# Output zeigt:
# Service: pdf-service  ← Das ist der Service Name
```

**Private Domain Format:**
```
<service-name>.railway.internal

# Beispiel:
pdf-service.railway.internal
```

**Notiere:**
```
RAILWAY_DOMAIN=pdf-service.railway.internal
```

**Vorteile:**
- ✅ Kein öffentliches Internet (sicherer)
- ✅ Schneller (<1ms Latenz intern)
- ✅ Kein CORS nötig
- ✅ Kein Bandwidth-Verbrauch
- ✅ Keine öffentliche Domain nötig

---

#### 🌐 Option B: Public Domain (Nuxt App auf Netlify/Vercel/etc.)

```bash
# Railway Public Domain anzeigen
railway domain
```

**Output (Beispiel):**
```
pdf-service-production-a1b2c3.up.railway.app
```

**Notiere:**
```
RAILWAY_DOMAIN=pdf-service-production-a1b2c3.up.railway.app
```

(ohne `https://`)

---

**💡 Empfehlung:**
- Beide auf Railway → **Option A** (Private Networking)
- Nuxt woanders → **Option B** (Public Domain)

---

### Schritt 5: Railway Auto-Deploy DEAKTIVIEREN ⚠️

**Warum?** Damit Railway nicht automatisch deployed, sondern nur GitLab CI/CD.

#### 5.1 Railway Dashboard öffnen

```
https://railway.app/project/<your-project-id>
```

#### 5.2 Service auswählen

- Klicke auf deinen **pdf-service**

#### 5.3 Settings öffnen

- Linke Sidebar → **Settings** (Zahnrad-Icon)

#### 5.4 Source Sektion finden

- Scrolle zu **"Source"** Sektion
- Hier siehst du: **"Auto Deploy"** oder **"GitHub Integration"**

#### 5.5 Auto-Deploy deaktivieren

**Option A: Wenn GitHub verbunden ist**
```
1. Bei "Source" → Klicke "Disconnect" oder "Remove Source"
2. Bestätige mit "Disconnect"
```

**Option B: Wenn Auto-Deploy Toggle sichtbar**
```
1. Toggle "Enable Auto Deploys" → AUS (grau)
2. Speichern (falls Button vorhanden)
```

**Option C: Wenn nichts sichtbar**
```
→ Service hat noch keine Source verbunden
→ Perfekt! Nichts zu tun.
```

**✅ Resultat:** Service hat keine automatische Git-Integration mehr.

---

### Schritt 6: Environment Variables auf Railway prüfen

#### 6.1 Variables Tab öffnen

```
Railway Dashboard → Service → Variables Tab
```

#### 6.2 Prüfe ob gesetzt:

```bash
NODE_ENV=production
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
ALLOWED_ORIGINS=https://staging.easymanage.com,https://app.easymanage.com
```

#### 6.3 Falls fehlend, hinzufügen:

```
1. Klicke "New Variable"
2. Name: NODE_ENV
3. Value: production
4. Klicke "Add"
```

**Wiederhole für alle benötigten Variables.**

---

## TEIL 2: GitLab Konfiguration

### Schritt 7: GitLab Projekt öffnen

```
https://gitlab.com/<your-username>/easymanage-pdf_service
```

---

### Schritt 8: CI/CD Variables setzen

#### 8.1 Settings → CI/CD öffnen

```
1. Linke Sidebar → Settings → CI/CD
2. Scrolle zu "Variables"
3. Klicke "Expand" (Aufklappen)
```

#### 8.2 Variable 1: RAILWAY_TOKEN

```
1. Klicke "Add Variable"

2. Fülle aus:
   Key: RAILWAY_TOKEN
   Value: <dein-railway-token-aus-schritt-2>
   Type: Variable
   Environment scope: All (default)
   
3. Flags setzen:
   ✅ Protect variable (nur protected branches)
   ✅ Mask variable (versteckt in Logs)
   ❌ Expand variable reference (nicht nötig)

4. Klicke "Add variable"
```

#### 8.3 Variable 2: RAILWAY_PROJECT_ID

```
1. Klicke "Add Variable"

2. Fülle aus:
   Key: RAILWAY_PROJECT_ID
   Value: <project-id-aus-schritt-3>
   Type: Variable
   
3. Flags:
   ✅ Protect variable
   ❌ Mask variable (ist UUID, kein Secret)

4. Klicke "Add variable"
```

#### 8.4 Variable 3: RAILWAY_SERVICE_ID

```
1. Klicke "Add Variable"

2. Fülle aus:
   Key: RAILWAY_SERVICE_ID
   Value: <service-id-aus-schritt-3>
   Type: Variable
   
3. Flags:
   ✅ Protect variable
   ❌ Mask variable

4. Klicke "Add variable"
```

#### 8.5 Variable 4: RAILWAY_DOMAIN

```
1. Klicke "Add Variable"

2. Fülle aus:
   Key: RAILWAY_DOMAIN
   Value: <domain-aus-schritt-4>
   
   Beispiele:
   • Private (beide auf Railway):
     pdf-service.railway.internal
   
   • Public (Nuxt woanders):
     pdf-service-production-xxx.up.railway.app
   
   Type: Variable
   
3. Flags:
   ✅ Protect variable
   ❌ Mask variable

4. Klicke "Add variable"
```

**💡 Tipp:** Bei Private Networking brauchst du keine öffentliche Domain!

#### 8.6 Variablen überprüfen

**Du solltest jetzt sehen:**

| Key | Value (Beispiel) | Protected | Masked |
|-----|------------------|-----------|--------|
| `RAILWAY_TOKEN` | `rxxx_xxx...` | ✅ | ✅ |
| `RAILWAY_PROJECT_ID` | `3fa85f64-...` | ✅ | ❌ |
| `RAILWAY_SERVICE_ID` | `7c9e6679-...` | ✅ | ❌ |
| `RAILWAY_DOMAIN` | `pdf-service.railway.internal` oder `pdf-service-xxx.up.railway.app` | ✅ | ❌ |

---

### Schritt 9: Pipeline Files prüfen

#### 9.1 Repository öffnen

```
GitLab → Repository → Files
```

#### 9.2 Prüfe ob existiert:

```
✅ .gitlab-ci.yml          (Pipeline-Konfiguration)
✅ CICD_SETUP.md          (Dokumentation)
✅ .env.example           (Environment Template)
```

**Falls nicht vorhanden:** Du hast die Files aus der vorherigen Implementation noch nicht committed!

```bash
# Lokal im Terminal
cd /Users/philiprosenecker/Projects/easymanage-pdf_service

git add .gitlab-ci.yml CICD_SETUP.md .env.example
git commit -m "feat: add GitLab CI/CD pipeline for Railway"
git push origin main
```

---

## TEIL 3: Erster Deployment-Test

### Schritt 10: Test-Commit machen

```bash
# Lokal
cd /Users/philiprosenecker/Projects/easymanage-pdf_service

# Kleine Änderung machen (z.B. README)
echo "# CI/CD Test" >> README.md

git add README.md
git commit -m "test: trigger CI/CD pipeline"
git push origin main
```

---

### Schritt 11: Pipeline beobachten

#### 11.1 CI/CD → Pipelines öffnen

```
GitLab → CI/CD → Pipelines
```

#### 11.2 Pipeline-Status prüfen

**Du solltest sehen:**

```
Pipeline #1 (main) - Running

Stages:
  ✅ test:lint        (grün/running)
  ✅ test:health      (grün/running)
  ✅ test:docker      (grün/running)
  ⏸️ deploy:production (grau/manual)
```

#### 11.3 Warte auf Tests

**~1-2 Minuten später:**

```
✅ test:lint        (passed)
✅ test:health      (passed)
✅ test:docker      (passed)
⏸️ deploy:production (manual action required)
```

---

### Schritt 12: Manuelles Deployment triggern

#### 12.1 Pipeline öffnen

```
1. Klicke auf die laufende Pipeline
2. Du siehst jetzt alle Jobs
```

#### 12.2 Deploy-Job starten

```
1. Bei "deploy:production" siehst du einen ▶️ Play Button
2. Klicke auf ▶️
3. Job startet automatisch
```

#### 12.3 Logs beobachten

**Klicke auf den Job-Namen "deploy:production"**

**Du solltest sehen:**

```bash
📦 Installing Railway CLI...
✅ Railway CLI installed

🔐 Authenticating with Railway...
✅ Logged in as: your-email@example.com

🔗 Linking to Railway project...
✅ Linked to project: easymanage-pdf-service

📊 Current Railway status:
Service: pdf-service
Status: Running

🚀 Deploying to Railway...
Building... ████████████████████ 100%
Deploying... ████████████████████ 100%

✅ Deployment completed!
Service URL: https://pdf-service-production-xxx.up.railway.app
```

**Dauer:** ~2-5 Minuten (Chromium Build)

---

### Schritt 13: Verification prüfen

#### 13.1 Automatische Verification

Nach erfolgreichem Deploy startet automatisch: `verify:production`

**⚠️ WICHTIG bei Private Networking:**

Wenn du `pdf-service.railway.internal` nutzt (Private Domain), wird der Verify-Job **fehlschlagen**, weil GitLab CI nicht auf Railway's Private Network zugreifen kann.

**Das ist normal und OK!** Der Service läuft trotzdem.

---

**Bei Public Domain (`xxx.up.railway.app`):**

**Logs zeigen:**

```bash
🧪 Verifying production deployment...
⏳ Waiting for service to start... (15s)

✅ Health check passed!
✅ PDF endpoint is responding (auth/validation working)
```

#### 13.2 Falls Verification fehlschlägt

**Häufige Gründe:**
- Service startet noch (Chromium braucht 20-30s)
- RAILWAY_DOMAIN ist falsch
- Service crashed (prüfe Railway Logs)

**Lösung:**
```bash
# Railway Logs prüfen
railway logs --tail 50

# Häufiges Problem: Environment Variables fehlen
# → Railway Dashboard → Variables prüfen
```

---

### Schritt 14: Service testen

#### 14.1 Health Check

**Bei Public Domain:**

```bash
# Terminal
curl https://<RAILWAY_DOMAIN>/health

# Beispiel:
curl https://pdf-service-production-xxx.up.railway.app/health

# Expected Output:
{
  "status": "healthy",
  "service": "pdf-service",
  "version": "1.0.0",
  "uptime": 45.123
}
```

**Bei Private Domain:**

```bash
# Von außen NICHT erreichbar (nur intern von Railway Services)
# Test funktioniert nur von deiner Nuxt App aus:

# In Nuxt App (Railway Service):
fetch('http://pdf-service.railway.internal/health')
```

#### 14.2 PDF Generation Test (mit Auth)

**Du brauchst:** Supabase JWT Token (aus deiner Nuxt App)

```bash
# Beispiel (mit echtem Token)
curl -X POST https://<RAILWAY_DOMAIN>/generate \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Test PDF</h1>"}' \
  --output test.pdf

# Expected: test.pdf wird heruntergeladen
```

---

## TEIL 4: Verifizierung

### Schritt 15: Checklist durchgehen

Prüfe ob alles funktioniert:

#### Railway:
- [ ] Auto-Deploy ist deaktiviert
- [ ] Service läuft (`railway status`)
- [ ] Environment Variables gesetzt
- [ ] Domain gewählt (Private oder Public)
- [ ] Domain ist erreichbar (Health Check) - *nur bei Public Domain testbar*

#### GitLab:
- [ ] 4 CI/CD Variables gesetzt (RAILWAY_TOKEN, etc.)
- [ ] Pipeline läuft erfolgreich
- [ ] Tests sind grün
- [ ] Deploy war erfolgreich
- [ ] Verify war erfolgreich

#### Deployment:
- [ ] Service antwortet auf Health Check (nur Public Domain)
- [ ] PDF-Endpoint antwortet (401/400 = OK) - teste von Nuxt App bei Private
- [ ] Logs in Railway zeigen keine Errors
- [ ] Bei Private Network: Nuxt App kann PDF-Service erreichen

---

## 🎉 Fertig!

**Dein Setup ist jetzt komplett:**

✅ GitLab ist **Single Source of Truth**  
✅ Railway deployed nur via GitLab CI/CD  
✅ Manual Gate für Production (Safety)  
✅ Automatische Tests vor Deploy  
✅ Automatische Verification nach Deploy  

---

## 🔄 Täglicher Workflow (ab jetzt)

### Code ändern & deployen

```bash
# 1. Feature entwickeln
git checkout -b feature/new-feature
# ... code changes ...
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 2. Merge Request erstellen
# → GitLab UI: New Merge Request
# → Warte auf Review

# 3. Merge zu main
# → GitLab: Merge Request → Merge

# 4. Pipeline triggert automatisch
# → Tests laufen automatisch
# → Deploy: Manual trigger in GitLab UI

# 5. In Production
# → Verify läuft automatisch
# → Service ist live
```
  1. Railway Dashboard → Account Settings → Tokens
  2. Create New Token
  3.
---

## 🆘 Troubleshooting Quick Reference

### Problem: Pipeline schlägt bei deploy:production fehl

**Error: "RAILWAY_TOKEN is not set"**
```
→ GitLab → Settings → CI/CD → Variables
→ Prüfe ob RAILWAY_TOKEN existiert
→ Prüfe "Protected" flag (muss ✅ sein für main branch)
```

**Error: "railway: command not found"**
```
→ Sollte nicht passieren (CLI wird installiert)
→ Falls doch: Prüfe .gitlab-ci.yml
→ RAILWAY_CLI_VERSION korrekt?
```

**Error: "Failed to authenticate"**
```
→ Railway Token abgelaufen oder ungültig
→ Generiere neuen Token: railway whoami --token
→ Update in GitLab Variables
```

---

### Problem: Verify schlägt fehl

**Error: "Health check failed"**
```
# Railway Logs prüfen
railway logs --tail 100

# Service braucht Zeit zum Starten (Chromium)
# Warte 30s und versuche nochmal:
curl https://<RAILWAY_DOMAIN>/health
```

**Error: "Connection refused"**
```
→ RAILWAY_DOMAIN falsch?
→ Service down?
→ Railway Dashboard → Service Status prüfen
```

---

### Problem: Service crasht nach Deploy

```bash
# Railway Logs in Echtzeit
railway logs --follow

# Häufige Ursachen:
# 1. Environment Variables fehlen
#    → Railway Dashboard → Variables → SUPABASE_URL, etc.

# 2. Port-Konflikt
#    → Railway setzt PORT automatisch, Code nutzt process.env.PORT?

# 3. Chromium Dependencies fehlen
#    → Sollte via Dockerfile installiert sein
#    → Prüfe Dockerfile: npx playwright install --with-deps chromium
```

---

## 📚 Nützliche Commands

```bash
# Railway Status prüfen
railway status

# Railway Logs anzeigen
railway logs --tail 100
railway logs --follow  # Echtzeit

# Railway Domain anzeigen
railway domain

# Railway Environment anzeigen
railway variables

# Railway Service neustarten
railway restart

# GitLab Pipeline lokal testen (mit gitlab-runner)
gitlab-runner exec docker test:health
```

---

## 📞 Support

Bei Problemen:

1. **Prüfe Logs:**
   - GitLab: CI/CD → Pipelines → Job Logs
   - Railway: Service → Logs

2. **Prüfe Dokumentation:**
   - [CICD_SETUP.md](CICD_SETUP.md)
   - [Railway Docs](https://docs.railway.app)
   - [GitLab CI Docs](https://docs.gitlab.com/ee/ci/)

3. **Häufige Fehler:**
   - Environment Variables fehlen
   - Protected Branches (main muss protected sein)
   - Railway Auto-Deploy noch aktiv

---

**Tutorial Ende** ✅  
**Erstellt:** 2026-02-07  
**Version:** 1.0.0
