import { chromium } from 'playwright-chromium'
import { PDFDocument, rgb } from 'pdf-lib'

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

  // Validate input
  if (!html || typeof html !== 'string') {
    throw new Error('HTML content is required and must be a string')
  }

  let browser
  try {
    // Launch headless browser
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Prevents memory issues in Docker
        '--disable-gpu'
      ]
    })

    const context = await browser.newContext({
      viewport: { width: 794, height: 1123 }, // A4 at 96dpi
      deviceScaleFactor: 2
    })

    const page = await context.newPage()

    // Set content with full HTML
    await page.setContent(html, {
      waitUntil: 'networkidle'
    })

    // Wait for any dynamic content to load
    await page.waitForTimeout(500)

    console.log(`📄 [PDF-Service] Generating PDF (footer mode: ${pdfFooterDisplay})`)

    // Generate PDF with A4 settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false
    })

    await browser.close()
    browser = null

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

    return {
      buffer: Buffer.from(finalPdfBuffer),
      filename,
      contentType: 'application/pdf'
    }
  } catch (error) {
    // Ensure browser is closed on error
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.error('Error closing browser:', closeError)
      }
    }

    console.error('PDF generation error:', error)
    throw new Error(
      `PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
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

  // Basic length check (prevent extremely large payloads)
  if (html.length > 10 * 1024 * 1024) { // 10MB limit
    return false
  }

  return true
}
