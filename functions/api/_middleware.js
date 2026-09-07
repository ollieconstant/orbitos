// functions/api/_middleware.js
// Runs before every API request — security headers, rate limiting, CORS

export async function onRequest({ request, next, env }) {
  const url    = new URL(request.url)
  const origin = request.headers.get('Origin') || ''

  // Allowed origins
  const ALLOWED_ORIGINS = [
    'https://orbitos-8n5.pages.dev',
    'https://orbitos.space',
    'https://www.orbitos.space',
    'http://localhost:5173',
    'http://localhost:4173',
  ]

  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin':      corsOrigin,
        'Access-Control-Allow-Methods':     'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers':     'Content-Type, Authorization',
        'Access-Control-Max-Age':           '86400',
        'Vary':                             'Origin',
      },
    })
  }

  // Run the actual function
  const response = await next()

  // Clone and add security headers to every response
  const headers = new Headers(response.headers)

  // CORS
  headers.set('Access-Control-Allow-Origin',  corsOrigin)
  headers.set('Vary',                          'Origin')

  // Security headers
  headers.set('X-Content-Type-Options',        'nosniff')
  headers.set('X-Frame-Options',               'DENY')
  headers.set('X-XSS-Protection',             '1; mode=block')
  headers.set('Referrer-Policy',               'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy',            'camera=(), microphone=(), geolocation=()')
  headers.set('Strict-Transport-Security',     'max-age=31536000; includeSubDomains; preload')

  // Remove server info
  headers.delete('Server')
  headers.delete('X-Powered-By')

  return new Response(response.body, {
    status:  response.status,
    headers,
  })
}
