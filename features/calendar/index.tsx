'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Calendar as CalendarIcon, Plus, AlertTriangle, CheckCircle2, Circle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

export function Calendar() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [type, setType] = useState<'TAX' | 'CASNOS' | 'RENEWAL' | 'OTHER'>('TAX')

  // Load reminders
  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const res = await fetch('/api/reminders')
      if (!res.ok) throw new Error('Failed to load reminders')
      return res.json()
    },
  })

  // Create Reminder Mutation
  const createMutation = useMutation({
    mutationFn: async (newReminder: any) => {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReminder),
      })
      if (!res.ok) throw new Error('Failed to create reminder')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      setIsCreateOpen(false)
      toast.success('Reminder added to schedule')
      // Reset form
      setTitle('')
      setDescription('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setType('TAX')
    },
  })

  // Toggle Completion Mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const res = await fetch('/api/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isCompleted }),
      })
      if (!res.ok) throw new Error('Failed to update reminder')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      toast.success('Deadline status updated')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !date) {
      toast.error('Title and Date are required')
      return
    }
    createMutation.mutate({
      title,
      description: description || undefined,
      date,
      type,
    })
  }

  // Preset Deadlines for Algerian Auto Entrepreneurs
  const presetDeadlines = [
    {
      title: 'CASNOS Social Security Declaration',
      date: '2026-07-31',
      description: 'Deadline to declare and pay the minimum annual social security contribution.',
      type: 'CASNOS',
    },
    {
      title: 'Annual IFU Income Tax Filing',
      date: '2026-06-30',
      description: 'Deadline for annual auto entrepreneur declaration of gross revenue (G50).',
      type: 'TAX',
    },
  ]

  return (
    <div className="space-y-8 py-8 max-w-5xl mx-auto px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Deadlines</span>
          <h1 className="text-3xl font-normal tracking-tight text-foreground mt-1">Calendar & Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">Track regulatory tax filings and social security payments.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger className="rounded-lg bg-primary text-primary-foreground hover:bg-primary-active h-10 px-4 gap-2 text-sm flex items-center justify-center font-medium cursor-pointer">
            <Plus className="h-4 w-4" /> Add Reminder
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-background">
            <DialogHeader>
              <DialogTitle className="text-xl font-normal tracking-tight text-foreground">Add Reminder</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-muted-foreground">Reminder Title</label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Renew auto-entrepreneur card"
                  className="border-border h-10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-muted-foreground">Details</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write details..."
                  rows={2}
                  className="w-full text-sm p-3 bg-background border border-border rounded-md focus:outline-none focus:border-ink resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase font-medium text-muted-foreground">Due Date</label>
                  <Input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border-border h-10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase font-medium text-muted-foreground">Category</label>
                  <Select value={type} onValueChange={(val: any) => setType(val)}>
                    <SelectTrigger className="border-border h-10 bg-background text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="TAX">Tax Filing (IFU)</SelectItem>
                      <SelectItem value="CASNOS">CASNOS (Social Security)</SelectItem>
                      <SelectItem value="RENEWAL">Card/Registry Renewal</SelectItem>
                      <SelectItem value="OTHER">Other Tasks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-active text-primary-foreground font-medium rounded-lg h-10 text-sm"
                  disabled={createMutation.isPending}
                >
                  Save Reminder
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Preset guidelines alert in Cream Callout Style */}
      <div className="bg-accent/50 text-foreground p-6 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-1">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Algerian Auto-Entrepreneur Calendar Defaults
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We pre-populate the calendar with standard regulatory dates including CASNOS annual declarations (July 31st) and G50 annual revenue filings (June 30th) to ensure your business remains compliant with local guidelines.
          </p>
        </div>
        <div className="flex items-center justify-end">
          <div className="text-right text-xs border-l border-border pl-4">
            <span className="font-semibold text-foreground block">CASNOS Due:</span>
            <span>July 31, 2026</span>
          </div>
        </div>
      </div>

      {/* Reminders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Active Reminders */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Active Deadlines</h2>
          <div className="border border-border rounded-lg divide-y divide-hairline bg-background overflow-hidden">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ink mx-auto"></div>
              </div>
            ) : reminders.filter((r: any) => !r.isCompleted).length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No active deadlines. Great job!</div>
            ) : (
              reminders
                .filter((r: any) => !r.isCompleted)
                .map((r: any) => (
                  <div key={r.id} className="p-4 flex items-start gap-3 bg-background">
                    <button
                      onClick={() => toggleMutation.mutate({ id: r.id, isCompleted: true })}
                      className="text-muted-foreground hover:text-success mt-0.5"
                    >
                      <Circle className="h-5 w-5" />
                    </button>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-semibold text-foreground leading-tight">{r.title}</h4>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground shrink-0 border border-border">
                          {r.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {format(new Date(r.date), 'MMMM dd, yyyy')}
                      </p>
                      {r.description && <p className="text-xs text-muted-foreground mt-2">{r.description}</p>}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Settled Deadlines */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Settled Deadlines</h2>
          <div className="border border-border rounded-lg divide-y divide-hairline bg-background overflow-hidden opacity-75">
            {reminders.filter((r: any) => r.isCompleted).length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No completed items.</div>
            ) : (
              reminders
                .filter((r: any) => r.isCompleted)
                .map((r: any) => (
                  <div key={r.id} className="p-4 flex items-start gap-3 bg-muted">
                    <button
                      onClick={() => toggleMutation.mutate({ id: r.id, isCompleted: false })}
                      className="text-success mt-0.5"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                    <div className="flex-1 line-through">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-medium text-muted-foreground leading-tight">{r.title}</h4>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                          {r.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Completed on: {format(new Date(r.updatedAt), 'yyyy-MM-dd')}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
