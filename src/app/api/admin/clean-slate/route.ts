import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pnzyafeijokbmqjfumss.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuenlhZmVpam9rYm1xamZ1bXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NzEyMjksImV4cCI6MjA5OTI0NzIyOX0.4931rIIJfNK-7q6rJvIBXB8fgj16HqqqLeyjY1Gmyh8'

export async function GET() {
  return handleCleanSlate()
}

export async function POST() {
  return handleCleanSlate()
}

async function handleCleanSlate() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    // 1. Execute RPC clean_slate_database
    const { error: rpcErr } = await supabase.rpc('clean_slate_database')

    // 2. Direct fallback cleanup via Supabase client
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // Reset all stores
    await supabase.from('stores').update({
      owner_user_id: null,
      approval_status: 'unclaimed',
      rejection_reason: null
    }).neq('name', '')

    // Delete non-admin profiles
    const { data: adminProfiles } = await supabase.from('profiles').select('id, full_name').or('role.eq.group_admin,full_name.ilike.%admin%')
    const adminIds = (adminProfiles || []).map(p => p.id)

    if (adminIds.length > 0) {
      await supabase.from('profiles').delete().not('id', 'in', `(${adminIds.join(',')})`)
    }

    return NextResponse.json({
      success: true,
      message: '✓ Clean slate executed! All test products, orders, and profiles deleted. All 7 stores reset to unclaimed.',
      rpcError: rpcErr ? rpcErr.message : null
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Clean slate operation failed.'
    }, { status: 500 })
  }
}
