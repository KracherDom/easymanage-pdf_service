# 🚀 CI/CD Setup Guide - PDF Service

## Übersicht

Dieses Projekt verwendet **GitLab CI/CD** für automatisierte Deployments zu **Railway**.

**Architektur:**
```
GitLab Repository (main branch)
      ↓
GitLab CI/CD Pipeline
      ↓
Railway CLI Deploy
      ↓
Railway Service (Production)
```

---

## 🔑 Benötigte GitLab CI/CD Variables

Diese Variablen müssen in **GitLab → Settings → CI/CD → Variables** gesetzt werden:

### Required Variables (Protected & Masked)

```bash
RAILWAY_TOKEN          # Railway API Token für Authentifizierung
RAILWAY_PROJECT_ID     # Railway Project ID
RAILWAY_SERVICE_ID     # Railway Service ID (PDF-Service)
RAILWAY_DOMAIN         # Railway Domain für Health Checks
```

---

## 📋 Setup-Schritte

### 1. Railway Token generieren

```bash
# Im Terminal
railway login
railway whoami --token

# Output kopieren → GitLab Variable: RAILWAY_TOKEN
```

### 2. Project & Service IDs holen

```bash
cd /Users/philiprosenecker/Projects/easymanage-pdf_service
railway status

# Output zeigt:
# Project: easymanage-pdf-service (abc123...)  ← RAILWAY_PROJECT_ID
# Service: pdf-service (def456...)              ← RAILWAY_SERVICE_ID
```

### 3. Railway Domain ermitteln

```bash
railway domain

# Output: pdf-service-production-xxxx.up.railway.app
# → GitLab Variable: RAILWAY_DOMAIN
```

### 4. GitLab Variables setzen

```bash
# In GitLab UI:
Settings → CI/CD → Variables → Add Variable

Name: RAILWAY_TOKEN
Value: <dein-token>
Type: Variable
Protected: ✅ Yes
Masked: ✅ Yes

# Wiederhole für alle anderen Variables
```

### 5. Railway Auto-Deploy deaktivieren

**WICHTIG:** Railway soll NICHT automatisch deployen!

```bash
# Railway Dashboard → Service → Settings → Source
# ❌ "Enable Auto Deploys" deaktivieren
```

**Grund:** Deployments erfolgen nur über GitLab CI/CD (Single Source of Truth).

---

## 🚀 Deployment-Workflow

### 1. Code ändern & pushen

```bash
git checkout main
# ... code changes ...
git add .
git commit -m "feat: improve PDF performance"
git push origin main
```

### 2. Pipeline läuft automatisch

GitLab CI führt aus:

```
✅ test:lint      → Dependencies installieren + (optional) ESLint
✅ test:health    → Node.js runtime + PDF module testen
✅ test:docker    → Dockerfile validieren
⏸️ deploy:production → Wartet auf manuellen Trigger
```

### 3. Manuelles Deployment

```bash
# In GitLab UI:
1. CI/CD → Pipelines
2. Klicke auf aktuelle Pipeline
3. Bei "deploy:production" → Klicke ▶️ (Play Button)
4. Pipeline deployed zu Railway
5. verify:production läuft automatisch nach Deploy
```

**Warum manuell?**
- Safety-Gate für Production
- Verhindert accidental deploys
- Zeit für Pre-Deploy Checks

### 4. Verification

Nach erfolgreichem Deploy läuft automatisch:

```
✅ verify:production → Health Check + Endpoint Test
```

---

## 📊 Pipeline-Stages Erklärt

### Stage 1: Tests

| Job | Beschreibung | Kann fehlschlagen? |
|-----|--------------|-------------------|
| `test:lint` | Dependencies installieren, ESLint (optional) | Nein |
| `test:health` | Node.js runtime + PDF module testen | Nein |
| `test:docker` | Dockerfile mit hadolint validieren | Ja (allow_failure) |

### Stage 2: Deploy

| Job | Beschreibung | Trigger |
|-----|--------------|---------|
| `deploy:production` | Deployment zu Railway via CLI | Manual (only main) |
| `verify:production` | Health Check + Endpoint Test | Auto (after deploy) |
| `rollback:production` | Rollback zu vorheriger Version | Manual |

---

## 🔍 Troubleshooting

### Pipeline schlägt bei `deploy:production` fehl

**Fehler: "RAILWAY_TOKEN is not set"**

```bash
# Lösung:
# GitLab → Settings → CI/CD → Variables
# Prüfe ob RAILWAY_TOKEN gesetzt ist
```

**Fehler: "railway: command not found"**

```bash
# Sollte nicht passieren (CLI wird in before_script installiert)
# Falls doch: Prüfe RAILWAY_CLI_VERSION in .gitlab-ci.yml
```

**Fehler: "Failed to link project"**

```bash
# Lösung:
railway whoami  # Prüfe ob Token valide
railway list    # Prüfe ob Project existiert

# RAILWAY_PROJECT_ID korrekt?
```

### Verify schlägt fehl

**Fehler: "Health check failed"**

```bash
# Railway Service braucht ~30s zum Starten (Chromium)
# Warte und prüfe:
railway logs  # Zeigt Service-Logs

# RAILWAY_DOMAIN korrekt gesetzt?
```

### Service startet nicht auf Railway

```bash
# Railway Logs prüfen:
railway logs --tail 100

# Häufige Probleme:
# 1. Environment Variables fehlen (SUPABASE_URL, etc.)
# 2. Chromium Dependencies fehlen (sollten via Dockerfile installiert sein)
# 3. Memory Limit erreicht (Railway: min. 512MB empfohlen)
```

---

## 🔄 Rollback-Strategie

### Option 1: Pipeline von altem Commit triggern

```bash
# In GitLab:
1. CI/CD → Pipelines
2. Finde erfolgreiche Pipeline von vorherigem Commit
3. Klicke "Run Pipeline" oder "Retry"
```

### Option 2: Manueller Rollback-Job

```bash
# In GitLab:
1. Aktuelle Pipeline öffnen
2. rollback:production → Play ▶️
3. Zeigt Railway Status (Info-Zwecke)

# Echter Rollback: Option 1 nutzen
```

### Option 3: Direkt auf Railway

```bash
# Falls GitLab nicht verfügbar:
railway login
railway link <project-id>
railway redeploy  # Deployed letzte erfolgreiche Version neu
```

---

## 📈 Best Practices

### ✅ Do's

- **Immer testen** vor dem Deploy (Pipeline läuft Tests automatisch)
- **Manual Deploy** für Production (Safety-Gate)
- **Verify** nach Deploy prüfen (läuft automatisch)
- **Railway Auto-Deploy deaktiviert** lassen (GitLab = Single Source)
- **Variables als Protected & Masked** setzen (Sicherheit)

### ❌ Don'ts

- **Nicht direkt auf Railway pushen** (nur via GitLab CI/CD)
- **Nicht Railway Auto-Deploy aktivieren** (Conflicts mit GitLab)
- **Nicht RAILWAY_TOKEN committen** (immer nur in GitLab Variables)
- **Nicht ohne Tests deployen** (Pipeline-Tests vor Deploy)

---

## 📚 Weitere Ressourcen

- **Railway CLI Docs:** https://docs.railway.app/develop/cli
- **GitLab CI/CD Docs:** https://docs.gitlab.com/ee/ci/
- **Dockerfile Best Practices:** https://docs.docker.com/develop/dev-best-practices/

---

## ✅ Setup Checklist

Nach Setup sollten alle Punkte ✅ sein:

- [ ] `.gitlab-ci.yml` im Repository committed
- [ ] `RAILWAY_TOKEN` in GitLab Variables gesetzt (Protected, Masked)
- [ ] `RAILWAY_PROJECT_ID` in GitLab Variables gesetzt
- [ ] `RAILWAY_SERVICE_ID` in GitLab Variables gesetzt
- [ ] `RAILWAY_DOMAIN` in GitLab Variables gesetzt
- [ ] Railway Auto-Deploy **deaktiviert**
- [ ] Test-Push zu `main` gemacht
- [ ] Pipeline läuft erfolgreich (alle Tests grün)
- [ ] Manual Deploy getriggert und erfolgreich
- [ ] Verify läuft erfolgreich (Health Check OK)
- [ ] Railway Service ist live und erreichbar

---

**Erstellt:** 2026-02-07  
**Version:** 1.0.0  
**Maintainer:** EasyManage Team
