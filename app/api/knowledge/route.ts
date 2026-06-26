import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchKnowledge } from '@/tools'
import { getOrCreateDefaultKnowledge } from '@/lib/db-helpers'

export async function GET(req: Request) {
  // Ensure default articles are seeded if database is empty
  await getOrCreateDefaultKnowledge()

  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query') || ''
  
  if (query) {
    const result = await searchKnowledge({ query })
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json(result.articles)
  }

  try {
    const articles = await prisma.knowledgeArticle.findMany({
      orderBy: { title: 'asc' },
    })
    return NextResponse.json(articles)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const article = await prisma.knowledgeArticle.create({
      data: {
        title: data.title,
        content: data.content,
        tags: data.tags,
      },
    })
    return NextResponse.json(article)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
