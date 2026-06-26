require('dotenv').config()
const { createGoogleGenerativeAI } = require('@ai-sdk/google')
const { generateText, tool } = require('ai')
const { z } = require('zod')

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY
})

async function run() {
  let toolCalled = false
  try {
    const res = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: 'Create a client named Ahmed Bensaid',
      maxSteps: 5,
      system: `You are Zestra's AI Business Assistant, a professional AI operating system designed for a single Algerian Auto Entrepreneur.
Your role is to help the user manage their clients, transactions, invoices, reminders, and documents.

CONSTRAINTS:
1. You MUST NEVER write directly to the database. All creation, updates, deletes, and lookups must go through your tools.
2. If a database tool fails or returns success: false, report the exact error to the user.`,
      tools: {
        createClient: tool({
          description: 'Create a new client CRM record.',
          parameters: z.object({
            name: z.string().describe('The full name of the client'),
          }),
          execute: async (args) => {
            console.log("EXECUTE ARGS:", args)
            toolCalled = true;
            return { success: true, id: '123' }
          }
        })
      }
    })
    console.log("Tool Called:", toolCalled)
    console.log("Text:", res.text)
    console.log("Tool Calls:", res.toolCalls)
  } catch(e) {
    console.error("Error:", e.message)
  }
}
run()
