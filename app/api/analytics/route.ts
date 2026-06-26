import { NextResponse } from 'next/server'
import { readAnalytics } from '@/tools'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined

  const result = await readAnalytics({ startDate, endDate })
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  return NextResponse.json(result.analytics)
}
