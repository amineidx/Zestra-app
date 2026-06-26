const fs = require('fs')

let code = fs.readFileSync('features/assistant/index.tsx', 'utf8')

// Add TypingIndicator component above AIAssistant
const typingIndicatorCode = `
const TypingIndicator = () => (
  <div className="flex gap-1.5 items-center px-2 py-3">
    <div className="w-2 h-2 rounded-full bg-gemini-gradient opacity-60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 rounded-full bg-gemini-gradient opacity-60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 rounded-full bg-gemini-gradient opacity-60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
  </div>
)

`

if (!code.includes('TypingIndicator = ()')) {
  code = code.replace('interface AIAssistantProps', typingIndicatorCode + 'interface AIAssistantProps')
}

// Update the "Thinking..." block
const oldThinking = `<div className="flex gap-4 items-start mt-8">
                  <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center border bg-gemini-gradient text-white animate-gemini-glow shadow-sm mt-1">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground p-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Thinking...</span>
                  </div>
                </div>`

const newThinking = `<div className="flex gap-4 items-start animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                  <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center bg-gemini-gradient text-white animate-gemini-glow shadow-sm mt-1">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground p-1">
                    <TypingIndicator />
                  </div>
                </div>`
code = code.replace(oldThinking, newThinking)

// Update the Chat list container to have mount animation
const oldChatList = `<div className="flex-1 w-full max-w-3xl mx-auto flex flex-col pb-6 px-4">`
const newChatList = `<div className="flex-1 w-full max-w-3xl mx-auto flex flex-col pb-6 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">`
code = code.replace(oldChatList, newChatList)

// Add a slight animation to the messages themselves
const oldMessageBubble = /<div\s+key=\{message\.id\}\s+className=\{`flex gap-4 text-\[15px\] leading-relaxed w-full \$\{/g
const newMessageBubble = `<div\n                    key={message.id}\n                    className={\`flex gap-4 text-[15px] leading-relaxed w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out \${`
code = code.replace(oldMessageBubble, newMessageBubble)

// Update the Hero empty state so it also animates in when loaded
const oldEmptyState = `<div className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center items-center px-4 pb-20">`
const newEmptyState = `<div className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center items-center px-4 pb-20 animate-in fade-in zoom-in-95 duration-700 ease-out">`
code = code.replace(oldEmptyState, newEmptyState)

fs.writeFileSync('features/assistant/index.tsx', code)
