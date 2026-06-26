'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  { label: 'Compute estimated tax', text: 'Read my analytics and compute my estimated tax' },
  { label: 'Show recent transactions', text: 'Search my transactions for this month' },
  { label: 'Add client Ahmed', text: 'Create a client named Ahmed Bensaid with email ahmed@mail.dz and phone 0550123456' },
  { label: 'CASNOS deadline?', text: 'When is my next CASNOS social security deadline?' },
]

export function AIAssistant() {
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [activeModel, setActiveModel] = useState('Flash 2.5')
  
  // Load Settings to get Business Name for greeting
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to load settings')
      return res.json()
    },
  })

  const userName = settings?.businessName || 'Auto Entrepreneur'

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setInput,
    isLoading,
    error,
  } = useChat({
    api: '/api/chat',
    onFinish: () => {
      queryClient.invalidateQueries()
      toast.success('Database updated')
    },
    onError: (err: any) => {
      toast.error(`Assistant error: ${err.message}`)
    },
  } as any) as any

  const handleSuggestionClick = (text: string) => {
    setInput(text)
  }

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Parse tool call status
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
          <span className="font-semibold text-foreground dark:text-foreground">
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

  return (
    <div className="flex flex-col h-full bg-background w-full flex-1">
      {/* Top Banner (Gemini style model select header) */}
      <header className="h-14 px-6 border-b border-border/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-accent cursor-pointer transition">
            <span className="text-sm font-semibold tracking-tight text-foreground dark:text-foreground">Zestra Assistant</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gemini-gradient text-white font-bold uppercase tracking-wider scale-90">
              AI
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground cursor-pointer transition">
          <Info className="h-4.5 w-4.5" />
        </div>
      </header>

      {/* Main chat window container */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        {messages.length === 0 ? (
          /* Empty state - Gemini dashboard look */
          <div className="max-w-3xl w-full mx-auto flex flex-col justify-center min-h-[60vh] space-y-12">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground dark:text-foreground">
                Hi <span className="text-gemini-gradient animate-gemini-glow bg-clip-text text-transparent">{userName}</span>,
              </h1>
              <p className="text-3xl md:text-4xl font-semibold tracking-tight text-muted-foreground">
                let's operationalize your business operations.
              </p>
            </div>
            
            <div className="w-full space-y-4">
              <span className="text-xs uppercase font-semibold tracking-wider text-muted-foreground/80 block">Suggested instructions</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <Card 
                    key={idx} 
                    onClick={() => handleSuggestionClick(prompt.text)}
                    className="cursor-pointer border border-border/60 hover:border-gemini-purple bg-card hover:bg-accent/40 shadow-none transition-all duration-300 p-4 rounded-xl flex items-center justify-between group"
                  >
                    <CardContent className="p-0 flex-1 pr-4">
                      <p className="text-sm font-medium text-foreground dark:text-foreground tracking-tight leading-relaxed">{prompt.label}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{prompt.text}</p>
                    </CardContent>
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5">
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Messages stream - Centered layout */
          <div className="max-w-3xl w-full mx-auto space-y-8 pb-10">
            {messages.map((message: any) => (
              <div
                key={message.id}
                className={`flex gap-4 text-base leading-relaxed ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role !== 'user' && (
                  <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center border bg-gemini-gradient text-white animate-gemini-glow shadow-sm">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                )}

                <div className={`space-y-2 max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-accent/80 dark:bg-card border border-border text-foreground dark:text-foreground'
                        : 'text-foreground dark:text-foreground leading-relaxed'
                    }`}
                  >
                    <div className="whitespace-pre-wrap prose prose-sm max-w-none prose-headings:text-foreground prose-a:text-gemini-blue dark:prose-invert">
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
                  <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center border border-border bg-card text-foreground dark:text-foreground shadow-sm">
                    <User className="h-4.5 w-4.5" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-4 items-center">
                <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center border bg-gemini-gradient text-white animate-gemini-glow shadow-sm">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                  <Loader2 className="h-3 w-3 animate-spin text-gemini-blue animate-pulse" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-4 rounded-xl max-w-lg">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>Failed to stream response: {error.message}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input panel - Centered pill shape with gradient accents */}
      <footer className="p-4 shrink-0">
        <div className="max-w-3xl w-full mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            {/* Pill Container */}
            <div className="flex items-center w-full bg-accent/60 dark:bg-card border border-border/80 hover:border-gemini-purple focus-within:border-gemini-blue focus-within:ring-1 focus-within:ring-gemini-blue/30 rounded-full pl-5 pr-2 py-2.5 transition-all duration-300 shadow-sm gap-2">
              {/* Plus Button */}
              <button
                type="button"
                className="h-9 w-9 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition"
              >
                <Plus className="h-5 w-5" />
              </button>

              {/* TextInput */}
              <Input
                value={input || ''}
                onChange={handleInputChange}
                placeholder="Ask AI co-pilot to create invoices, log income, check CASNOS..."
                className="flex-1 text-sm md:text-base border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-9 px-1 text-foreground dark:text-foreground placeholder:text-muted-foreground/60 shadow-none"
                disabled={isLoading}
              />

              {/* Model Picker */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent dark:bg-muted text-xs font-semibold text-muted-foreground border border-border/60 hover:text-foreground cursor-pointer transition shrink-0">
                <span>{activeModel}</span>
                <ChevronDown className="h-3 w-3" />
              </div>

              {/* Mic Icon */}
              <button
                type="button"
                className="hidden sm:flex h-9 w-9 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground items-center justify-center shrink-0 transition"
              >
                <Mic className="h-4.5 w-4.5" />
              </button>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !(input || '').trim()}
                className={`h-9 w-9 rounded-full text-white flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isLoading || !(input || '').trim()
                    ? 'bg-muted-foreground/20 text-muted-foreground cursor-not-allowed'
                    : 'bg-gemini-gradient animate-gemini-glow hover:scale-105 shadow'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
          <div className="text-[10px] text-center text-muted-foreground/60 mt-2">
            Zestra AI uses Google Gemini 2.5 Flash. Operations may modify database objects.
          </div>
        </div>
      </footer>
    </div>
  )
}
