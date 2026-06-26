import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadDocument } from '@/tools'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query') || ''

    const documents = await prisma.document.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { ocrText: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {},
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(documents)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const result = await uploadDocument(data)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json(result.document)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
