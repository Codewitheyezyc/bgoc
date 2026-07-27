import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pnzyafeijokbmqjfumss.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuenlhZmVpam9rYm1xamZ1bXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NzEyMjksImV4cCI6MjA5OTI0NzIyOX0.4931rIIJfNK-7q6rJvIBXB8fgj16HqqqLeyjY1Gmyh8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function resetAndSeedAdmin() {
  console.log('🚀 Starting store claims reset & admin account setup...')

  const adminEmail = 'beverlymealsandbakeries@gmail.com'
  const adminPass = '@Bgoc_secured1'

  // 1. Sign in or Sign up Admin User
  let user = null

  console.log(`🔑 Signing in / Registering admin: ${adminEmail}`)
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPass,
  })

  if (signInErr || !signInData.user) {
    console.log(`📝 Creating new admin account...`)
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
      console.error('❌ Failed to register admin account:', signUpErr)
      process.exit(1)
    }
    user = signUpData.user
    console.log('✅ Admin user registered successfully!')
  } else {
    user = signInData.user
    console.log('✅ Admin user signed in successfully!')
  }

  // Sign in to guarantee session token for RLS updates
  const { data: sessionData } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPass,
  })

  if (user && sessionData?.session) {
    console.log(`👑 Updating profile role to group_admin for user ID: ${user.id}`)
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: 'Beverly Group Admin',
        role: 'group_admin',
      })

    if (profileErr) {
      console.error('⚠️ Profile update warning:', profileErr)
    } else {
      console.log('✅ Admin profile successfully promoted to group_admin!')
    }

    console.log('GB Resetting all store claims to unclaimed state...')
    const { data: updatedStores, error: resetErr } = await supabase
      .from('stores')
      .update({
        owner_user_id: null,
        approval_status: 'unclaimed',
        rejection_reason: null,
      })
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select('name, slug, approval_status, owner_user_id')

    if (resetErr) {
      console.error('⚠️ Store reset error:', resetErr)
    } else {
      console.log(`✅ Successfully reset ${updatedStores?.length || 0} stores to unclaimed!`)
      console.log(updatedStores)
    }
  }

  console.log('\n🎉 Setup Complete!')
  console.log(`Admin Email: ${adminEmail}`)
  console.log(`Admin Password: ${adminPass}`)
  process.exit(0)
}

resetAndSeedAdmin()
