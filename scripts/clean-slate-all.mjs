import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pnzyafeijokbmqjfumss.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuenlhZmVpam9rYm1xamZ1bXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NzEyMjksImV4cCI6MjA5OTI0NzIyOX0.4931rIIJfNK-7q6rJvIBXB8fgj16HqqqLeyjY1Gmyh8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function cleanSlateAll() {
  console.log('🧹 Running clean slate script...')

  // List of emails used in previous tests
  const emailsToClean = [
    'testmanager@beverly.com',
    'kayode@beverly.com',
    'isaac@beverly.com',
    'admin@beverly.com',
    'manager@beverly.com',
    'vendor@beverly.com'
  ]

  // Try signing into each account to delete its data and release store
  for (const email of emailsToClean) {
    for (const pass of ['Password123!', 'TestPass123!', '123456', '@Bgoc_secured1', 'AdminPass123!']) {
      const { data: authData } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (authData?.user && authData?.session) {
        console.log(`🔑 Signed in as ${email}`)

        // Delete products owned by this user's stores
        const { data: myStores } = await supabase.from('stores').select('id').eq('owner_user_id', authData.user.id)
        if (myStores && myStores.length > 0) {
          for (const st of myStores) {
            await supabase.from('products').delete().eq('store_id', st.id)
            await supabase.from('stores').update({ owner_user_id: null, approval_status: 'unclaimed' }).eq('id', st.id)
            console.log(`✅ Unclaimed store ${st.id} owned by ${email}`)
          }
        }
        break
      }
    }
  }

  // Also check RPC or API endpoint
  try {
    const res = await fetch('http://localhost:3000/api/admin/clean-slate')
    const json = await res.json()
    console.log('API Clean Slate Result:', json)
  } catch (e) {
    console.log('Local API server not active')
  }

  // Check state
  const { data: stores } = await supabase.from('stores').select('name, approval_status, owner_user_id')
  console.log('\n--- Final Stores State ---')
  console.table(stores)

  const { data: products } = await supabase.from('products').select('*')
  console.log('\n--- Final Products State ---')
  console.table(products)
}

cleanSlateAll()
