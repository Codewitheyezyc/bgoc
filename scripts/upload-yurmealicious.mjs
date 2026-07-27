// upload-yurmealicious.mjs
import { createHash } from 'crypto'
import { readFileSync } from 'fs'

const CLOUDINARY_CLOUD_NAME = 'yufacqum'
const CLOUDINARY_API_KEY    = '624134377654392'
const CLOUDINARY_API_SECRET = 'pYBJ2qqXCZdrZFkojvXQ-Jqdgr0'

const filePath = 'C:/Users/CT/.gemini/antigravity-ide/brain/4903230d-2b2c-4fbc-9b5c-514b167bac4f/media__1784478593463.png'
const publicId = 'bgoc/store-logos/yurmealicious-pizza'
const storeName = 'Yurmealicious Pizza'
const storeSlug = 'yurmealicious-pizza'

function generateSignature(params) {
  const signString = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') + CLOUDINARY_API_SECRET
  return createHash('sha1').update(signString).digest('hex')
}

async function uploadToCloudinary() {
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
  try {
    console.log('Uploading Yurmealicious Pizza logo...')
    const logoUrl = await uploadToCloudinary()
    console.log(`Uploaded to Cloudinary: ${logoUrl}`)
    console.log('SQL query follows:')
    console.log(`INSERT INTO stores (name, slug, logo_url, approval_status, owner_user_id, category, description, fulfillment_type) VALUES ('${storeName}', '${storeSlug}', '${logoUrl}', 'unclaimed', NULL, 'food', 'Hot, wood-fired pizza made to order.', 'instant') ON CONFLICT (slug) DO UPDATE SET logo_url = EXCLUDED.logo_url, name = EXCLUDED.name;`)
  } catch (err) {
    console.error(err)
  }
}

main()
