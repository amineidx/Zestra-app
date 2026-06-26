'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownRight, Wallet, Calendar, AlertCircle, FileText, Plus, Landmark } from 'lucide-react'
import { format } from 'date-fns'

interface DashboardProps {
  onNavigate: (tab: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await fetch('/api/analytics')
      if (!res.ok) throw new Error('Failed to load analytics')
      return res.json()
    },
  })

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await fetch('/api/transactions')
      if (!res.ok) throw new Error('Failed to load transactions')
      const data = await res.json()
      return data.slice(0, 5) // recent 5
    },
  })

  const { data: reminders, isLoading: remindersLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const res = await fetch('/api/reminders')
      if (!res.ok) throw new Error('Failed to load reminders')
      const data = await res.json()
      return data.filter((r: any) => !r.isCompleted).slice(0, 3) // next 3 active
    },
  })

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings')
      return res.ok ? res.json() : null
    },
  })

  const isLoading = analyticsLoading || txLoading || remindersLoading

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ink"></div>
      </div>
    )
  }

  const netProfit = analytics?.profit ?? 0
  const totalRevenue = analytics?.totalRevenue ?? 0
  const totalExpenses = analytics?.totalExpenses ?? 0
  const estimatedTax = analytics?.estimatedTax ?? 0

  return (
    <div className="space-y-12 py-8 max-w-5xl mx-auto px-4 md:px-8">
      {/* Editorial Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">OPERATING DESK</span>
          <h1 className="text-3xl font-normal tracking-tight text-foreground mt-1">
            Welcome back, {settings?.businessName || 'Auto Entrepreneur'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your Algerian Auto Entrepreneur registry, billing, and social security.
          </p>
        </div>
        <div className="text-sm bg-muted border border-border p-3 rounded-md text-muted-foreground flex items-center gap-2">
          <Landmark className="h-4 w-4 text-foreground" />
          <span className="font-medium text-foreground">NIF:</span>
          <span>{settings?.nif || 'No NIF set'}</span>
        </div>
      </div>

      {/* Airtable Design Style: 4-Column Flat KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-lg border border-border bg-background shadow-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground">Total Revenue</span>
              <div className="p-1 bg-success/10 rounded">
                <ArrowUpRight className="h-4 w-4 text-success" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-normal tracking-tight text-foreground">
                {totalRevenue.toLocaleString()} <span className="text-sm font-medium">DZD</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Algerian Dinars (inflow)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border bg-background shadow-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground">Total Expenses</span>
              <div className="p-1 bg-destructive/10 rounded">
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-normal tracking-tight text-foreground">
                {totalExpenses.toLocaleString()} <span className="text-sm font-medium">DZD</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Incurred business costs</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border bg-background shadow-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground">Net Profit</span>
              <div className="p-1 bg-foreground/10 rounded">
                <Wallet className="h-4 w-4 text-foreground" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-normal tracking-tight text-foreground">
                {netProfit.toLocaleString()} <span className="text-sm font-medium">DZD</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Net earnings before taxes</p>
            </div>
          </CardContent>
        </Card>

        {/* Estimated tax card using Airtable Forest/Coral signature card style */}
        <Card className="rounded-lg border-none bg-green-500/10 text-white shadow-none">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <span className="text-xs uppercase font-medium tracking-wider opacity-80">Estimated Tax (0.5%)</span>
              <h3 className="text-2xl font-normal tracking-tight mt-4">
                {estimatedTax.toLocaleString()} <span className="text-sm font-medium">DZD</span>
              </h3>
            </div>
            <p className="text-[10px] opacity-75 mt-3">Calculated at standard IFU rate for Algerian auto entrepreneurs.</p>
          </CardContent>
        </Card>
      </div>

      {/* Mid-page punctuations: Coral Signature Card & Cream Callout Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coral card - homepage brand voltage style */}
        <div className="md:col-span-2 bg-signature-coral text-white p-8 rounded-lg flex flex-col justify-between min-h-[220px]">
          <div>
            <h2 className="text-2xl font-normal tracking-tight">Need to issue an invoice?</h2>
            <p className="text-sm opacity-90 mt-2 max-w-md leading-relaxed">
              Zestra automatically generates sequential numbering with dual Arabic/French RTL printing layouts, perfectly matching local business regulations.
            </p>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => onNavigate('invoices')}
              className="px-4 py-2.5 bg-white text-foreground text-sm font-medium rounded-lg hover:bg-slate-100 transition"
            >
              Generate Invoice
            </button>
            <button
              onClick={() => onNavigate('clients')}
              className="px-4 py-2.5 bg-transparent border border-white/35 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition"
            >
              View Client CRM
            </button>
          </div>
        </div>

        {/* Cream social security callout card */}
        <div className="bg-accent/50 text-foreground p-8 rounded-lg flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-destructive">CASNOS ALERT</span>
            <h3 className="text-lg font-medium">Social Security Deadline</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Auto Entrepreneurs must declare and settle their annual CASNOS contributions by July 31st to avoid penalties.
            </p>
          </div>
          <button
            onClick={() => onNavigate('calendar')}
            className="w-full mt-6 py-2.5 bg-foreground text-white text-xs font-semibold rounded-lg hover:bg-primary-active transition text-center uppercase tracking-wider"
          >
            Review Calendar
          </button>
        </div>
      </div>

      {/* Bottom section: Recent Transactions & Deadlines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Recent Transactions */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-foreground uppercase tracking-tight flex items-center justify-between">
            <span>Recent Activity</span>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs font-medium text-link hover:text-link-active"
            >
              View all
            </button>
          </h2>

          <div className="border border-border rounded-lg divide-y divide-hairline bg-background overflow-hidden">
            {transactions?.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No recent activity. Ask the AI assistant to record a transaction!</div>
            ) : (
              transactions?.map((tx: any) => (
                <div key={tx.id} className="p-4 flex justify-between items-center bg-background">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{tx.description}</h4>
                    <span className="text-xs text-muted-foreground">
                      {tx.category} • {format(new Date(tx.date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      tx.type === 'REVENUE' ? 'text-success' : 'text-foreground'
                    }`}
                  >
                    {tx.type === 'REVENUE' ? '+' : '-'} {tx.amount.toLocaleString()} DA
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Deadlines & Reminders */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-foreground uppercase tracking-tight flex items-center justify-between">
            <span>Upcoming Deadlines</span>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-xs font-medium text-link hover:text-link-active"
            >
              View calendar
            </button>
          </h2>

          <div className="border border-border rounded-lg divide-y divide-hairline bg-background overflow-hidden">
            {reminders?.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No upcoming deadlines.</div>
            ) : (
              reminders?.map((reminder: any) => (
                <div key={reminder.id} className="p-4 flex gap-3 items-start bg-background">
                  <Calendar className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{reminder.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due: {format(new Date(reminder.date), 'MMMM dd, yyyy')}
                    </p>
                    {reminder.description && (
                      <p className="text-xs text-muted-foreground mt-1">{reminder.description}</p>
                    )}
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
