import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { client: true, items: true },
    })
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    return NextResponse.json(invoice)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    
    // Support status changes (e.g. DRAFT -> PAID)
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: { client: true, items: true },
    })

    // If status is updated to PAID, let's automatically create a corresponding REVENUE transaction in the DB!
    if (data.status === 'PAID') {
      // Check if a transaction for this invoice already exists to prevent duplicate entries
      const existingTx = await prisma.transaction.findFirst({
        where: {
          description: { contains: `Invoice #${invoice.invoiceNumber}` },
          isDeleted: false,
        },
      })
      if (!existingTx) {
        await prisma.transaction.create({
          data: {
            amount: invoice.total,
            type: 'REVENUE',
            description: `Payment for Invoice #${invoice.invoiceNumber}`,
            category: 'Invoicing',
            clientId: invoice.clientId,
            date: new Date(),
          },
        })
      }
    }

    return NextResponse.json(invoice)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.invoice.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
