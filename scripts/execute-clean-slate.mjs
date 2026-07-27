import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pnzyafeijokbmqjfumss.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuenlhZmVpam9rYm1xamZ1bXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NzEyMjksImV4cCI6MjA5OTI0NzIyOX0.4931rIIJfNK-7q6rJvIBXB8fgj16HqqqLeyjY1Gmyh8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function executeCleanSlate() {
  console.log('🧹 Executing Clean Slate Database Reset...')

  // 1. Try calling clean_slate_database RPC
  const { error: rpcErr } = await supabase.rpc('clean_slate_database')
  if (rpcErr) console.log('RPC notice:', rpcErr.message)
  else console.log('✅ clean_slate_database RPC executed successfully!')

  // 2. Clear products, orders, order_items
  const { error: prodErr } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (prodErr) console.log('Products delete notice:', prodErr.message)

  const { error: ordErr } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (ordErr) console.log('Orders delete notice:', ordErr.message)

  // 3. Reset stores
  const { data: updatedStores, error: storeErr } = await supabase
    .from('stores')
    .update({ owner_user_id: null, approval_status: 'unclaimed', rejection_reason: null })
    .neq('name', '')
    .select('id, name, approval_status, owner_user_id')

  if (storeErr) console.log('Stores reset notice:', storeErr.message)

  // 4. Check remaining tables
  const { data: stores } = await supabase.from('stores').select('name, approval_status, owner_user_id')
  console.log('\n--- Stores ---')
  console.table(stores)

  const { data: products } = await supabase.from('products').select('*')
  console.log('\n--- Products ---')
  console.table(products)

  const { data: profiles } = await supabase.from('profiles').select('id, full_name, role')
  console.log('\n--- Profiles ---')
  console.table(profiles)
}

executeCleanSlate()
