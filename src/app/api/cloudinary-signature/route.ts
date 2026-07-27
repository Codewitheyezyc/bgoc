import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { paramsToSign } = await request.json()
    
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    const apiKey = process.env.CLOUDINARY_API_KEY
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME

    if (!apiSecret || !apiKey || !cloudName) {
      return NextResponse.json({ error: 'Cloudinary credentials missing' }, { status: 500 })
    }

    // Sort parameters alphabetically and stringify
    const sortedKeys = Object.keys(paramsToSign).sort()
    const signString = sortedKeys
      .map(key => `${key}=${paramsToSign[key]}`)
      .join('&') + apiSecret

    const signature = crypto
      .createHash('sha1')
      .update(signString)
      .digest('hex')

    return NextResponse.json({
      signature,
      apiKey,
      cloudName
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
