import { createServerClient } from '@supabase/ssr'
import { ProxyResponse, type ProxyRequest } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/auth/callback']
const AUTH_ROUTES = ['/login', '/register', '/forgot-password']
const ADMIN_ROUTES = ['/admin']

export async function proxy(request: ProxyRequest) {
  let supabaseResponse = ProxyResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = ProxyResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  if (user && AUTH_ROUTES.some(r => pathname.startsWith(r))) {
    return ProxyResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return ProxyResponse.redirect(redirectUrl)
  }

  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return ProxyResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}