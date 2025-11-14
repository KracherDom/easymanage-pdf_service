# Integration des PDF-Service in EasyManage

Diese Anleitung zeigt, wie du den PDF-Microservice in dein bestehendes EasyManage Nuxt-Projekt integrierst.

## Strategie: Lokaler Service für Development, Remote für Production

### 1. Umgebungsvariablen in Nuxt hinzufügen

Füge in deiner `.env` Datei hinzu:

```bash
# PDF Service Configuration
PDF_SERVICE_URL=http://localhost:3001
PDF_SERVICE_API_KEY=development-key-change-in-production
```

Für Production (Vercel):

```bash
# In Vercel Dashboard → Settings → Environment Variables
PDF_SERVICE_URL=https://your-pdf-service.onrender.com
PDF_SERVICE_API_KEY=your-production-api-key
```

### 2. Nuxt Runtime Config anpassen

In `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  // ... existing config
  
  runtimeConfig: {
    // Server-side only
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    
    // Public (client + server)
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      
      // PDF Service Config
      pdfServiceUrl: process.env.PDF_SERVICE_URL || 'http://localhost:3001',
      pdfServiceApiKey: process.env.PDF_SERVICE_API_KEY || 'development-key-change-in-production'
    }
  }
})
```

### 3. Composable für PDF-Service erstellen

Erstelle eine neue Datei: `composables/usePdfService.ts`

```typescript
export const usePdfService = () => {
  const config = useRuntimeConfig()
  
  /**
   * Generate PDF using remote PDF service
   * Falls back to local Nuxt API if service unavailable
   */
  const generatePdfViaService = async (options: {
    html: string
    filename?: string
    pdfFooterDisplay?: 'all' | 'firstPage'
  }) => {
    const { html, filename = 'document.pdf', pdfFooterDisplay = 'all' } = options
    
    try {
      console.log('📄 Calling PDF Service:', config.public.pdfServiceUrl)
      
      const response = await $fetch(config.public.pdfServiceUrl + '/generate', {
        method: 'POST',
        headers: {
          'x-api-key': config.public.pdfServiceApiKey,
          'Content-Type': 'application/json'
        },
        body: {
          html,
          filename,
          pdfFooterDisplay
        },
        responseType: 'blob'
      })
      
      console.log('✅ PDF generated via service')
      return response
    } catch (error) {
      console.error('❌ PDF Service error:', error)
      
      // Fallback to local Nuxt API
      console.log('⚠️ Falling back to local PDF generation')
      return await $fetch('/api/generate-pdf', {
        method: 'POST',
        body: {
          html,
          filename,
          pdfFooterDisplay
        },
        responseType: 'blob'
      })
    }
  }
  
  /**
   * Check if PDF service is available
   */
  const checkServiceHealth = async () => {
    try {
      const response = await $fetch(config.public.pdfServiceUrl + '/health', {
        method: 'GET'
      })
      return response.status === 'healthy'
    } catch (error) {
      console.warn('PDF Service health check failed:', error)
      return false
    }
  }
  
  return {
    generatePdfViaService,
    checkServiceHealth
  }
}
```

### 4. PdfPreviewModal.vue anpassen

Ersetze in `components/PdfPreviewModal.vue` die `generatePdfPreview` Funktion:

```vue
<script setup>
// ... existing imports
import { usePdfService } from '~/composables/usePdfService'

// ... existing code

const { generatePdfViaService, checkServiceHealth } = usePdfService()
const config = useRuntimeConfig()

// Check service health on mount
const serviceHealthy = ref(false)
onMounted(async () => {
  serviceHealthy.value = await checkServiceHealth()
  console.log(`PDF Service status: ${serviceHealthy.value ? '✅ Healthy' : '⚠️ Unavailable (using local fallback)'}`)
  
  // ... existing onMounted code
})

async function generatePdfPreview() {
  console.log('🎨 generatePdfPreview() called')
  
  try {
    isLoadingPreview.value = true
    
    // Clean up old preview URL
    if (pdfPreviewUrl.value) {
      URL.revokeObjectURL(pdfPreviewUrl.value)
      pdfPreviewUrl.value = null
    }
    
    const pdfFooterDisplay = footerDisplay.value
    
    // Generate HTML using same data as before
    const html = generatePdfHtml({
      form: props.form,
      type: props.type,
      companyInfo: companyInfo.value,
      companyLogo: companyLogo.value,
      positionSettings: positionSettings.value,
      footerSettings: footerSettings.value,
      footerImageUrl: footerImageUrl.value,
      isAlternativeLayout: isAlternativeLayout.value,
      pdfFooterDisplay
    })
    
    console.log('📄 Generating PDF via service...')
    const startTime = performance.now()
    
    // Use PDF service (with fallback to local)
    const pdfBlob = await generatePdfViaService({
      html,
      filename: `preview_${Date.now()}.pdf`,
      pdfFooterDisplay
    })
    
    const generationTime = (performance.now() - startTime).toFixed(0)
    console.log(`⚡ PDF generated in ${generationTime}ms`)
    
    // Cache blob for reuse
    cachedPdfBlob.value = pdfBlob
    cacheTimestamp.value = Date.now()
    
    // Create blob URL for display
    pdfPreviewUrl.value = URL.createObjectURL(pdfBlob)
    
    console.log('✅ PDF preview generated and cached successfully')
    
  } catch (error) {
    console.error('❌ Failed to generate PDF preview:', error)
    errorMessage.value = 'Fehler beim Laden der Vorschau. Bitte versuche es erneut.'
    pdfPreviewUrl.value = null
    cachedPdfBlob.value = null
  } finally {
    isLoadingPreview.value = false
  }
}

// Update downloadPdf, saveToDocuments, sendMailWithPdf similarly
async function downloadPdf() {
  try {
    errorMessage.value = ""
    
    const fileName = `${props.type === "invoice" ? "Rechnung" : "Angebot"}_${
      props.form?.invoice_nr || props.form?.offer_nr || ""
    }.pdf`
    
    let pdfBlob
    
    // Check if we have a cached PDF
    if (cachedPdfBlob.value) {
      console.log('⚡ Using cached PDF blob (no regeneration needed)')
      pdfBlob = cachedPdfBlob.value
    } else {
      // Generate PDF via service
      console.log('📄 No cache available, generating PDF...')
      const startTime = performance.now()
      
      const pdfFooterDisplay = footerDisplay.value
      
      const html = generatePdfHtml({
        form: props.form,
        type: props.type,
        companyInfo: companyInfo.value,
        companyLogo: companyLogo.value,
        positionSettings: positionSettings.value,
        footerSettings: footerSettings.value,
        footerImageUrl: footerImageUrl.value,
        isAlternativeLayout: isAlternativeLayout.value,
        pdfFooterDisplay
      })
      
      pdfBlob = await generatePdfViaService({
        html,
        filename: fileName,
        pdfFooterDisplay
      })
      
      const generationTime = (performance.now() - startTime).toFixed(0)
      console.log(`⚡ PDF generated in ${generationTime}ms`)
      
      // Cache for future use
      cachedPdfBlob.value = pdfBlob
      cacheTimestamp.value = Date.now()
    }
    
    // Trigger download
    const url = URL.createObjectURL(pdfBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
    
  } catch (error) {
    console.error('PDF download error:', error)
    errorMessage.value = 'Fehler beim PDF-Download: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler')
  }
}

// ... rest of the component
</script>
```

### 5. Testing-Strategie

#### Development (Lokal):
```bash
# Terminal 1: Nuxt App
npm run dev

# Terminal 2: PDF Service
cd pdf-service
npm start

# Beide Services laufen parallel
# Nuxt: http://localhost:3000
# PDF Service: http://localhost:3001
```

#### Production:
- Nuxt App deployed auf Vercel
- PDF Service deployed auf Render.com
- Kommunikation über HTTPS

### 6. Environment Variables Setup

#### Lokal (.env):
```bash
# Nuxt
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# PDF Service (lokal)
PDF_SERVICE_URL=http://localhost:3001
PDF_SERVICE_API_KEY=development-key-change-in-production
```

#### Vercel (Production):
```bash
# Im Vercel Dashboard
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PDF_SERVICE_URL=https://your-pdf-service.onrender.com
PDF_SERVICE_API_KEY=<generierter-production-key>
```

### 7. Vorteile dieser Architektur

✅ **Development:**
- Beide Services lokal → schnelles Testing
- Kein Internet nötig
- Volle Kontrolle über beide Services

✅ **Production:**
- PDF-Service läuft isoliert → bessere Performance
- Unabhängiges Scaling möglich
- Vercel Edge Functions werden entlastet
- Render.com kann mehr RAM für Chromium bereitstellen

✅ **Fallback:**
- Wenn PDF-Service down ist → automatischer Fallback zu lokalem Nuxt API
- Keine Ausfälle für Endbenutzer

### 8. Migration Checklist

- [ ] PDF-Service Repository erstellen
- [ ] PDF-Service auf Render.com deployen
- [ ] API-Key in Render.com setzen
- [ ] `usePdfService.ts` Composable erstellen
- [ ] `nuxt.config.ts` anpassen
- [ ] Environment Variables in Vercel setzen
- [ ] `PdfPreviewModal.vue` updaten
- [ ] Lokal testen (beide Services)
- [ ] Production testen (Vercel + Render)
- [ ] Alten lokalen PDF-Code optional behalten (als Fallback)

### 9. Monitoring

#### PDF Service Logs (Render.com):
```bash
# Im Render.com Dashboard
Logs → Real-time logs
```

#### Nuxt App Logs (Vercel):
```bash
# Im Vercel Dashboard
Deployments → [Dein Deployment] → Functions → Logs
```

### 10. Kosten-Optimierung

**Render.com Free Tier:**
- 750 Stunden/Monat gratis
- Service schläft nach 15 Min Inaktivität
- Cold Start: ~30-60 Sekunden

**Render.com Starter ($7/Monat):**
- Immer online (kein Cold Start)
- Schnellere Performance
- Mehr RAM für Chromium

**Empfehlung:**
- Development: Free Tier oder lokal
- Production: Starter Plan ($7/Monat)

---

## Zusammenfassung

Mit dieser Integration nutzt du:

1. **Lokalen PDF-Service** für Development (schnell, offline)
2. **Remote PDF-Service** für Production (skalierbar, isoliert)
3. **Automatischen Fallback** zur Nuxt API wenn Service offline

Die bestehende lokale PDF-Funktion bleibt als Backup erhalten!
