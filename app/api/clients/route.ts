import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient, searchClients } from '@/tools'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query') || undefined
  const result = await searchClients({ query })
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  return NextResponse.json(result.clients)
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const result = await createClient(data)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json(result.client)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
