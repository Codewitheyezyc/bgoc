// upload-store-logos.mjs
// Uploads 5 real store logos to Cloudinary then upserts unclaimed store shells in Supabase.
// Run from the bgoc project root: node scripts/upload-store-logos.mjs

import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// ── Cloudinary credentials ────────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = 'yufacqum'
const CLOUDINARY_API_KEY    = '624134377654392'
const CLOUDINARY_API_SECRET = 'pYBJ2qqXCZdrZFkojvXQ-Jqdgr0'

// ── Supabase ──────────────────────────────────────────────────────────────────
const SUPABASE_URL      = 'https://pnzyafeijokbmqjfumss.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuenlhZmVpam9rYm1xamZ1bXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NzEyMjksImV4cCI6MjA5OTI0NzIyOX0.4931rIIJfNK-7q6rJvIBXB8fgj16HqqqLeyjY1Gmyh8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Logo → Store mapping ──────────────────────────────────────────────────────
const BASE = 'C:/Users/CT/.gemini/antigravity-ide/brain/4903230d-2b2c-4fbc-9b5c-514b167bac4f/.tempmediaStorage'
const STORES = [
  {
    filePath: `${BASE}/media_4903230d-2b2c-4fbc-9b5c-514b167bac4f_1784465946649.png`,
    publicId: 'bgoc/store-logos/beverly-meals-bakeries',
    name: 'Beverly Meals & Bakeries',
    slug: 'beverly-meals-bakeries',
    category: 'food',
    description: 'Freshly baked bread, pastries, and confectionery — made daily.',
    fulfillment_type: 'instant'
  },
  {
    filePath: `${BASE}/media_4903230d-2b2c-4fbc-9b5c-514b167bac4f_1784465946937.png`,
    publicId: 'bgoc/store-logos/homeworld-supermarket',
    name: 'Homeworld Supermarket',
    slug: 'homeworld-supermarket',
    category: 'home',
    description: 'Home appliances, electronics, and kitchen essentials.',
    fulfillment_type: 'shippable'
  },
  {
    filePath: `${BASE}/media_4903230d-2b2c-4fbc-9b5c-514b167bac4f_1784465947886.png`,
    publicId: 'bgoc/store-logos/beverly-meals-exclusive-restaurant',
    name: 'Beverly Meals Exclusive Restaurant',
    slug: 'beverly-meals-exclusive-restaurant',
    category: 'food',
    description: 'Fine dining and hot local meals, ready when you are.',
    fulfillment_type: 'instant'
  },
  {
    filePath: `${BASE}/media_4903230d-2b2c-4fbc-9b5c-514b167bac4f_1784465948939.png`,
    publicId: 'bgoc/store-logos/dollnatia-kaylas-castle',
    name: "Dollnatia — Kayla's Castle",
    slug: 'dollnatia-kaylas-castle',
    category: 'toys',
    description: 'Beautiful dolls, toys, and gifts for children.',
    fulfillment_type: 'shippable'
  },
  {
    filePath: `${BASE}/media_4903230d-2b2c-4fbc-9b5c-514b167bac4f_1784465949089.png`,
    publicId: 'bgoc/store-logos/toys-in-candiland',
    name: 'Toys in CandiLand',
    slug: 'toys-in-candiland',
    category: 'toys',
    description: "Exotic candies, chocolates, sweets, and children's toys.",
    fulfillment_type: 'shippable'
  }
]

// ── Cloudinary signed upload ──────────────────────────────────────────────────
function generateSignature(params) {
  const signString = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') + CLOUDINARY_API_SECRET
  return createHash('sha1').update(signString).digest('hex')
}

async function uploadToCloudinary(filePath, publicId) {
  const fileBuffer = readFileSync(filePath)
  const base64File = `data:image/png;base64,${fileBuffer.toString('base64')}`
  const timestamp = Math.round(Date.now() / 1000)
  const params = { public_id: publicId, timestamp }
  const signature = generateSignature(params)

  const formData = new FormData()
  formData.append('file', base64File)
  formData.append('api_key', CLOUDINARY_API_KEY)
  formData.append('timestamp', timestamp.toString())
  formData.append('public_id', publicId)
  formData.append('signature', signature)

  const encodedCloudName = encodeURIComponent(CLOUDINARY_CLOUD_NAME)
  const url = `https://api.cloudinary.com/v1_1/${encodedCloudName}/image/upload`
  const response = await fetch(url, { method: 'POST', body: formData })
  const data = await response.json()
  if (!response.ok) throw new Error(`Cloudinary upload failed: ${JSON.stringify(data)}`)
  return data.secure_url
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Starting store logo uploads...\n')
  for (const store of STORES) {
    try {
      process.stdout.write(`Uploading: ${store.name} ... `)
      const logoUrl = await uploadToCloudinary(store.filePath, store.publicId)
      console.log(`OK -> ${logoUrl}`)

      const { data: existing } = await supabase
        .from('stores')
        .select('id, approval_status')
        .eq('slug', store.slug)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('stores')
          .update({ logo_url: logoUrl, name: store.name })
          .eq('id', existing.id)
        if (error) throw new Error(error.message)
        console.log(`  -> Updated existing shell (status: ${existing.approval_status})`)
      } else {
        const { error } = await supabase
          .from('stores')
          .insert({
            name: store.name,
            slug: store.slug,
            logo_url: logoUrl,
            approval_status: 'unclaimed',
            owner_user_id: null,
            category: store.category,
            description: store.description,
            fulfillment_type: store.fulfillment_type
          })
        if (error) throw new Error(error.message)
        console.log(`  -> Created new unclaimed shell`)
      }
    } catch (err) {
      console.error(`  FAILED: ${err.message}`)
    }
  }
  console.log('\nDone. All store shells created. Visit /register/details to see the claim grid.')
}

main()
