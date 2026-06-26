import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import * as dbTools from '@/tools'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const maxDuration = 30 // Set appropriate timeout for Vercel

export async function POST(req: Request) {
  try {
    const { messages, conversationId } = await req.json()
    const latestMessage = messages[messages.length - 1]

    let activeConversationId = conversationId
    
    // If there is a user message, save it
    if (latestMessage && latestMessage.role === 'user') {
      if (!activeConversationId) {
        // Create new conversation
        const conv = await prisma.conversation.create({
          data: { title: latestMessage.content.substring(0, 40) + '...' }
        })
        activeConversationId = conv.id
      }
      
      // Save user message
      await prisma.chatHistory.create({
        data: {
          role: 'user',
          content: latestMessage.content,
          conversationId: activeConversationId
        }
      })
    }

    const result = streamText({
      model: google('gemini-2.5-flash'),
      messages,
      system: `You are Zestra's AI Business Assistant, a professional AI operating system designed for a single Algerian Auto Entrepreneur.
Your role is to help the user manage their clients, transactions, invoices, reminders, and documents.

CONSTRAINTS:
1. You MUST NEVER write directly to the database. All creation, updates, deletes, and lookups must go through your tools.
2. If a database tool fails or returns success: false, report the exact error to the user.

SEARCH GROUNDING & KNOWLEDGE RETRIEVAL PRIORITY:
Always search in this exact priority:
1. DATABASE: For business records, clients, transactions, invoices, reminders, or analytics, use the search/read tools first.
2. KNOWLEDGE BASE: For general/local knowledge and reference articles, call 'searchKnowledge' first.
3. GOOGLE SEARCH GROUNDING: If the info is not in the Database or Knowledge Base, AND is related to:
   - Algerian tax updates (e.g. NIF, G50, auto-entrepreneur rates)
   - CASNOS updates (social security payments, minimum contribution)
   - Legal/official government changes or announcements in Algeria
   Use the 'googleSearch' grounding tool. Do not use it for standard personal scheduling or common database lookups.
4. LLM REASONING: Use your built-in knowledge only when the query cannot be answered by the above.

CITATIONS:
When using Google Search Grounding, you MUST cite official Algerian government sources (e.g., DGI - Direction Générale des Impôts, CASNOS portal, Journal Officiel de la République Algérienne, or ministries) whenever possible. Format citations clearly in markdown.

DZD CURRENCY:
All financial figures, transactions, and invoice items are in Algerian Dinars (DZD). Make sure to format them as 'X DZD' or 'X DA'.

Algerian Auto Entrepreneur Tax:
- Standard tax rate is 0.5% of annual revenue for Auto Entrepreneurs (Updated under Algerian Finance Act).
- CASNOS minimum contribution is calculated annually based on the minimum wage (SNMG). Use search grounding if you are unsure of the latest exact values.`,
      tools: {
        // 1. Client Tools
        createClient: {
          description: 'Create a new client CRM record.',
          parameters: z.object({
            name: z.string().describe('The full name of the client'),
            email: z.string().optional().describe('Email address of the client'),
            phone: z.string().optional().describe('Phone number of the client'),
            address: z.string().optional().describe('Physical address of the client'),
            nif: z.string().optional().describe('Tax identification number (NIF) of the client'),
            autoEntrepreneurNumber: z.string().optional().describe('Auto-entrepreneur card number if applicable'),
          }),
          execute: async (args: any) => dbTools.createClient(args),
        },
        updateClient: {
          description: 'Update an existing client record.',
          parameters: z.object({
            id: z.string().describe('The database ID of the client to update'),
            name: z.string().optional(),
            email: z.string().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
            nif: z.string().optional(),
            autoEntrepreneurNumber: z.string().optional(),
          }),
          execute: async (args: any) => dbTools.updateClient(args),
        },
        searchClients: {
          description: 'Search for clients by name, email, or phone. If no query is provided, lists all clients.',
          parameters: z.object({
            query: z.string().optional().describe('Search term'),
          }),
          execute: async (args: any) => dbTools.searchClients(args),
        },

        // 2. Transaction Tools
        createTransaction: {
          description: 'Create a new transaction (revenue or expense).',
          parameters: z.object({
            amount: z.number().describe('Amount of transaction in DZD'),
            type: z.enum(['REVENUE', 'EXPENSE']).describe('Whether this is an inflow (REVENUE) or outflow (EXPENSE)'),
            description: z.string().describe('Brief description of what this was for'),
            category: z.string().describe('Category (e.g. Consulting, Hardware, Hosting, Office, CASNOS, Tax)'),
            date: z.string().optional().describe('Date of transaction (YYYY-MM-DD), defaults to today'),
            clientId: z.string().optional().describe('Associated client ID if this is revenue from a specific client'),
          }),
          execute: async (args: any) => dbTools.createTransaction(args),
        },
        updateTransaction: {
          description: 'Update an existing transaction record.',
          parameters: z.object({
            id: z.string().describe('The transaction ID to update'),
            amount: z.number().optional(),
            type: z.enum(['REVENUE', 'EXPENSE']).optional(),
            description: z.string().optional(),
            category: z.string().optional(),
            date: z.string().optional(),
            clientId: z.string().optional(),
          }),
          execute: async (args: any) => dbTools.updateTransaction(args),
        },
        deleteTransaction: {
          description: 'Soft delete a transaction by setting its deleted flag to true.',
          parameters: z.object({
            id: z.string().describe('The transaction ID to soft delete'),
          }),
          execute: async (args: any) => dbTools.deleteTransaction(args),
        },
        searchTransactions: {
          description: 'Search transactions by description, type, category, date range, or client.',
          parameters: z.object({
            query: z.string().optional().describe('Search keyword in description'),
            type: z.enum(['REVENUE', 'EXPENSE']).optional(),
            category: z.string().optional(),
            startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
            endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
            clientId: z.string().optional(),
          }),
          execute: async (args: any) => dbTools.searchTransactions(args),
        },

        // 3. Invoice Tools
        generateInvoice: {
          description: 'Generate a printable bilingual invoice with sequential numbering.',
          parameters: z.object({
            clientId: z.string().describe('The client ID associated with this invoice'),
            dueDate: z.string().describe('Due date (YYYY-MM-DD)'),
            notes: z.string().optional().describe('Optional payment terms, bank details, or general notes'),
            language: z.enum(['FR', 'AR', 'BILINGUAL']).optional().default('FR').describe('Invoice language'),
            items: z.array(
              z.object({
                description: z.string().describe('Item name or service description'),
                quantity: z.number().int().positive().describe('Quantity'),
                unitPrice: z.number().positive().describe('Unit price in DZD'),
              })
            ).describe('List of items sold or services provided'),
          }),
          execute: async (args: any) => dbTools.generateInvoice(args),
        },
        searchInvoices: {
          description: 'Search invoices by status, invoice number, or client ID.',
          parameters: z.object({
            query: z.string().optional().describe('Search keyword'),
            status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']).optional(),
            clientId: z.string().optional(),
          }),
          execute: async (args: any) => dbTools.searchInvoices(args),
        },

        // 4. Analytics Tools
        readAnalytics: {
          description: 'Fetch aggregate financial analytics including estimated tax and rankings.',
          parameters: z.object({
            startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
            endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
          }),
          execute: async (args: any) => dbTools.readAnalytics(args),
        },

        // 5. Reminder Tools
        createReminder: {
          description: 'Create a reminder for tasks, taxes, CASNOS, or renewals.',
          parameters: z.object({
            title: z.string().describe('Reminder headline'),
            description: z.string().optional().describe('Details'),
            date: z.string().describe('Date and time (YYYY-MM-DD)'),
            type: z.enum(['TAX', 'CASNOS', 'RENEWAL', 'OTHER']).describe('Category of deadline'),
          }),
          execute: async (args: any) => dbTools.createReminder(args),
        },

        // 6. Document Tools
        uploadDocument: {
          description: 'Index a newly uploaded document URL for AI search.',
          parameters: z.object({
            name: z.string().describe('Document name or file name'),
            fileUrl: z.string().describe('URL to download/view the document'),
            fileKey: z.string().describe('Vercel Blob key or identifier'),
            ocrText: z.string().optional().describe('Extracted text contents if OCR was performed'),
          }),
          execute: async (args: any) => dbTools.uploadDocument(args),
        },

        // 7. Knowledge Tools
        searchKnowledge: {
          description: 'Search local editable business knowledge base before querying search engines.',
          parameters: z.object({
            query: z.string().describe('Search query for local articles'),
          }),
          execute: async (args: any) => dbTools.searchKnowledge(args),
        },

        // 8. Google Search Grounding Tool
        googleSearch: google.tools.googleSearch({}),
      } as any,
      onFinish: async ({ text, toolCalls, toolResults }) => {
        if (activeConversationId) {
          // Log assistant text response
          if (text) {
            await prisma.chatHistory.create({
              data: {
                role: 'assistant',
                content: text,
                conversationId: activeConversationId
              }
            }).catch(console.error)
          }
          // Optionally log tool calls if needed, but text is usually enough for history display
        }
      }
    })

    return (result as any).toDataStreamResponse({
      headers: {
        'x-conversation-id': activeConversationId || ''
      }
    })
  } catch (error: any) {
    console.error('Chat API Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
