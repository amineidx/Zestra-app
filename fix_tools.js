const fs = require('fs')
let code = fs.readFileSync('app/api/chat/route.ts', 'utf8')

// Remove googleSearch tool
const googleSearchTool = /\s*\/\/\ 8\.\ Google\ Search\ Grounding\ Tool\s*googleSearch:\ google\.tools\.googleSearch\(\{.*?\}\),/s
code = code.replace(googleSearchTool, '')

// Update the system prompt to remove google search instructions
const oldPrompt = /\/\/\ 8\.\ Google\ Search\ Grounding\ Tool[\s\S]*?googleSearch:\ google\.tools\.googleSearch\(\{\}\),/s
// actually let me just use replace directly

const oldSystem = `SEARCH GROUNDING & KNOWLEDGE RETRIEVAL PRIORITY:
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
When using Google Search Grounding, you MUST cite official Algerian government sources (e.g., DGI - Direction Générale des Impôts, CASNOS portal, Journal Officiel de la République Algérienne, or ministries) whenever possible. Format citations clearly in markdown.`

const newSystem = `SEARCH & KNOWLEDGE RETRIEVAL PRIORITY:
Always search in this exact priority:
1. DATABASE: For business records, clients, transactions, invoices, reminders, or analytics, use the search/read tools first.
2. KNOWLEDGE BASE: For general/local knowledge and reference articles, call 'searchKnowledge' first.
3. LLM REASONING: Use your built-in knowledge when the query cannot be answered by the above.`

code = code.replace(oldSystem, newSystem)

fs.writeFileSync('app/api/chat/route.ts', code)
