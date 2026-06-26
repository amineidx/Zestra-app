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
      maxSteps: 3,
      tools: {
        createClient: tool({
          description: 'Create a new client CRM record.',
          parameters: z.object({
            name: z.string().describe('The full name of the client'),
          }),
          execute: async (args) => {
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
