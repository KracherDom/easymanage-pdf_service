import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { generatePdf, validateHtml } from './pdf.js'

// Load environment variables
config()

const app = express()
const PORT = process.env.PORT || 3001
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

// Initialize Supabase client for JWT verification
let supabase = null
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  console.log('✅ Supabase client initialized for JWT verification')
} else {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_ANON_KEY not set - JWT auth disabled')
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow PDF generation
}))

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*']
const corsOptions = {
  origin: allowedOrigins,
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))

console.log(`🌐 CORS Origins: ${allowedOrigins.join(', ')}`)

// Body parser - reduced limit for memory efficiency
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))

// JWT Authentication Middleware
async function verifySupabaseJWT(req, res, next) {
  // Skip auth if Supabase not configured (local development)
  if (!supabase) {
    console.log('👨‍💻 Development mode: Skipping JWT verification')
    return next()
  }
  
  const authHeader = req.headers['authorization']
  
  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header is required'
    })
  }
  
  // Extract token from "Bearer <token>"
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader
  
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Bearer token is required'
    })
  }
  
  try {
    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.error('❌ JWT verification failed:', error?.message || 'Invalid token')
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      })
    }
    
    // Attach user to request for potential use in handlers
    req.user = user
    console.log(`✅ Authenticated user: ${user.email} (${user.id})`)
    
    next()
  } catch (error) {
    console.error('❌ JWT verification error:', error)
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token verification failed'
    })
  }
}

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

/**
 * Health check endpoint
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'pdf-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

/**
 * PDF Generation endpoint
 * POST /generate
 * 
 * Body:
 * {
 *   "html": "<html>...</html>",           // HTML content to render
 *   "filename": "document.pdf",            // Optional filename
 *   "pdfFooterDisplay": "all" | "firstPage" // Optional footer display mode
 * }
 * 
 * Headers:
 * - Authorization: Bearer <supabase-jwt-token>
 * - Content-Type: application/json
 * 
 * Returns: PDF file (application/pdf)
 */
app.post('/generate', verifySupabaseJWT, async (req, res) => {
  try {
    const { html, filename, pdfFooterDisplay } = req.body

    // Validate required fields
    if (!html) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'HTML content is required'
      })
    }

    // Validate HTML content
    if (!validateHtml(html)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid HTML content (too large or malformed)'
      })
    }

    console.log(`📄 [PDF-Service] Generating PDF: ${filename || 'document.pdf'}`)
    const startTime = Date.now()

    // Generate PDF
    const result = await generatePdf({
      html,
      filename: filename || 'document.pdf',
      pdfFooterDisplay: pdfFooterDisplay || 'all'
    })

    const generationTime = Date.now() - startTime
    console.log(`✅ [PDF-Service] PDF generated in ${generationTime}ms`)

    // Set response headers
    res.setHeader('Content-Type', result.contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.setHeader('Content-Length', result.buffer.length)
    res.setHeader('X-Generation-Time', `${generationTime}ms`)

    // Send PDF
    res.send(result.buffer)
  } catch (error) {
    console.error('❌ [PDF-Service] Error:', error)
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'PDF generation failed'
    })
  }
})

/**
 * Root endpoint - API documentation
 * GET /
 */
app.get('/', (req, res) => {
  res.json({
    service: 'PDF Generation Microservice',
    version: '1.0.0',
    description: 'Standalone PDF generation service extracted from EasyManage',
    endpoints: {
      health: {
        method: 'GET',
        path: '/health',
        description: 'Health check endpoint',
        authentication: false
      },
      generate: {
        method: 'POST',
        path: '/generate',
        description: 'Generate PDF from HTML',
        authentication: true,
        headers: {
          'x-api-key': 'Your API key',
          'Content-Type': 'application/json'
        },
        body: {
          html: 'HTML content (required)',
          filename: 'Filename for PDF (optional, default: document.pdf)',
          pdfFooterDisplay: 'Footer display mode: "all" or "firstPage" (optional, default: "all")'
        }
      }
    },
    examples: {
      curl: 'curl -X POST https://your-service.onrender.com/generate -H "x-api-key: YOUR_KEY" -H "Content-Type: application/json" -d \'{"html":"<h1>Hello World</h1>"}\' --output document.pdf',
      fetch: 'fetch("https://your-service.onrender.com/generate", { method: "POST", headers: { "x-api-key": "YOUR_KEY", "Content-Type": "application/json" }, body: JSON.stringify({ html: "<h1>Hello</h1>" }) })'
    }
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} not found`,
    availableEndpoints: ['GET /', 'GET /health', 'POST /generate']
  })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  })
})

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  const corsDisplay = allowedOrigins.length === 1 && allowedOrigins[0] === '*' 
    ? '⚠️  All origins (*) - Dev mode' 
    : '✅ ' + allowedOrigins.join(', ')
  
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   📄 PDF Generation Microservice                         ║
║                                                           ║
║   Status: Running (Memory-optimized mode)                ║
║   Port: ${PORT.toString().padEnd(50)}║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(43)}║
║   Auth: ${(supabase ? '✅ Supabase JWT enabled' : '⚠️  JWT disabled (dev mode)').padEnd(47)}║
║   CORS: ${corsDisplay.padEnd(47)}║
║   Max Memory: 512MB (Node.js heap limit)                 ║
║   GC: Exposed (automatic cleanup enabled)                ║
║                                                           ║
║   Endpoints:                                              ║
║   - GET  /health   (Health check)                        ║
║   - POST /generate (PDF generation - requires JWT)       ║
║                                                           ║
║   Resource Optimizations:                                ║
║   ✅ Browser instance pooling (5min idle timeout)        ║
║   ✅ Aggressive Chromium flags (minimal memory)          ║
║   ✅ Automatic garbage collection                        ║
║   ✅ Reduced payload limits (5MB max)                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `)
})

// Graceful shutdown with browser cleanup
process.on('SIGTERM', async () => {
  console.log('\n⚠️  SIGTERM signal received: closing HTTP server')
  server.close(async () => {
    console.log('🛑 HTTP server closed')
    const { closeBrowser } = await import('./pdf.js')
    await closeBrowser()
    console.log('✅ Browser closed, cleanup complete')
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('\n⚠️  SIGINT signal received: closing HTTP server')
  server.close(async () => {
    console.log('🛑 HTTP server closed')
    const { closeBrowser } = await import('./pdf.js')
    await closeBrowser()
    console.log('✅ Browser closed, cleanup complete')
    process.exit(0)
  })
})
