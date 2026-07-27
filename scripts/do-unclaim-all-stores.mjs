import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pnzyafeijokbmqjfumss.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuenlhZmVpam9rYm1xamZ1bXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NzEyMjksImV4cCI6MjA5OTI0NzIyOX0.4931rIIJfNK-7q6rJvIBXB8fgj16HqqqLeyjY1Gmyh8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function unclaimAllStores() {
  console.log('🔄 Checking stores state...')

  // Try calling reset_all_stores_unclaimed RPC if available
  const { error: rpcErr } = await supabase.rpc('reset_all_stores_unclaimed')
  if (!rpcErr) {
    console.log('✅ Successfully executed reset_all_stores_unclaimed RPC!')
  } else {
    console.log('RPC notice:', rpcErr.message)
  }

  // Fetch current store statuses
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name, slug, approval_status, owner_user_id')
    .order('name', { ascending: true })

  console.log('Current Stores in DB:')
  console.table(stores)
}

unclaimAllStores()
