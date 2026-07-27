import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/register'

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${origin}${next}?confirmed=true`)
      }
    } catch (err) {
      console.error('Auth callback exchange error:', err)
    }
  }

  // Fallback redirect to login page with confirmed flag
  return NextResponse.redirect(`${origin}/register?confirmed=true`)
}
