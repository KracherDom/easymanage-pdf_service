#!/usr/bin/env node

/**
 * Test script for PDF Service
 * Usage: node test-service.js [service-url] [api-key]
 */

import fs from 'fs'
import path from 'path'

const SERVICE_URL = process.argv[2] || 'http://localhost:3001'
const API_KEY = process.argv[3] || 'development-key-change-in-production'

console.log(`
╔═══════════════════════════════════════════╗
║   PDF Service Test Suite                 ║
╚═══════════════════════════════════════════╝

Service URL: ${SERVICE_URL}
API Key: ${API_KEY.substring(0, 10)}...
`)

// Test 1: Health Check
async function testHealth() {
  console.log('\n📋 Test 1: Health Check')
  console.log('   GET /health')
  
  try {
    const response = await fetch(`${SERVICE_URL}/health`)
    const data = await response.json()
    
    if (response.ok && data.status === 'healthy') {
      console.log('   ✅ PASSED - Service is healthy')
      console.log(`   Uptime: ${data.uptime}s`)
      return true
    } else {
      console.log('   ❌ FAILED - Service unhealthy')
      return false
    }
  } catch (error) {
    console.log(`   ❌ FAILED - ${error.message}`)
    return false
  }
}

// Test 2: Generate Simple PDF
async function testSimplePdf() {
  console.log('\n📋 Test 2: Generate Simple PDF')
  console.log('   POST /generate')
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial; padding: 40px; }
          h1 { color: #10B981; }
        </style>
      </head>
      <body>
        <h1>Test PDF</h1>
        <p>Generated at: ${new Date().toISOString()}</p>
        <p>This is a simple test PDF from the PDF microservice.</p>
      </body>
    </html>
  `
  
  try {
    const response = await fetch(`${SERVICE_URL}/generate`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html,
        filename: 'test-simple.pdf'
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.log(`   ❌ FAILED - ${error.message}`)
      return false
    }
    
    const buffer = await response.arrayBuffer()
    const outputPath = path.join(process.cwd(), 'test-simple.pdf')
    fs.writeFileSync(outputPath, Buffer.from(buffer))
    
    console.log('   ✅ PASSED - PDF generated successfully')
    console.log(`   File: ${outputPath}`)
    console.log(`   Size: ${buffer.byteLength} bytes`)
    return true
  } catch (error) {
    console.log(`   ❌ FAILED - ${error.message}`)
    return false
  }
}

// Test 3: Generate PDF with Footer (all pages)
async function testPdfWithFooter() {
  console.log('\n📋 Test 3: Generate PDF with Footer (all pages)')
  console.log('   POST /generate (pdfFooterDisplay: all)')
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: Arial; }
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 30px;
            background: #f3f4f6;
            text-align: center;
            padding: 10px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <h1>Multi-Page PDF Test</h1>
        <p>Page 1 content</p>
        <div style="page-break-after: always;"></div>
        <h2>Page 2</h2>
        <p>Page 2 content</p>
        <div class="footer">Footer on all pages</div>
      </body>
    </html>
  `
  
  try {
    const response = await fetch(`${SERVICE_URL}/generate`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html,
        filename: 'test-footer-all.pdf',
        pdfFooterDisplay: 'all'
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.log(`   ❌ FAILED - ${error.message}`)
      return false
    }
    
    const buffer = await response.arrayBuffer()
    const outputPath = path.join(process.cwd(), 'test-footer-all.pdf')
    fs.writeFileSync(outputPath, Buffer.from(buffer))
    
    console.log('   ✅ PASSED - PDF with footer (all pages) generated')
    console.log(`   File: ${outputPath}`)
    return true
  } catch (error) {
    console.log(`   ❌ FAILED - ${error.message}`)
    return false
  }
}

// Test 4: Generate PDF with Footer (first page only)
async function testPdfFooterFirstPage() {
  console.log('\n📋 Test 4: Generate PDF with Footer (first page only)')
  console.log('   POST /generate (pdfFooterDisplay: firstPage)')
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: Arial; }
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 30px;
            background: #10B981;
            color: white;
            text-align: center;
            padding: 10px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <h1>First Page Only Footer Test</h1>
        <p>Page 1 - Footer should appear here</p>
        <div style="page-break-after: always;"></div>
        <h2>Page 2</h2>
        <p>Page 2 - Footer should be covered by white rectangle</p>
        <div style="page-break-after: always;"></div>
        <h2>Page 3</h2>
        <p>Page 3 - Footer should also be covered</p>
        <div class="footer">This footer should only appear on page 1</div>
      </body>
    </html>
  `
  
  try {
    const response = await fetch(`${SERVICE_URL}/generate`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html,
        filename: 'test-footer-first-page.pdf',
        pdfFooterDisplay: 'firstPage'
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.log(`   ❌ FAILED - ${error.message}`)
      return false
    }
    
    const buffer = await response.arrayBuffer()
    const outputPath = path.join(process.cwd(), 'test-footer-first-page.pdf')
    fs.writeFileSync(outputPath, Buffer.from(buffer))
    
    console.log('   ✅ PASSED - PDF with first-page-only footer generated')
    console.log(`   File: ${outputPath}`)
    return true
  } catch (error) {
    console.log(`   ❌ FAILED - ${error.message}`)
    return false
  }
}

// Test 5: Invalid API Key
async function testInvalidApiKey() {
  console.log('\n📋 Test 5: Invalid API Key (should fail)')
  console.log('   POST /generate (wrong API key)')
  
  try {
    const response = await fetch(`${SERVICE_URL}/generate`, {
      method: 'POST',
      headers: {
        'x-api-key': 'invalid-key-12345',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html: '<h1>Test</h1>'
      })
    })
    
    if (response.status === 401) {
      console.log('   ✅ PASSED - Correctly rejected invalid API key')
      return true
    } else {
      console.log(`   ❌ FAILED - Expected 401, got ${response.status}`)
      return false
    }
  } catch (error) {
    console.log(`   ❌ FAILED - ${error.message}`)
    return false
  }
}

// Test 6: Missing HTML
async function testMissingHtml() {
  console.log('\n📋 Test 6: Missing HTML (should fail)')
  console.log('   POST /generate (no HTML)')
  
  try {
    const response = await fetch(`${SERVICE_URL}/generate`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: 'test.pdf'
      })
    })
    
    if (response.status === 400) {
      console.log('   ✅ PASSED - Correctly rejected missing HTML')
      return true
    } else {
      console.log(`   ❌ FAILED - Expected 400, got ${response.status}`)
      return false
    }
  } catch (error) {
    console.log(`   ❌ FAILED - ${error.message}`)
    return false
  }
}

// Run all tests
async function runTests() {
  const results = []
  
  results.push(await testHealth())
  results.push(await testSimplePdf())
  results.push(await testPdfWithFooter())
  results.push(await testPdfFooterFirstPage())
  results.push(await testInvalidApiKey())
  results.push(await testMissingHtml())
  
  const passed = results.filter(r => r).length
  const total = results.length
  
  console.log(`
╔═══════════════════════════════════════════╗
║   Test Results                            ║
╚═══════════════════════════════════════════╝

Passed: ${passed}/${total}
Failed: ${total - passed}/${total}

${passed === total ? '✅ All tests passed!' : '❌ Some tests failed'}
`)

  process.exit(passed === total ? 0 : 1)
}

runTests()
