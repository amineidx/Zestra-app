import { NextResponse } from 'next/server'
import { getOrCreateSettings } from '@/lib/db-helpers'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const settings = await getOrCreateSettings()
  if (!settings) {
    return NextResponse.json({ error: 'Failed to retrieve settings' }, { status: 500 })
  }
  return NextResponse.json(settings)
}

export async function PUT(req: Request) {
  try {
    const data = await req.json()
    // Upsert or update Settings with "default" id
    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      update: {
        businessName: data.businessName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        nif: data.nif,
        autoEntrepreneurNumber: data.autoEntrepreneurNumber,
        logoUrl: data.logoUrl,
        signatureUrl: data.signatureUrl,
        geminiApiKey: data.geminiApiKey,
      },
      create: {
        id: 'default',
        businessName: data.businessName || 'Zestra User',
        email: data.email,
        phone: data.phone,
        address: data.address,
        nif: data.nif,
        autoEntrepreneurNumber: data.autoEntrepreneurNumber,
        logoUrl: data.logoUrl,
        signatureUrl: data.signatureUrl,
        geminiApiKey: data.geminiApiKey,
      },
    })
    return NextResponse.json(settings)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
