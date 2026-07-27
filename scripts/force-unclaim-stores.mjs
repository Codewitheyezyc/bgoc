import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pnzyafeijokbmqjfumss.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuenlhZmVpam9rYm1xamZ1bXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NzEyMjksImV4cCI6MjA5OTI0NzIyOX0.4931rIIJfNK-7q6rJvIBXB8fgj16HqqqLeyjY1Gmyh8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function forceUnclaimStores() {
  console.log('🔑 Signing in admin session to update stores RLS...')

  // 1. Sign in as admin
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: 'beverlymealsandbakeries@gmail.com',
    password: '@Bgoc_secured1'
  })

  if (signInErr || !signInData.session) {
    console.log('SignIn info:', signInErr)
  } else {
    console.log('✅ Admin Signed In:', signInData.user.id)
    
    // Perform update
    const { data, error } = await supabase
      .from('stores')
      .update({
        owner_user_id: null,
        approval_status: 'unclaimed',
        rejection_reason: null
      })
      .neq('name', '')
      .select('name, slug, approval_status, owner_user_id')

    if (error) console.error('Update error:', error)
    else console.log('Updated stores:', data)
  }

  // 2. Fetch and list all stores
  const { data: allStores } = await supabase
    .from('stores')
    .select('id, name, slug, approval_status, owner_user_id')
    .order('name', { ascending: true })

  console.table(allStores)
}

forceUnclaimStores()
