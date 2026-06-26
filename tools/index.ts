import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// 1. Client Tools
export async function createClient(args: {
  name: string
  email?: string
  phone?: string
  address?: string
  nif?: string
  autoEntrepreneurNumber?: string
}) {
  try {
    const client = await prisma.client.create({
      data: args,
    })
    return { success: true, client }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateClient(args: {
  id: string
  name?: string
  email?: string
  phone?: string
  address?: string
  nif?: string
  autoEntrepreneurNumber?: string
}) {
  try {
    const { id, ...data } = args
    const client = await prisma.client.update({
      where: { id },
      data,
    })
    return { success: true, client }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function searchClients(args: { query?: string }) {
  try {
    const { query } = args
    const clients = await prisma.client.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { phone: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {},
      include: {
        _count: {
          select: { invoices: true, transactions: true },
        },
      },
      orderBy: { name: 'asc' },
    })
    return { success: true, clients }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 2. Transaction Tools
export async function createTransaction(args: {
  amount: number
  type: 'REVENUE' | 'EXPENSE'
  description: string
  category: string
  date?: string
  clientId?: string
}) {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        amount: args.amount,
        type: args.type,
        description: args.description,
        category: args.category,
        date: args.date ? new Date(args.date) : new Date(),
        clientId: args.clientId || null,
      },
    })
    return { success: true, transaction }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateTransaction(args: {
  id: string
  amount?: number
  type?: 'REVENUE' | 'EXPENSE'
  description?: string
  category?: string
  date?: string
  clientId?: string
}) {
  try {
    const { id, ...data } = args
    const updateData: any = { ...data }
    if (data.date) updateData.date = new Date(data.date)
    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
    })
    return { success: true, transaction }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteTransaction(args: { id: string }) {
  try {
    const { id } = args
    // Soft delete requirement
    const transaction = await prisma.transaction.update({
      where: { id },
      data: { isDeleted: true },
    })
    return { success: true, transaction }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function searchTransactions(args: {
  query?: string
  type?: 'REVENUE' | 'EXPENSE'
  category?: string
  startDate?: string
  endDate?: string
  clientId?: string
}) {
  try {
    const { query, type, category, startDate, endDate, clientId } = args
    const whereClause: any = { isDeleted: false }

    if (query) {
      whereClause.description = { contains: query, mode: 'insensitive' }
    }
    if (type) {
      whereClause.type = type
    }
    if (category) {
      whereClause.category = { contains: category, mode: 'insensitive' }
    }
    if (clientId) {
      whereClause.clientId = clientId
    }
    if (startDate || endDate) {
      whereClause.date = {}
      if (startDate) whereClause.date.gte = new Date(startDate)
      if (endDate) whereClause.date.lte = new Date(endDate)
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: { client: true },
      orderBy: { date: 'desc' },
    })
    return { success: true, transactions }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 3. Invoice Tools
export async function generateInvoice(args: {
  clientId: string
  dueDate: string
  notes?: string
  language?: 'FR' | 'AR' | 'BILINGUAL'
  items: Array<{ description: string; quantity: number; unitPrice: number }>
}) {
  try {
    const { clientId, dueDate, notes, language = 'FR', items } = args

    // Generate sequential invoice number (e.g., FAC-2026-0001)
    const currentYear = new Date().getFullYear()
    const invoiceCount = await prisma.invoice.count()
    const invoiceNumber = `FAC-${currentYear}-${String(invoiceCount + 1).padStart(4, '0')}`

    // Calculate totals
    const itemData = items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }))

    const subtotal = itemData.reduce((sum, item) => sum + item.total, 0)
    // For Algerian Auto Entrepreneurs, standard VAT might not apply directly or it is 0%,
    // but we can support custom tax. Let's calculate standard 0% tax or let user specify.
    const tax = 0 // Auto-entrepreneurs do not collect VAT in Algeria
    const total = subtotal + tax

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        dueDate: new Date(dueDate),
        status: 'DRAFT',
        clientId,
        notes,
        language,
        isArabic: language === 'AR',
        subtotal,
        tax,
        total,
        items: {
          create: itemData,
        },
      },
      include: {
        client: true,
        items: true,
      },
    })

    // Auto-create a corresponding Revenue transaction in draft mode? No, we will keep transactions separate
    // or link them once paid.

    return { success: true, invoice }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function searchInvoices(args: {
  query?: string
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE'
  clientId?: string
}) {
  try {
    const { query, status, clientId } = args
    const whereClause: any = {}

    if (query) {
      whereClause.OR = [
        { invoiceNumber: { contains: query, mode: 'insensitive' } },
        { notes: { contains: query, mode: 'insensitive' } },
      ]
    }
    if (status) {
      whereClause.status = status
    }
    if (clientId) {
      whereClause.clientId = clientId
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: { client: true, items: true },
      orderBy: { invoiceNumber: 'desc' },
    })
    return { success: true, invoices }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 4. Analytics Tools
export async function readAnalytics(args: { startDate?: string; endDate?: string }) {
  try {
    const { startDate, endDate } = args
    const whereClause: any = { isDeleted: false }

    if (startDate || endDate) {
      whereClause.date = {}
      if (startDate) whereClause.date.gte = new Date(startDate)
      if (endDate) whereClause.date.lte = new Date(endDate)
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
    })

    const totalRevenue = transactions
      .filter((t) => t.type === 'REVENUE')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const profit = totalRevenue - totalExpenses

    // Algerian Auto Entrepreneur tax rates (Updated 2026/Law):
    // Standard tax rate is 0.5% of revenue for services/goods.
    const estimatedTax = totalRevenue * 0.005

    // Service/category ranking
    const categories: Record<string, number> = {}
    transactions
      .filter((t) => t.type === 'REVENUE')
      .forEach((t) => {
        categories[t.category] = (categories[t.category] || 0) + t.amount
      })
    const serviceRanking = Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Client ranking
    const clientsData = await prisma.client.findMany({
      include: {
        transactions: {
          where: { type: 'REVENUE', isDeleted: false },
        },
      },
    })
    const clientRanking = clientsData
      .map((c) => {
        const revenue = c.transactions.reduce((sum, t) => sum + t.amount, 0)
        return { name: c.name, revenue }
      })
      .filter((c) => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)

    return {
      success: true,
      analytics: {
        totalRevenue,
        totalExpenses,
        profit,
        estimatedTax,
        clientRanking,
        serviceRanking,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 5. Reminder Tools
export async function createReminder(args: {
  title: string
  description?: string
  date: string
  type: 'TAX' | 'CASNOS' | 'RENEWAL' | 'OTHER'
}) {
  try {
    const reminder = await prisma.reminder.create({
      data: {
        title: args.title,
        description: args.description,
        date: new Date(args.date),
        type: args.type,
      },
    })
    return { success: true, reminder }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 6. Document Tools
export async function uploadDocument(args: {
  name: string
  fileUrl: string
  fileKey: string
  ocrText?: string
}) {
  try {
    const document = await prisma.document.create({
      data: {
        name: args.name,
        fileUrl: args.fileUrl,
        fileKey: args.fileKey,
        ocrText: args.ocrText || null,
        isSearchable: true,
      },
    })
    return { success: true, document }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 7. Knowledge Article Tools
export async function searchKnowledge(args: { query: string }) {
  try {
    const { query } = args
    const articles = await prisma.knowledgeArticle.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { tags: { contains: query, mode: 'insensitive' } },
        ],
      },
    })
    return { success: true, articles }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
