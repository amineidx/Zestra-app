const fs = require('fs')
let code = fs.readFileSync('app/api/chat/route.ts', 'utf8')

// Revert tool() wrappers
code = code.replace(/tool\(\{([\s\S]*?)\}\)/g, '{$1}')
// Remove tool import
code = code.replace("import { streamText, tool } from 'ai'", "import { streamText } from 'ai'")

fs.writeFileSync('app/api/chat/route.ts', code)
console.log("Reverted tool wrappers")
