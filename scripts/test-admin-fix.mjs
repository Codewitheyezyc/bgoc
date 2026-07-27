import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pnzyafeijokbmqjfumss.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuenlhZmVpam9rYm1xamZ1bXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NzEyMjksImV4cCI6MjA5OTI0NzIyOX0.4931rIIJfNK-7q6rJvIBXB8fgj16HqqqLeyjY1Gmyh8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testAdminSignIn() {
  const email = 'beverlymealsandbakeries@gmail.com'
  const password = '@Bgoc_secured1'

  console.log(`🔐 Testing signInWithPassword for ${email}...`)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('❌ Sign In Failed:', error.message)
  } else {
    console.log('✅ Sign In SUCCESS! User ID:', data.user.id)
    console.log('Session expires at:', new Date(data.session.expires_at * 1000).toLocaleString())
  }
}

testAdminSignIn()
