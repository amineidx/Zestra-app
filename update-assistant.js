const fs = require('fs')

let code = fs.readFileSync('features/assistant/index.tsx', 'utf8')

// Add icons to imports if missing
if (!code.includes('ThumbsUp')) {
  code = code.replace("Plus,", "Plus,\n  ThumbsUp,\n  ThumbsDown,\n  Copy,\n  RefreshCcw,\n  MoreHorizontal,")
}

// Update chat form rendering
const oldChatForm = /const renderChatForm = \(\) => \([\s\S]*?<\/form>\n  \)/
const newChatForm = `const renderChatForm = () => (
    <form onSubmit={handleFormSubmit} className="relative flex flex-col w-full max-w-3xl mx-auto">
      <div className="flex items-center w-full bg-accent/60 dark:bg-[#1e1f20] rounded-[32px] pl-4 pr-2 py-2 transition-all duration-300 gap-2 min-h-[60px] border border-border/10">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="h-10 w-10 rounded-full hover:bg-white/10 text-muted-foreground flex items-center justify-center shrink-0 transition"
        >
          <Plus className="h-6 w-6" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
        />

        <input
          value={localInput}
          onChange={(e) => setLocalInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend(localInput)
            }
          }}
          placeholder="Ask Gemini"
          className="flex-1 text-[15px] border-none focus:outline-none focus:ring-0 bg-transparent h-12 px-1 text-foreground placeholder:text-muted-foreground/60 w-full"
          disabled={isLoading}
          autoComplete="off"
        />

        {localInput.trim() ? (
          <Button
            type="submit"
            disabled={isLoading}
            className="h-10 w-10 rounded-full bg-gemini-gradient text-white flex items-center justify-center shrink-0 transition-all duration-300 animate-gemini-glow hover:scale-105 shadow font-semibold p-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </Button>
        ) : (
          <button
            type="button"
            className="h-10 w-10 rounded-full hover:bg-white/10 text-muted-foreground flex items-center justify-center shrink-0 transition mr-1"
          >
            {/* Mic icon placeholder - you can import Mic if desired */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </button>
        )}
      </div>
    </form>
  )`
code = code.replace(oldChatForm, newChatForm)

// Update sticky bottom container
const oldSticky = /{?\/\* Sticky Form at bottom \*\/[\s\S]*?<\/div>\n            <\/div>/
const newSticky = `{/* Fixed floating form at bottom */
            <div className="fixed bottom-0 left-0 right-0 pt-8 pb-6 px-4 z-20 bg-gradient-to-t from-background via-background to-transparent pointer-events-none">
              <div className="pointer-events-auto">
                {renderChatForm()}
                <div className="text-[11px] text-center text-muted-foreground mt-3 font-[300]">
                  Gemini is AI and can make mistakes.
                </div>
              </div>
            </div>`
code = code.replace(oldSticky, newSticky)

// Update message rendering
const oldMessage = /<div[\s\S]*?key=\{message.id\}[\s\S]*?className=\{`flex gap-4 text-base leading-relaxed \$\{[\s\S]*?message.role === 'user' \? 'justify-end' : 'justify-start'[\s\S]*?`\}[\s\S]*?>[\s\S]*?\{message.role !== 'user' && \([\s\S]*?Sparkles[\s\S]*?<\/div>[\s\S]*?\)\}[\s\S]*?<div className=\{`space-y-2 max-w-\[85%\] \$\{message.role === 'user' \? 'text-right' : ''\}`\}>[\s\S]*?\{text && \([\s\S]*?<div[\s\S]*?className=\{`p-4 rounded-3xl \$\{[\s\S]*?message.role === 'user'[\s\S]*?\? 'bg-accent dark:bg-card border border-border text-foreground'[\s\S]*?: 'text-foreground leading-relaxed'[\s\S]*?`\}[\s\S]*?>[\s\S]*?<div className="whitespace-pre-wrap prose prose-sm max-w-none prose-headings:text-foreground prose-a:text-primary dark:prose-invert">[\s\S]*?\{text\}[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\)\}[\s\S]*?\{\/\* Tool Invocations \*\/\}[\s\S]*?\{tools.length > 0 && \([\s\S]*?<div className="space-y-1">[\s\S]*?\{tools.map\(\(tool: any, idx: number\) => renderToolCall\(tool, idx\)\)\}[\s\S]*?<\/div>[\s\S]*?\)\}[\s\S]*?<\/div>[\s\S]*?\{message.role === 'user' && \([\s\S]*?User[\s\S]*?<\/div>[\s\S]*?\)\}[\s\S]*?<\/div>/
const newMessage = `<div
                    key={message.id}
                    className={\`flex gap-4 text-[15px] leading-relaxed w-full \${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }\`}
                  >
                    {message.role !== 'user' && (
                      <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center bg-gemini-gradient text-white animate-gemini-glow shadow-sm mt-1">
                        <Sparkles className="h-5 w-5" />
                      </div>
                    )}

                    <div className={\`space-y-3 max-w-[85%] \${message.role === 'user' ? 'flex flex-col items-end' : ''}\`}>
                      {text && (
                        <div
                          className={\`\${
                            message.role === 'user'
                              ? 'bg-accent/40 dark:bg-[#282a2c] text-foreground px-5 py-3.5 rounded-[24px]'
                              : 'text-foreground pt-1.5'
                          }\`}
                        >
                          <div className={\`whitespace-pre-wrap prose max-w-none prose-headings:text-foreground prose-a:text-primary dark:prose-invert \${message.role === 'user' ? 'prose-sm' : ''}\`}>
                            <ReactMarkdown>{text}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {/* Tool Invocations */}
                      {tools.length > 0 && (
                        <div className="space-y-2 mt-2 w-full max-w-md">
                          {tools.map((tool: any, idx: number) => renderToolCall(tool, idx))}
                        </div>
                      )}

                      {/* Gemini action icons */}
                      {message.role !== 'user' && (
                        <div className="flex items-center gap-1 pt-1 opacity-80">
                          <button className="h-8 w-8 rounded-full hover:bg-accent/50 dark:hover:bg-[#282a2c] flex items-center justify-center text-muted-foreground transition">
                            <ThumbsUp className="h-4 w-4" />
                          </button>
                          <button className="h-8 w-8 rounded-full hover:bg-accent/50 dark:hover:bg-[#282a2c] flex items-center justify-center text-muted-foreground transition">
                            <ThumbsDown className="h-4 w-4" />
                          </button>
                          <button className="h-8 w-8 rounded-full hover:bg-accent/50 dark:hover:bg-[#282a2c] flex items-center justify-center text-muted-foreground transition">
                            <RefreshCcw className="h-4 w-4" />
                          </button>
                          <button className="h-8 w-8 rounded-full hover:bg-accent/50 dark:hover:bg-[#282a2c] flex items-center justify-center text-muted-foreground transition">
                            <Copy className="h-4 w-4" />
                          </button>
                          <button className="h-8 w-8 rounded-full hover:bg-accent/50 dark:hover:bg-[#282a2c] flex items-center justify-center text-muted-foreground transition">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>`
code = code.replace(oldMessage, newMessage)

fs.writeFileSync('features/assistant/index.tsx', code)
