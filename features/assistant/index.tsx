'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bot,
  User,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Plus,
  Mic,
  ArrowRight,
  ChevronDown,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

const SUGGESTED_PROMPTS = [
  { label: 'Compute estimated tax', text: 'Compute my estimated tax' },
  { label: 'Show recent transactions', text: 'Search my transactions for this month' },
  { label: 'Add client Ahmed', text: 'Create a client named Ahmed Bensaid' },
  { label: 'CASNOS deadline?', text: 'When is my next CASNOS deadline?' },
]

interface AIAssistantProps {
  conversationId?: string | null
}

export function AIAssistant({ conversationId }: AIAssistantProps) {
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeModel, setActiveModel] = useState('Flash')
  
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to load settings')
      return res.json()
    },
  })

  // Fetch initial messages if we have a conversationId
  const { data: conversationData } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return { messages: [] }
      const res = await fetch(`/api/conversations/${conversationId}`)
      if (!res.ok) throw new Error('Failed to load conversation')
      return res.json()
    },
    enabled: !!conversationId,
  })

  const userName = settings?.businessName || 'Auto Entrepreneur'

  // Local state to track the conversation ID if one is created during a "New" session
  const [currentConvId, setCurrentConvId] = useState<string | null>(conversationId || null)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setInput,
    isLoading,
    error,
    append,
  } = useChat({
    api: '/api/chat',
    id: currentConvId || undefined,
    body: { conversationId: currentConvId }, // Pass currentConvId to the API
    initialMessages: conversationData?.messages?.map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    })) || [],
    onResponse: (response: any) => {
      const newId = response.headers.get('x-conversation-id')
      if (newId && !currentConvId) {
        setCurrentConvId(newId)
        // Note: queryClient.invalidateQueries() will run onFinish, which updates the sidebar
      }
    },
    onFinish: () => {
      queryClient.invalidateQueries()
      toast.success('Database updated')
    },
    onError: (err: any) => {
      toast.error(`Assistant error: ${err.message}`)
    },
  } as any) as any

  const handleSuggestionClick = (text: string) => {
    append({ role: 'user', content: text })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      toast.info('File upload coming soon! (Mocked for UI)')
      e.target.value = '' // reset
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const renderToolCall = (toolInvocation: any) => {
    const { toolCallId, toolName, state, result } = toolInvocation
    const nameFormatted = toolName.replace(/([A-Z])/g, ' $1').trim()

    if (state === 'call') {
      return (
        <div key={toolCallId} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 dark:bg-card/40 p-2 rounded-lg my-1.5 border border-dashed border-border/80">
          <Loader2 className="h-3 w-3 animate-spin text-gemini-blue" />
          <span>Running operation: {nameFormatted}...</span>
        </div>
      )
    }

    if (state === 'result') {
      const isSuccess = result?.success !== false
      return (
        <div key={toolCallId} className="flex items-center gap-2 text-xs p-2 rounded-lg my-1.5 border bg-muted dark:bg-card/30">
          {isSuccess ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
          )}
          <span className="font-semibold text-foreground">
            {nameFormatted}: {isSuccess ? 'Completed' : 'Failed'}
          </span>
          {result?.client && <span className="text-muted-foreground text-[10px]">({result.client.name})</span>}
          {result?.transaction && <span className="text-muted-foreground text-[10px]">({result.transaction.amount} DZD)</span>}
          {result?.invoice && <span className="text-muted-foreground text-[10px]">({result.invoice.invoiceNumber})</span>}
        </div>
      )
    }

    return null
  }

  // The chat form which we render in different places depending on message state
  const renderChatForm = () => (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="relative flex flex-col w-full">
      {/* Pill Container */}
      <div className="flex items-center w-full bg-accent/60 dark:bg-card border border-border/80 hover:border-gemini-purple focus-within:border-gemini-blue focus-within:ring-1 focus-within:ring-gemini-blue/30 rounded-full pl-5 pr-2 py-2 transition-all duration-300 shadow-sm gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="h-10 w-10 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition"
        >
          <Plus className="h-5 w-5" />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload}
        />

        {/* Replaced <Input> with standard <input> to fix "doesnt write anything" bug if it was caused by custom component */}
        <input
          value={input || ''}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Gemini"
          className="flex-1 text-sm md:text-base border-none focus:outline-none focus:ring-0 bg-transparent h-12 px-1 text-foreground placeholder:text-muted-foreground/60 w-full"
          disabled={isLoading}
        />

        {/* Submit Button - Replaced mic with Go button */}
        {(input || '').trim() && (
          <Button
            type="submit"
            disabled={isLoading}
            className="h-10 rounded-full bg-gemini-gradient text-white flex items-center justify-center shrink-0 transition-all duration-300 animate-gemini-glow hover:scale-105 shadow font-semibold px-4"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Go"
            )}
          </Button>
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
          /* Empty State - Centered layout matching reference image */
          <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center items-center px-4 pb-20">
            <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-foreground mb-8 text-center">
              Hi {userName.split(' ')[0]}, let's get into it
            </h1>
            
            <div className="w-full max-w-2xl relative z-20">
              {/* Quick Actions at the top of chat box */}
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
          <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col pb-6 px-4">
            <div className="flex-1 space-y-8 py-8">
              {messages.map((message: any) => (
                <div
                  key={message.id}
                  className={`flex gap-4 text-base leading-relaxed ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role !== 'user' && (
                    <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center border bg-gemini-gradient text-white animate-gemini-glow shadow-sm mt-1">
                      <Sparkles className="h-4.5 w-4.5" />
                    </div>
                  )}

                  <div className={`space-y-2 max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`p-4 rounded-3xl ${
                        message.role === 'user'
                          ? 'bg-accent dark:bg-card border border-border text-foreground'
                          : 'text-foreground leading-relaxed'
                      }`}
                    >
                      <div className="whitespace-pre-wrap prose prose-sm max-w-none prose-headings:text-foreground prose-a:text-primary dark:prose-invert">
                        {message.content}
                      </div>
                    </div>

                    {/* Render Tool Invocations */}
                    {message.toolInvocations && (
                      <div className="space-y-1">
                        {message.toolInvocations.map((toolInvocation: any) =>
                          renderToolCall(toolInvocation)
                        )}
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center border border-border bg-card text-foreground shadow-sm mt-1">
                      <User className="h-4.5 w-4.5" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-4 items-start mt-8">
                  <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center border bg-gemini-gradient text-white animate-gemini-glow shadow-sm mt-1">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground p-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Thinking...</span>
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

            {/* Sticky Form at bottom for active chat */}
            <div className="sticky bottom-0 bg-background/80 backdrop-blur-xl pt-2 pb-4 w-full z-20">
              {renderChatForm()}
              <div className="text-[10px] text-center text-muted-foreground mt-2">
                Zestra AI may display inaccurate info.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
