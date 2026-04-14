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
    return NextResponse.redirect(`${origin}/login?debug_info=Got code, attempting exchange`)
  }

  const supabase = await createClient()
  console.log('Exchanging code:', code.substring(0, 10) + '...')
  const { error, data } = await supabase.auth.exchangeCodeForSession(code)
  console.log('Exchange result:', { error: error?.message, hasSession: !!data?.session, sessionUser: data?.session?.user?.id })

  if (error) {
    const errorMsg = `Exchange failed: ${error.message} (${error.name})`
    console.error('OAuth error:', error.message, error.name)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`)
  }

  if (data?.session) {
    console.log(' SUCCESS! Session created for:', data.session.user.id)
    return NextResponse.redirect(`${origin}${next}`)
  }

  console.log('No session in data')
  return NextResponse.redirect(`${origin}/login?error=No session created after exchange`)
}