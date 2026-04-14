import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const debug = searchParams.get('debug') === '1'

  if (!code) {
    const errorMsg = 'No code provided in callback'
    if (debug) {
      return NextResponse.redirect(`${origin}/login?error=${errorMsg}&debug_info=${errorMsg}&full_url=${encodeURIComponent(request.nextUrl.href)}`)
    }
    return NextResponse.redirect(`${origin}/login?error=${errorMsg}`)
  }

  if (debug) {
    return NextResponse.redirect(`${origin}/login?debug_info=Got code, attempting exchange&code_present=true`)
  }

  const supabase = await createClient()
  const { error, data } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const errorMsg = `Exchange failed: ${error.message}`
    console.error('OAuth error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`)
  }

  if (data?.session) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?error=No session created after exchange`)
}