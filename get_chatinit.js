const fs = require('fs');
const contents = fs.readFileSync('node_modules/ai/dist/index.d.ts', 'utf8');
const match = contents.match(/type ChatInit[\s\S]*?};/);
if (match) console.log(match[0]);
