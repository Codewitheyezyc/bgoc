// upload-all-correct-logos.mjs
import { createHash } from 'crypto'
import { readFileSync } from 'fs'

const CLOUDINARY_CLOUD_NAME = 'yufacqum'
const CLOUDINARY_API_KEY    = '624134377654392'
const CLOUDINARY_API_SECRET = 'pYBJ2qqXCZdrZFkojvXQ-Jqdgr0'

const brainDir = 'C:/Users/CT/.gemini/antigravity-ide/brain/4903230d-2b2c-4fbc-9b5c-514b167bac4f/'

const storeLogos = [
  {
    name: 'Beverly Meals & Bakeries',
    slug: 'beverly-meals-bakeries',
    file: 'media__1784465772464.png',
    category: 'food',
    description: 'Freshly baked bread, pastries, and confectionery — made daily.',
    fulfillment: 'instant'
  },
  {
    name: 'Homeworld Supermarket',
    slug: 'homeworld-supermarket',
    file: 'media__1784465772513.png',
    category: 'home',
    description: 'Home appliances, electronics, and kitchen essentials.',
    fulfillment: 'shippable'
  },
  {
    name: 'Beverly Meals Exclusive Restaurant',
    slug: 'beverly-meals-exclusive-restaurant',
    file: 'media__1784465772549.png',
    category: 'food',
    description: 'Fine dining and hot local meals, ready when you are.',
    fulfillment: 'instant'
  },
  {
    name: "Dollnatia — Kayla's Castle",
    slug: 'dollnatia-kaylas-castle',
    file: 'media__1784465772584.png',
    category: 'toys',
    description: 'Beautiful dolls, toys, and gifts for children.',
    fulfillment: 'shippable'
  },
  {
    name: 'Toys in CandiLand',
    slug: 'toys-in-candiland',
    file: 'media__1784465772688.png',
    category: 'toys',
    description: "Exotic candies, chocolates, sweets, and children's toys.",
    fulfillment: 'shippable'
  }
]

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

async function main() {
  console.log('Starting upload of the 5 correct founding store logos to Cloudinary...')
  const results = []

  for (const item of storeLogos) {
    try {
      const filePath = brainDir + item.file
      const publicId = `bgoc/store-logos/${item.slug}`
      console.log(`Uploading logo for: ${item.name} from ${item.file}...`)
      const logoUrl = await uploadToCloudinary(filePath, publicId)
      console.log(`Success! URL: ${logoUrl}`)
      results.push({ ...item, logoUrl })
    } catch (err) {
      console.error(`Failed to upload ${item.name}:`, err.message)
    }
  }

  console.log('\n--- SQL UPDATE QUERIES ---')
  for (const res of results) {
    console.log(`UPDATE stores SET logo_url = '${res.logoUrl}' WHERE slug = '${res.slug}';`)
  }
}

main()
