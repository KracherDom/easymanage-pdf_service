import { chromium } from 'playwright-chromium'
import { PDFDocument, rgb } from 'pdf-lib'

// Browser instance pool for resource efficiency
let browserInstance = null
let browserLastUsed = Date.now()
const BROWSER_IDLE_TIMEOUT = 5 * 60 * 1000 // 5 minutes
const MAX_MEMORY_MB = 400 // Max memory before restart

/**
 * Get or create browser instance with resource limits
 * @returns {Promise<import('playwright-chromium').Browser>}
 */
async function getBrowser() {
  const now = Date.now()
  
  // Close browser if idle too long (free memory)
  if (browserInstance && (now - browserLastUsed) > BROWSER_IDLE_TIMEOUT) {
    console.log('🧹 Closing idle browser to free memory')
    await browserInstance.close().catch(() => {})
    browserInstance = null
  }
  
  // Create new browser if needed
  if (!browserInstance || !browserInstance.isConnected()) {
    console.log('🚀 Launching browser with resource limits')
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Use /tmp instead of /dev/shm (prevents memory issues)
        '--disable-gpu', // No GPU needed for PDFs
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-component-extensions-with-background-pages',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-pings',
        '--password-store=basic',
        '--use-mock-keychain',
        '--force-color-profile=srgb',
        '--disable-accelerated-2d-canvas',
        '--disable-threaded-animation',
        '--disable-threaded-scrolling',
        `--max-old-space-size=${MAX_MEMORY_MB}`, // Limit V8 heap
        '--js-flags=--max-old-space-size=256', // Limit renderer memory
      ],
    })
  }
  
  browserLastUsed = now
  return browserInstance
}

/**
 * Close browser and free memory (called on shutdown)
 */
export async function closeBrowser() {
  if (browserInstance) {
    console.log('🛑 Closing browser instance')
    await browserInstance.close().catch(() => {})
    browserInstance = null
  }
}

/**
 * Force garbage collection if available
 */
function forceGC() {
  if (global.gc) {
    global.gc()
  }
}

/**
 * Core PDF generation logic
 * Extracted from EasyManage Nuxt project
 * Framework-agnostic, pure Node.js implementation
 */

/**
 * Generate PDF from HTML using Playwright + Chromium
 * @param {Object} options - PDF generation options
 * @param {string} options.html - HTML content to render
 * @param {string} [options.filename='document.pdf'] - PDF filename
 * @param {string} [options.pdfFooterDisplay='all'] - Footer display mode: 'all' or 'firstPage'
 * @returns {Promise<Object>} PDF buffer and metadata
 */
export async function generatePdf(options) {
  const { html, filename = 'document.pdf', pdfFooterDisplay = 'all' } = options

  if (!validateHtml(html)) {
    throw new Error('Invalid HTML input')
  }

  const startTime = Date.now()
  let page
  let context

  try {
    // Reuse browser instance (saves ~1-2s and 50-100MB RAM)
    const browser = await getBrowser()

    // Create isolated context (lightweight)
    context = await browser.newContext({
      viewport: { width: 794, height: 1123 }, // A4 dimensions
      deviceScaleFactor: 1, // Reduced from 2 for less memory
      bypassCSP: true,
    })
    
    page = await context.newPage()

    // Set content with optimized waiting strategy
    await page.setContent(html, { 
      waitUntil: 'domcontentloaded', // Faster than 'networkidle'
      timeout: 30000 
    })

    // Wait for any dynamic content to load
    await page.waitForTimeout(500)

    console.log(`📄 [PDF-Service] Generating PDF (footer mode: ${pdfFooterDisplay})`)

    // Generate PDF with A4 settings
    // IMPORTANT: preferCSSPageSize: true allows HTML to control margins via @page CSS
    // This ensures symmetric left/right margins as defined in the HTML template
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },
      preferCSSPageSize: true, // Respect CSS @page rules for symmetric margins
      displayHeaderFooter: false,
      scale: 1.0, // Keep at 1.0 to prevent asymmetric rendering
    })

    // DON'T close browser - reuse it for next request
    const generationTime = Date.now() - startTime

    // Post-process PDF if firstPage mode: remove footer from pages 2+
    let finalPdfBuffer = pdfBuffer

    if (pdfFooterDisplay === 'firstPage') {
      try {
        const pdfDoc = await PDFDocument.load(pdfBuffer)
        const pages = pdfDoc.getPages()

        console.log(`📄 [PDF-Service] Post-processing PDF: ${pages.length} pages found`)

        // For pages 2+, overlay a white rectangle over the footer area
        if (pages.length > 1) {
          for (let i = 1; i < pages.length; i++) {
            const page = pages[i]

            // Draw white rectangle over footer area (bottom 15mm = 43 points)
            page.drawRectangle({
              x: 0,
              y: 0,
              width: 595, // A4 width in points (210mm)
              height: 43, // 15mm in points
              color: rgb(1, 1, 1) // White
            })

            console.log(`📄 [PDF-Service] Covered footer on page ${i + 1}`)
          }

          finalPdfBuffer = Buffer.from(await pdfDoc.save())
          console.log(`📄 [PDF-Service] PDF post-processing complete`)
        }
      } catch (pdfError) {
        console.error('PDF post-processing error:', pdfError)
        // Fall back to original PDF if post-processing fails
        finalPdfBuffer = pdfBuffer
      }
    }

    console.log(`✅ PDF generated in ${generationTime}ms (${Math.round(finalPdfBuffer.length / 1024)}KB)`)

    return {
      buffer: Buffer.from(finalPdfBuffer),
      filename,
      contentType: 'application/pdf'
    }
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error(
      `PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  } finally {
    // Clean up page and context (browser stays alive for reuse)
    if (page) {
      await page.close().catch(() => {})
    }
    if (context) {
      await context.close().catch(() => {})
    }
    
    // Force garbage collection to free memory
    forceGC()
  }
}

/**
 * Validate HTML content for security
 * Prevents malicious scripts and content
 * @param {string} html - HTML content to validate
 * @returns {boolean} True if valid
 */
export function validateHtml(html) {
  if (!html || typeof html !== 'string') {
    return false
  }

  // Reduced limit for memory efficiency (5MB instead of 10MB)
  if (html.length > 5 * 1024 * 1024) {
    return false
  }

  return true
}
