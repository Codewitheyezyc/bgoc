import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pnzyafeijokbmqjfumss.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuenlhZmVpam9rYm1xamZ1bXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NzEyMjksImV4cCI6MjA5OTI0NzIyOX0.4931rIIJfNK-7q6rJvIBXB8fgj16HqqqLeyjY1Gmyh8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function resetAllStores() {
  const adminEmail = 'beverlymealsandbakeries@gmail.com'
  const adminPass = '@Bgoc_secured1'

  console.log(`🔐 Signing in as Admin: ${adminEmail}`)
  let { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPass,
  })

  if (signInErr || !signInData.user) {
    console.log('📝 Creating Admin Account...')
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPass,
      options: {
        data: {
          full_name: 'Beverly Group Admin',
          role: 'group_admin',
        },
      },
    })
    if (signUpErr) {
      console.error('❌ Sign up error:', signUpErr)
      process.exit(1)
    }
    signInData = signUpData
  }

  const user = signInData.user
  console.log('✅ Admin User ID:', user.id)

  // Ensure profile has group_admin role
  console.log('👑 Setting profile role to group_admin...')
  const { error: profErr } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: 'Beverly Group Admin',
    role: 'group_admin',
  })
  if (profErr) console.warn('Profile upsert notice:', profErr)

  // Reset all stores
  console.log('🧹 Resetting all stores to unclaimed...')
  const { data: resetResult, error: resetErr } = await supabase
    .from('stores')
    .update({
      owner_user_id: null,
      approval_status: 'unclaimed',
      rejection_reason: null,
    })
    .neq('name', '')
    .select('id, name, slug, approval_status, owner_user_id')

  if (resetErr) {
    console.error('❌ Reset error:', resetErr)
  } else {
    console.log(`✅ Successfully reset ${resetResult.length} stores to unclaimed!`)
    console.table(resetResult)
  }
}

resetAllStores()
