import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest, customHeaders?: Headers) {
    let response = NextResponse.next({
        request: {
            headers: customHeaders || request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: { name: string, value: string, options: CookieOptions }[]) {
                    cookiesToSet.forEach(({ name, value, options }: { name: string, value: string, options: CookieOptions }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }: { name: string, value: string, options: CookieOptions }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const pathname = request.nextUrl.pathname

    const isAccountant = user?.user_metadata?.is_accountant === true;

    // Protect /dashboard and /accountant: unauthenticated users go to /login
    if ((pathname.startsWith('/dashboard') || pathname.startsWith('/accountant') || pathname.startsWith('/onboarding')) && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Logic for authenticated accountants
    if (user && isAccountant) {
        // Accountants skip onboarding and shouldn't access the regular dashboard
        if (pathname.startsWith('/onboarding') || pathname === '/dashboard' || pathname === '/') {
            return NextResponse.redirect(new URL('/accountant', request.url))
        }
    }

    // Logic for authenticated regular users
    if (user && !isAccountant) {
        // Regular users shouldn't access the accountant portal
        if (pathname.startsWith('/accountant')) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // Redirect authenticated users away from /login and /register only.
    // /invite is intentionally excluded: authenticated users may need to accept
    // an invite link even when they already have a session.
    const isAuthOnlyPage = pathname === '/login' || pathname === '/register'
    if (isAuthOnlyPage && user) {
        if (isAccountant) {
            return NextResponse.redirect(new URL('/accountant', request.url))
        } else {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // Intercept invite tokens and store them in a cookie
    const searchParams = request.nextUrl.searchParams
    if (pathname === '/invite' && searchParams.has('token')) {
        const token = searchParams.get('token')
        response.cookies.set('axioma_invite_token', token!, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        })
    }

    // Intercept reverse invite tokens from Accountants
    if (pathname === '/register' && searchParams.has('ref')) {
        const refToken = searchParams.get('ref')
        response.cookies.set('axioma_ref_token', refToken!, {
            path: '/',
            maxAge: 60 * 60 * 24 * 1, // 1 day
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        })
    }

    return response
}
