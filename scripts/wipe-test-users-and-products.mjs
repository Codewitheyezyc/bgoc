import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pnzyafeijokbmqjfumss.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuenlhZmVpam9rYm1xamZ1bXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NzEyMjksImV4cCI6MjA5OTI0NzIyOX0.4931rIIJfNK-7q6rJvIBXB8fgj16HqqqLeyjY1Gmyh8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function wipeDatabase() {
  console.log('🧹 Executing database wipe for test users and products...')

  // Sign in as admin first
  const { data: adminAuth } = await supabase.auth.signInWithPassword({
    email: 'beverlymealsandbakeries@gmail.com',
    password: '@Bgoc_secured1'
  })

  if (adminAuth?.session) {
    console.log('✅ Signed in as Group Admin:', adminAuth.user.id)

    // Delete all products
    const { error: pErr } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('Products delete:', pErr || 'Success')

    // Delete all order items & orders
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Reset all 7 stores to unclaimed
    const { data: resetStores, error: sErr } = await supabase
      .from('stores')
      .update({ owner_user_id: null, approval_status: 'unclaimed', rejection_reason: null })
      .neq('name', '')
      .select('name, approval_status, owner_user_id')

    console.log('Stores reset:', sErr || resetStores)

    // Delete non-admin profiles
    const { error: profErr } = await supabase
      .from('profiles')
      .delete()
      .neq('id', adminAuth.user.id)

    console.log('Profiles delete:', profErr || 'Success')
  }

  // Print final database verification
  const { data: stores } = await supabase.from('stores').select('name, approval_status, owner_user_id')
  console.log('\n--- Final Stores ---')
  console.table(stores)

  const { data: products } = await supabase.from('products').select('*')
  console.log('\n--- Final Products ---')
  console.table(products)

  const { data: profiles } = await supabase.from('profiles').select('id, full_name, role')
  console.log('\n--- Final Profiles ---')
  console.table(profiles)
}

wipeDatabase()
