import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // 1. Try Vercel's built in country header (if deployed to Vercel)
    const vercelCountry = req.headers.get('x-vercel-ip-country')
    if (vercelCountry) {
      return NextResponse.json({ countryCode: vercelCountry })
    }

    // 2. Try Cloudflare's built in country header
    const cfCountry = req.headers.get('cf-ipcountry')
    if (cfCountry) {
      return NextResponse.json({ countryCode: cfCountry })
    }

    // 3. Get IP and fallback to free GeoIP API
    let ip = req.headers.get('x-forwarded-for')
    if (ip && ip.includes(',')) {
      ip = ip.split(',')[0].trim()
    }

    // Mock for local testing so user can see Nigeria PPP logic
    if (process.env.NODE_ENV === 'development' && (!ip || ip === '::1' || ip === '127.0.0.1')) {
      return NextResponse.json({ countryCode: 'NG', currency: 'NGN' })
    }

    // If local or no IP and not in dev mode, default to US
    if (!ip || ip === '::1' || ip === '127.0.0.1') {
      return NextResponse.json({ countryCode: 'US', currency: 'USD' })
    }

    // External fallback (NOTE: ipapi.co has rate limits, this is just a best-effort fallback)
    const response = await fetch(`https://ipapi.co/${ip}/country/`)
    if (response.ok) {
      const countryCode = await response.text()
      // ipapi returns the 2-letter code as plain text (e.g. "US", "NG")
      if (countryCode && countryCode.length === 2) {
        return NextResponse.json({ countryCode })
      }
    }

    return NextResponse.json({ countryCode: 'US' })
  } catch (error) {
    console.error('GeoIP detection error:', error)
    return NextResponse.json({ countryCode: 'US' }) // Safe fallback
  }
}
