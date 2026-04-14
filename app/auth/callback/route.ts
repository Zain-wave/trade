import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('Callback received:', { code: code ? 'present' : 'missing', origin, next })
  
  if (code) {
    const supabase = await createClient()
    console.log('Attempting to exchange code...')
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    console.log('Exchange result:', { error: error?.message, hasSession: !!data?.session })
    
    if (error) {
      console.error('OAuth exchange error:', error.message, error.name)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
    
    if (data?.session) {
      console.log('Session created, redirecting to:', next)
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    console.log('No session in data, redirecting to login')
  } else {
    console.log('No code provided')
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
