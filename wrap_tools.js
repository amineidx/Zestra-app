const fs = require('fs')
let code = fs.readFileSync('app/api/chat/route.ts', 'utf8')

if (!code.includes('import { streamText, tool } from \'ai\'')) {
  code = code.replace("import { streamText } from 'ai'", "import { streamText, tool } from 'ai'")
}

const toolNames = [
  'createClient', 'updateClient', 'searchClients',
  'createTransaction', 'updateTransaction', 'deleteTransaction', 'searchTransactions',
  'generateInvoice', 'searchInvoices',
  'readAnalytics',
  'createReminder',
  'uploadDocument',
  'searchKnowledge'
]

toolNames.forEach(tName => {
  const regex = new RegExp(`(${tName}:\\s*)\\{(\\s*description:[\\s\\S]*?execute:\\s*async\\s*\\(args:\\s*any\\)\\s*=>\\s*dbTools\\.${tName}\\(args\\),?\\n\\s*)\\}`, 'g')
  code = code.replace(regex, `$1tool({$2})`)
})

fs.writeFileSync('app/api/chat/route.ts', code)
