require('dotenv').config()
const { createGoogleGenerativeAI } = require('@ai-sdk/google')
const { generateText } = require('ai')
const { z } = require('zod')

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY
})

async function run() {
  try {
    console.log("Testing with both function tools and googleSearch")
    await generateText({
      model: google('gemini-2.5-flash'),
      prompt: 'Create a client named Ahmed Bensaid',
      tools: {
        createClient: {
          description: 'Create a new client CRM record.',
          parameters: z.object({
            name: z.string().describe('The full name of the client'),
          }),
          execute: async (args) => ({ success: true, id: '123' })
        },
        googleSearch: google.tools.googleSearch({}),
      }
    })
  } catch(e) {
    console.error("Error:", e.message)
  }
}
run()
