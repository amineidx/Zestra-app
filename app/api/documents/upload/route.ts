import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const filename = file.name
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // 1. Try Vercel Blob if token exists
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(filename, file, {
          access: 'public',
        })
        return NextResponse.json({
          url: blob.url,
          key: blob.pathname,
          name: filename,
        })
      } catch (blobError) {
        console.error('Vercel Blob upload failed, falling back to local:', blobError)
      }
    }

    // 2. Fallback to Local Storage in public/uploads
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const uniqueFilename = `${Date.now()}-${filename}`
    const filepath = path.join(uploadDir, uniqueFilename)
    fs.writeFileSync(filepath, fileBuffer)

    const fileUrl = `/uploads/${uniqueFilename}`
    return NextResponse.json({
      url: fileUrl,
      key: uniqueFilename,
      name: filename,
    })
  } catch (error: any) {
    console.error('File upload API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
