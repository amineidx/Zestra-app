const fs = require('fs')
let code = fs.readFileSync('features/assistant/index.tsx', 'utf8')

// Add ReactMarkdown import
if (!code.includes('import ReactMarkdown')) {
  code = code.replace("import { toast } from 'sonner'", "import { toast } from 'sonner'\nimport ReactMarkdown from 'react-markdown'\nimport remarkGfm from 'remark-gfm'")
}

// Update useEffect for conversation switching
const oldUseEffect = `  // Load existing conversation messages
  useEffect(() => {
    if (!conversationId) return
    fetch(\`/api/conversations/\${conversationId}\`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.messages?.length) {
          const mapped = data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: 'text', text: m.content }],
          }))
          setMessages(mapped)
        }
      })
      .catch(() => {})
  }, [conversationId, setMessages])`

const newUseEffect = `  // Sync conversationId prop to local state
  useEffect(() => {
    setCurrentConvId(conversationId || null)
  }, [conversationId])

  // Load existing conversation messages or clear them for a new conversation
  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }
    fetch(\`/api/conversations/\${conversationId}\`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.messages?.length) {
          const mapped = data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: 'text', text: m.content }],
          }))
          setMessages(mapped)
        } else {
          setMessages([])
        }
      })
      .catch(() => {
        setMessages([])
      })
  }, [conversationId, setMessages])`
code = code.replace(oldUseEffect, newUseEffect)

// Update {text} to use ReactMarkdown
const oldTextRender = `<div className={\`whitespace-pre-wrap \${message.role === 'user' ? 'text-[15px]' : 'prose max-w-none prose-headings:text-foreground prose-a:text-primary dark:prose-invert'}\`}>
                            {text}
                          </div>`
const newTextRender = `<div className={\`whitespace-pre-wrap \${message.role === 'user' ? 'text-[15px]' : 'prose prose-sm max-w-none prose-headings:text-foreground prose-a:text-primary dark:prose-invert prose-p:leading-relaxed'}\`}>
                            {message.role === 'user' ? text : <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>}
                          </div>`
code = code.replace(oldTextRender, newTextRender)

// Make AI text smaller (prose-sm) and leading-relaxed
fs.writeFileSync('features/assistant/index.tsx', code)
