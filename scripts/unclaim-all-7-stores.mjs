import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pnzyafeijokbmqjfumss.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuenlhZmVpam9rYm1xamZ1bXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NzEyMjksImV4cCI6MjA5OTI0NzIyOX0.4931rIIJfNK-7q6rJvIBXB8fgj16HqqqLeyjY1Gmyh8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function unclaimAll7Stores() {
  console.log('🚀 Unclaiming all 7 stores in database...')

  // List of all store IDs in DB
  const storeIds = [
    'a4f68193-7796-414d-b54a-f279c6be22a6', // Beverly Bakeries and Confectionery
    '92da5fe6-2329-4290-a476-833c3469de7a', // Beverly Meals & Bakeries
    '46d5adad-423e-443c-86ca-c559592ba284', // Beverly Meals Exclusive Restaurant
    '6db04188-c249-4e4f-bd6d-95ac59a691c6', // Dollnatia
    'a8d19a39-6db6-40ed-9f4e-058825688527', // Homeworld Supermarket
    'a7d863a8-1e4f-4b64-a5ac-c7f0c2b115f5', // Toys in CandiLand
    '05e7a795-bbb9-4e80-8ec3-d382559d4ab0', // Yurmealicious Pizza
  ]

  // Try updating via RPC if available
  const { error: rpcErr } = await supabase.rpc('reset_all_stores_unclaimed')
  if (rpcErr) console.log('RPC Notice:', rpcErr.message)

  // Verify stores state
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name, slug, approval_status, owner_user_id')
    .order('name', { ascending: true })

  console.log('Stores Status in DB:')
  console.table(stores)
}

unclaimAll7Stores()
