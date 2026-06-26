'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { useQueryClient } from '@tanstack/react-query'
import {
  User,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Plus,
  Info,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCcw,
  MoreHorizontal
} from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const SUGGESTED_PROMPTS = [
  { label: 'Compute estimated tax', text: 'Compute my estimated tax' },
  { label: 'Show recent transactions', text: 'Search my transactions for this month' },
  { label: 'Add client Ahmed', text: 'Create a client named Ahmed Bensaid' },
  { label: 'CASNOS deadline?', text: 'When is my next CASNOS deadline?' },
]


const TypingIndicator = () => (
  <div className="flex gap-1.5 items-center px-2 py-3">
    <div className="w-2 h-2 rounded-full bg-gemini-gradient opacity-60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 rounded-full bg-gemini-gradient opacity-60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 rounded-full bg-gemini-gradient opacity-60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
  </div>
)

interface AIAssistantProps {
  conversationId?: string | null
}

export function AIAssistant({ conversationId }: AIAssistantProps) {
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fully local input state
  const [localInput, setLocalInput] = useState('')
  const [currentConvId, setCurrentConvId] = useState<string | null>(conversationId || null)
  const [userName, setUserName] = useState('Auto Entrepreneur')

  // Fetch settings for user name
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.businessName) setUserName(data.businessName) })
      .catch(() => {})
  }, [])

  // Create a stable transport that includes the conversationId in the body
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    body: { conversationId: currentConvId },
  }), [currentConvId])

  const {
    messages,
    sendMessage,
    status,
    error,
    setMessages,
  } = useChat({
    id: currentConvId || undefined,
    transport,
    onFinish: () => {
      queryClient.invalidateQueries()
    },
    onError: (err: any) => {
      toast.error(`Assistant error: ${err?.message || 'Unknown error'}`)
    },
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Sync conversationId prop to local state
  useEffect(() => {
    setCurrentConvId(conversationId || null)
  }, [conversationId])

  // Load existing conversation messages or clear them for a new conversation
  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }
    fetch(`/api/conversations/${conversationId}`)
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
  }, [conversationId, setMessages])

  const handleSend = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    setLocalInput('')
    try {
      await sendMessage({ text: trimmed })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    } catch (err: any) {
      toast.error(`Failed to send: ${err?.message || 'Unknown error'}`)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend(localInput)
  }

  const handleSuggestionClick = (text: string) => {
    handleSend(text)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      toast.info('File upload coming soon!')
      e.target.value = ''
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Helper to extract text content from a message
  const getMessageText = (message: any): string => {
    // v7 messages use `parts` array
    if (message.parts) {
      return message.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('')
    }
    // Fallback for legacy `content` field
    if (message.content) return message.content
    return ''
  }

  // Helper to extract tool invocations from a message
  const getToolInvocations = (message: any): any[] => {
    if (message.parts) {
      return message.parts.filter((p: any) => p.type === 'tool-invocation')
    }
    if (message.toolInvocations) return message.toolInvocations
    return []
  }

  const renderToolCall = (part: any, idx: number) => {
    const toolInvocation = part.toolInvocation || part
    const { toolCallId, toolName, state, result } = toolInvocation
    const nameFormatted = (toolName || '').replace(/([A-Z])/g, ' $1').trim()

    if (state === 'call' || state === 'partial-call') {
      return (
        <div key={toolCallId || idx} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 dark:bg-card/40 p-2 rounded-lg my-1.5 border border-dashed border-border/80">
          <Loader2 className="h-3 w-3 animate-spin text-gemini-blue" />
          <span>Running: {nameFormatted}...</span>
        </div>
      )
    }

    if (state === 'result') {
      const isSuccess = result?.success !== false
      return (
        <div key={toolCallId || idx} className="flex items-center gap-2 text-xs p-2 rounded-lg my-1.5 border bg-muted dark:bg-card/30">
          {isSuccess ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
          )}
          <span className="font-semibold text-foreground">
            {nameFormatted}: {isSuccess ? 'Done' : 'Failed'}
          </span>
        </div>
      )
    }

    return null
  }

  const renderChatForm = () => (
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </button>
        )}
      </div>
    </form>
  )

  return (
    <div className="flex flex-col h-full bg-background w-full flex-1 relative overflow-hidden">
      {/* Header */}
      <header className="h-14 px-6 flex items-center justify-end shrink-0 z-20 absolute top-0 right-0 left-0">
        <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground cursor-pointer transition bg-background/50 backdrop-blur-sm p-2 rounded-full mt-2">
          <Info className="h-5 w-5" />
        </div>
      </header>

      {/* Background Glow */}
      {messages.length === 0 && (
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] bg-gemini-gradient rounded-full opacity-[0.04] dark:opacity-[0.08] blur-[100px]"></div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full relative z-10 flex flex-col pt-14">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center items-center px-4 pb-20 animate-in fade-in zoom-in-95 duration-700 ease-out">
            <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-foreground mb-8 text-center">
              Hi {userName.split(' ')[0]}, let&apos;s get into it
            </h1>

            <div className="w-full max-w-2xl relative z-20">
              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6 w-full">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(prompt.text)}
                    className="px-4 py-2 rounded-full border border-border/60 hover:bg-accent/40 bg-card text-xs text-muted-foreground hover:text-foreground transition-colors shadow-sm"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>

              {renderChatForm()}
            </div>
          </div>
        ) : (
          /* Messages Stream */
          <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col pb-6 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            <div className="flex-1 space-y-8 py-8">
              {messages.map((message: any) => {
                const text = getMessageText(message)
                const tools = getToolInvocations(message)

                return (
                  <div
                    key={message.id}
                    className={`flex gap-4 text-[15px] leading-relaxed w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role !== 'user' && (
                      <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center bg-gemini-gradient text-white animate-gemini-glow shadow-sm mt-1">
                        <Sparkles className="h-5 w-5" />
                      </div>
                    )}

                    <div className={`space-y-3 max-w-[85%] ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                      {text && (
                        <div
                          className={`${
                            message.role === 'user'
                              ? 'bg-accent/40 dark:bg-[#282a2c] text-foreground px-5 py-3.5 rounded-[24px]'
                              : 'text-foreground pt-1.5'
                          }`}
                        >
                          <div className={`whitespace-pre-wrap ${message.role === 'user' ? 'text-[15px]' : 'prose prose-sm max-w-none prose-headings:text-foreground prose-a:text-primary dark:prose-invert prose-p:leading-relaxed'}`}>
                            {message.role === 'user' ? text : <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>}
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
                  </div>
                )
              })}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-4 items-start animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                  <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center bg-gemini-gradient text-white animate-gemini-glow shadow-sm mt-1">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground p-1">
                    <TypingIndicator />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-4 rounded-xl mt-4">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>Failed to stream response: {error.message}</span>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Fixed floating form at bottom */}
            <div className="fixed bottom-0 left-0 right-0 pt-8 pb-6 px-4 z-20 bg-gradient-to-t from-background via-background to-transparent pointer-events-none">
              <div className="pointer-events-auto">
                {renderChatForm()}
                <div className="text-[11px] text-center text-muted-foreground mt-3 font-[300]">
                  Gemini is AI and can make mistakes.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
