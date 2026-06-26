import { NextResponse } from 'next/server'
import { createTransaction, searchTransactions } from '@/tools'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query') || undefined
  const type = (searchParams.get('type') as 'REVENUE' | 'EXPENSE') || undefined
  const category = searchParams.get('category') || undefined
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined
  const clientId = searchParams.get('clientId') || undefined

  const result = await searchTransactions({
    query,
    type,
    category,
    startDate,
    endDate,
    clientId,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  return NextResponse.json(result.transactions)
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const result = await createTransaction(data)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json(result.transaction)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
