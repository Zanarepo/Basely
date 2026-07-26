import { NextResponse } from 'next/server'

// Simple in-memory rate limiter for MVP (Note: Does not scale across multiple serverless functions)
// For a production deployment, replace this with Upstash Redis or a PostgreSQL table counter.

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitCache = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100 // 100 requests per minute per key

export function rateLimit(keyId: string): NextResponse | null {
  const now = Date.now()
  let entry = rateLimitCache.get(keyId)

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + WINDOW_MS }
  } else {
    entry.count++
  }

  rateLimitCache.set(keyId, entry)

  const remaining = Math.max(0, MAX_REQUESTS - entry.count)
  
  if (entry.count > MAX_REQUESTS) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, {
      status: 429,
      headers: {
        'X-RateLimit-Limit': MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(entry.resetAt).toISOString()
      }
    })
  }
  
  // Return null if request is allowed, we will manually append these headers in the route response
  return null
}

export function getRateLimitHeaders(keyId: string) {
  const entry = rateLimitCache.get(keyId)
  if (!entry) return {}
  
  return {
    'X-RateLimit-Limit': MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': Math.max(0, MAX_REQUESTS - entry.count).toString(),
    'X-RateLimit-Reset': new Date(entry.resetAt).toISOString()
  }
}
