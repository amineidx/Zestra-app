const fs = require('fs');
const contents = fs.readFileSync('node_modules/@ai-sdk/react/dist/index.d.ts', 'utf8');
const match = contents.match(/type UseChatOptions[\s\S]*?};/);
if (match) console.log(match[0]);
