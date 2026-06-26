'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Award, Percent } from 'lucide-react'

export function Analytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await fetch('/api/analytics')
      if (!res.ok) throw new Error('Failed to load analytics')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ink"></div>
      </div>
    )
  }

  const revenue = analytics?.totalRevenue ?? 0
  const expenses = analytics?.totalExpenses ?? 0
  const profit = analytics?.profit ?? 0
  const estimatedTax = analytics?.estimatedTax ?? 0
  const serviceRanking = analytics?.serviceRanking ?? []
  const clientRanking = analytics?.clientRanking ?? []

  // Max value calculation for bar scales
  const maxServiceVal = serviceRanking.length > 0 ? Math.max(...serviceRanking.map((s: any) => s.value)) : 1
  const maxClientVal = clientRanking.length > 0 ? Math.max(...clientRanking.map((c: any) => c.revenue)) : 1

  return (
    <div className="space-y-12 py-8 max-w-5xl mx-auto px-4 md:px-8">
      {/* Header */}
      <div className="border-b border-hairline pb-6">
        <span className="text-xs font-semibold tracking-widest text-muted-custom uppercase">Reporting</span>
        <h1 className="text-3xl font-normal tracking-tight text-ink mt-1">Financial Analytics</h1>
        <p className="text-sm text-body-text mt-1">Analyze profitability, top clients, and project tax allocations.</p>
      </div>

      {/* Financial metrics highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-lg border border-hairline bg-canvas shadow-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-center text-muted-custom">
              <span className="text-xs uppercase font-medium tracking-wider">Gross Income</span>
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="text-2xl font-normal tracking-tight text-ink">{revenue.toLocaleString()} DA</h3>
              <p className="text-xs text-muted-custom">Total invoices and revenue logged</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-hairline bg-canvas shadow-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-center text-muted-custom">
              <span className="text-xs uppercase font-medium tracking-wider">Operating Expenses</span>
              <TrendingUp className="h-4 w-4 rotate-180" />
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="text-2xl font-normal tracking-tight text-ink">{expenses.toLocaleString()} DA</h3>
              <p className="text-xs text-muted-custom">All business related costs</p>
            </div>
          </CardContent>
        </Card>

        {/* Estimated tax detail in Coral banner style */}
        <div className="bg-signature-coral text-white p-6 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-medium tracking-wider opacity-85">Auto-Entrepreneur Tax (IFU)</span>
            <Percent className="h-4 w-4" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-normal tracking-tight">{estimatedTax.toLocaleString()} DA</h3>
            <p className="text-[10px] opacity-75 mt-1">Calculated at 0.5% rate under current Algerian regulations</p>
          </div>
        </div>
      </div>

      {/* Visual Chart grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Service Category Rankings */}
        <Card className="rounded-lg border border-hairline shadow-none bg-canvas overflow-hidden">
          <CardHeader className="bg-surface-soft border-b border-hairline p-4">
            <CardTitle className="text-sm font-medium text-ink uppercase tracking-wider flex items-center gap-2">
              <Award className="h-4 w-4 text-signature-coral" /> Service Category Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {serviceRanking.length === 0 ? (
              <p className="text-center text-sm text-muted-custom py-8">No service data available.</p>
            ) : (
              serviceRanking.map((s: any, idx: number) => {
                const percentage = (s.value / maxServiceVal) * 100
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-ink">{s.name}</span>
                      <span className="text-body-text">{s.value.toLocaleString()} DA</span>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full h-2.5 bg-surface-soft rounded-full overflow-hidden">
                      <div
                        className="h-full bg-signature-forest rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Client Rankings */}
        <Card className="rounded-lg border border-hairline shadow-none bg-canvas overflow-hidden">
          <CardHeader className="bg-surface-soft border-b border-hairline p-4">
            <CardTitle className="text-sm font-medium text-ink uppercase tracking-wider flex items-center gap-2">
              <Award className="h-4 w-4 text-signature-coral" /> Client Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {clientRanking.length === 0 ? (
              <p className="text-center text-sm text-muted-custom py-8">No client billing logged.</p>
            ) : (
              clientRanking.map((c: any, idx: number) => {
                const percentage = (c.revenue / maxClientVal) * 100
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-ink">{c.name}</span>
                      <span className="text-body-text">{c.revenue.toLocaleString()} DA</span>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full h-2.5 bg-surface-soft rounded-full overflow-hidden">
                      <div
                        className="h-full bg-signature-coral rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tax advice Cream Callout Card */}
      <div className="bg-signature-cream text-ink p-8 rounded-lg space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-signature-coral" />
          <h3 className="text-lg font-semibold tracking-tight">Tax Allocation Advice</h3>
        </div>
        <p className="text-sm text-body-text leading-relaxed">
          As an Algerian Auto-Entrepreneur, your single tax payment is the IFU (Impôt Forfaitaire Unique). The standard rate is **0.5%** of gross earnings.
          We recommend setting aside **1.5%** of your monthly inflows (0.5% for IFU + 1% for additional social and administrative safety buffers) inside your business account so that quarterly or annual tax payments are always fully funded without affecting your operational cash flow.
        </p>
      </div>
    </div>
  )
}
