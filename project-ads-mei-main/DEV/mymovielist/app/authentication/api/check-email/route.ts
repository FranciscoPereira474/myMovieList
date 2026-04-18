import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    // 1) Check Auth users (admin)
    const usersRes = await supabaseAdmin.auth.admin.listUsers()
    if (!usersRes.error && Array.isArray(usersRes.data?.users)) {
      const existsInAuth = usersRes.data!.users.some(u => u.email?.toLowerCase() === email.toLowerCase())
      if (existsInAuth) return NextResponse.json({ exists: true })
    }

    // 2) Optional: check profiles table if you have one
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id,email')
      .ilike('email', email)
      .limit(1)

    if (!profilesError && Array.isArray(profiles) && profiles.length > 0) {
      return NextResponse.json({ exists: true })
    }

    return NextResponse.json({ exists: false })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}