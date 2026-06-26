import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createReminder } from '@/tools'

export async function GET() {
  try {
    const reminders = await prisma.reminder.findMany({
      orderBy: { date: 'asc' },
    })
    return NextResponse.json(reminders)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const result = await createReminder(data)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json(result.reminder)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json()
    const { id, isCompleted } = data
    const reminder = await prisma.reminder.update({
      where: { id },
      data: { isCompleted },
    })
    return NextResponse.json(reminder)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
