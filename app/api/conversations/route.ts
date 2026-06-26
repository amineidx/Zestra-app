import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    })
    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Failed to fetch conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { title } = await req.json()
    const conversation = await prisma.conversation.create({
      data: { title: title || 'New Conversation' }
    })
    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Failed to create conversation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
