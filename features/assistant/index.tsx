'use client'

import React, { useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Bot, User, Loader2, Sparkles, AlertCircle, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

const SUGGESTED_PROMPTS = [
  { label: 'Compute estimated tax', text: 'Read my analytics and compute my estimated tax' },
  { label: 'Show recent transactions', text: 'Search my transactions for this month' },
  { label: 'Add client Ahmed', text: 'Create a client named Ahmed Bensaid with email ahmed@mail.dz and phone 0550123456' },
  { label: 'CASNOS deadline?', text: 'When is my next CASNOS social security deadline?' },
]

export function AIAssistant() {
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
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
      // Refresh database tables in dashboard when AI is done running tools
      queryClient.invalidateQueries()
      toast.success('AI updated database data')
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
        <div key={toolCallId} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded-md my-1 border border-dashed border-border">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Executing: {nameFormatted}...</span>
        </div>
      )
    }

    if (state === 'result') {
      const isSuccess = result?.success !== false
      return (
        <div key={toolCallId} className="flex items-center gap-2 text-xs p-2 rounded-md my-1 border bg-surface-soft">
          {isSuccess ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className="font-medium text-ink">
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
    <div className="flex flex-col h-full bg-canvas border-l border-hairline w-full md:w-[400px] xl:w-[450px] shrink-0">
      {/* Top Banner (Quietly Editorial style) */}
      <div className="p-4 border-b border-hairline bg-surface-soft flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-signature-coral animate-pulse" />
          <h2 className="text-sm font-medium tracking-tight text-ink uppercase">AI Co-Pilot</h2>
        </div>
        <HelpCircle className="h-4 w-4 text-muted" />
      </div>

      {/* Suggested prompts if no messages */}
      <div className="flex-1 overflow-y-auto flex flex-col p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-start space-y-6 max-w-sm mx-auto py-10">
            <div className="p-4 bg-signature-cream rounded-lg border-none flex flex-col gap-2">
              <div className="flex items-center gap-2 text-ink">
                <Sparkles className="h-5 w-5 text-signature-coral" />
                <span className="font-semibold text-lg tracking-tight">Meet Zestra AI</span>
              </div>
              <p className="text-sm text-body-text leading-relaxed">
                I can create invoices, log transactions, CRM clients, track taxes, and answer CASNOS questions using grounding.
              </p>
            </div>
            
            <div className="w-full space-y-2">
              <span className="text-xs uppercase font-medium tracking-wider text-muted-custom">Suggested prompts</span>
              <div className="grid grid-cols-1 gap-2 w-full">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(prompt.text)}
                    className="text-left text-sm p-3 bg-canvas border border-hairline rounded-md text-body-text transition hover:border-ink hover:text-ink flex items-center justify-between group"
                  >
                    <span>{prompt.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted transition group-hover:text-ink group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Messages list */
          <div className="space-y-4 flex-1">
            {messages.map((message: any) => (
              <div
                key={message.id}
                className={`flex gap-3 text-sm leading-relaxed max-w-[90%] ${
                  message.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center border border-hairline ${
                    message.role === 'user'
                      ? 'bg-canvas text-ink'
                      : 'bg-signature-cream text-ink'
                  }`}
                >
                  {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div className="space-y-1">
                  <div
                    className={`p-3 rounded-lg text-body-text ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface-soft border border-hairline'
                    }`}
                  >
                    <div className="whitespace-pre-line prose prose-sm max-w-none prose-headings:text-ink prose-a:text-link">
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
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>Failed to stream response: {error.message}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input panel */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-hairline bg-canvas">
        <div className="flex gap-2">
          <Input
            value={input || ''}
            onChange={handleInputChange}
            placeholder="Ask AI to create invoice, add client, log tax..."
            className="flex-1 text-sm bg-canvas border-hairline focus-visible:border-ink h-11"
            disabled={isLoading}
          />
          <Button
            type="submit"
            className="h-11 px-5 bg-primary text-primary-foreground hover:bg-primary-active rounded-md transition font-medium text-sm"
            disabled={isLoading || !(input || '').trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  )
}
