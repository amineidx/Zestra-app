'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Plus, Download, Trash, Search, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

export function Transactions() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'REVENUE' | 'EXPENSE'>('ALL')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // New Transaction Form State
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'REVENUE' | 'EXPENSE'>('REVENUE')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [clientId, setClientId] = useState('')

  // Load transactions
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', search, typeFilter],
    queryFn: async () => {
      const url = new URL('/api/transactions', window.location.origin)
      if (search) url.searchParams.set('query', search)
      if (typeFilter !== 'ALL') url.searchParams.set('type', typeFilter)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Failed to load transactions')
      return res.json()
    },
  })

  // Load clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients')
      return res.ok ? res.json() : []
    },
  })

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: async (newTx: any) => {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      })
      if (!res.ok) throw new Error('Failed to create transaction')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      setIsCreateOpen(false)
      toast.success('Transaction logged successfully')
      // Reset form
      setDescription('')
      setAmount('')
      setCategory('')
      setClientId('')
    },
    onError: (err: any) => {
      toast.error(err.message)
    },
  })

  // Soft delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete transaction')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      toast.success('Transaction soft-deleted')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!description || !amount || !category) {
      toast.error('Please fill in all required fields')
      return
    }
    createMutation.mutate({
      description,
      amount: parseFloat(amount),
      type,
      category,
      date,
      clientId: clientId || undefined,
    })
  }

  // Export to CSV helper
  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.info('No transactions to export')
      return
    }
    const headers = ['Date,Description,Type,Category,Amount (DZD),Client Name']
    const rows = transactions.map((t: any) => {
      return `"${format(new Date(t.date), 'yyyy-MM-dd')}","${t.description.replace(/"/g, '""')}","${t.type}","${t.category}",${t.amount},"${t.client?.name || ''}"`
    })
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `zestra_transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('CSV report downloaded')
  }

  return (
    <div className="space-y-8 py-8 max-w-5xl mx-auto px-4 md:px-8">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Financial Logs</span>
          <h1 className="text-3xl font-normal tracking-tight text-foreground mt-1">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">Review inflow revenue and operational costs.</p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="rounded-lg border-border bg-background hover:bg-muted h-10 gap-2 text-sm text-foreground"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger className="rounded-lg bg-primary text-primary-foreground hover:bg-primary-active h-10 px-4 gap-2 text-sm flex items-center justify-center font-medium cursor-pointer">
              <Plus className="h-4 w-4" /> Log Transaction
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-background">
              <DialogHeader>
                <DialogTitle className="text-xl font-normal tracking-tight text-foreground">Log Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs uppercase font-medium text-muted-foreground">Type</label>
                  <Select value={type} onValueChange={(val: any) => setType(val)}>
                    <SelectTrigger className="border-border h-10 bg-background text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="REVENUE">Revenue (Inflow)</SelectItem>
                      <SelectItem value="EXPENSE">Expense (Outflow)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase font-medium text-muted-foreground">Description</label>
                  <Input
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Website consulting, Server hosting fee"
                    className="border-border h-10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs uppercase font-medium text-muted-foreground">Amount (DZD)</label>
                    <Input
                      required
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Amount"
                      className="border-border h-10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase font-medium text-muted-foreground">Category</label>
                    <Input
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Service, Hosting, Tax"
                      className="border-border h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs uppercase font-medium text-muted-foreground">Date</label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="border-border h-10"
                    />
                  </div>
                  {type === 'REVENUE' && (
                    <div className="space-y-1">
                      <label className="text-xs uppercase font-medium text-muted-foreground">Client CRM</label>
                      <Select value={clientId} onValueChange={(val: any) => setClientId(val || '')}>
                        <SelectTrigger className="border-border h-10 bg-background text-foreground">
                          <SelectValue placeholder="Select Client (Optional)" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          <SelectItem value="none">None</SelectItem>
                          {clients.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <DialogFooter className="pt-4">
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-active text-primary-foreground font-medium rounded-lg h-10 text-sm"
                    disabled={createMutation.isPending}
                  >
                    Save Transaction
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by description..."
            className="pl-9 border-border h-10 bg-background"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(val: any) => setTypeFilter(val)}
        >
          <SelectTrigger className="w-full md:w-[180px] border-border h-10 bg-background text-foreground">
            <SelectValue placeholder="Filter type" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="REVENUE">Revenue (Inflows)</SelectItem>
            <SelectItem value="EXPENSE">Expense (Outflows)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table section */}
      <Card className="rounded-lg border border-border shadow-none overflow-hidden bg-background">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow className="border-border">
                <TableHead className="text-xs uppercase font-medium text-muted-foreground py-3">Date</TableHead>
                <TableHead className="text-xs uppercase font-medium text-muted-foreground py-3">Description</TableHead>
                <TableHead className="text-xs uppercase font-medium text-muted-foreground py-3">Type</TableHead>
                <TableHead className="text-xs uppercase font-medium text-muted-foreground py-3">Category</TableHead>
                <TableHead className="text-xs uppercase font-medium text-muted-foreground py-3">Client</TableHead>
                <TableHead className="text-xs uppercase font-medium text-muted-foreground py-3 text-right">Amount</TableHead>
                <TableHead className="text-xs uppercase font-medium text-muted-foreground py-3 text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ink mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                    No transactions found. Use the Log Transaction button or talk to the AI co-pilot.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx: any) => (
                  <TableRow key={tx.id} className="border-border hover:bg-muted/50">
                    <TableCell className="text-sm text-muted-foreground font-medium py-3">
                      {format(new Date(tx.date), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground py-3">{tx.description}</TableCell>
                    <TableCell className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                          tx.type === 'REVENUE'
                            ? 'bg-success/10 text-success'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {tx.type === 'REVENUE' ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        {tx.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground py-3">
                      {tx.client ? tx.client.name : '—'}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-foreground text-right py-3">
                      {tx.amount.toLocaleString()} DZD
                    </TableCell>
                    <TableCell className="text-center py-3">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(tx.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
