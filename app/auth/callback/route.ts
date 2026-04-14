import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { origin } = request.nextUrl
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Session error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  if (session) {
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  return NextResponse.redirect(`${origin}/login`)
}