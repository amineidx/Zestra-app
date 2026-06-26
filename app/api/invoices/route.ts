import { NextResponse } from 'next/server'
import { generateInvoice, searchInvoices } from '@/tools'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query') || undefined
  const status = (searchParams.get('status') as any) || undefined
  const clientId = searchParams.get('clientId') || undefined

  const result = await searchInvoices({
    query,
    status,
    clientId,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  return NextResponse.json(result.invoices)
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const result = await generateInvoice(data)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json(result.invoice)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
