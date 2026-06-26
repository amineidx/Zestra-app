'use client'

import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Plus, Printer, FileText, Check, Search, Download, Trash, ChevronLeft } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

export function Invoices() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE'>('ALL')
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Invoice creator form state
  const [clientId, setClientId] = useState('')
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')) // 30 days default
  const [language, setLanguage] = useState<'FR' | 'AR' | 'BILINGUAL'>('FR')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([
    { description: '', quantity: 1, unitPrice: 0 },
  ])

  // Fetch Invoices
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', search, statusFilter],
    queryFn: async () => {
      const url = new URL('/api/invoices', window.location.origin)
      if (search) url.searchParams.set('query', search)
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Failed to fetch invoices')
      return res.json()
    },
  })

  // Fetch Clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients')
      return res.ok ? res.json() : []
    },
  })

  // Settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings')
      return res.ok ? res.json() : null
    },
  })

  // Create Invoice Mutation
  const createMutation = useMutation({
    mutationFn: async (newInvoice: any) => {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice),
      })
      if (!res.ok) throw new Error('Failed to create invoice')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      setIsCreateOpen(false)
      setSelectedInvoice(data) // View the newly created invoice immediately!
      toast.success('Invoice generated')
      // Reset form
      setClientId('')
      setNotes('')
      setItems([{ description: '', quantity: 1, unitPrice: 0 }])
    },
  })

  // Update Invoice Status Mutation (e.g. mark as PAID)
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update invoice status')
      return res.json()
    },
    onSuccess: (updatedInvoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setSelectedInvoice(updatedInvoice)
      toast.success(`Invoice marked as ${updatedInvoice.status}`)
    },
  })

  // Delete Invoice Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete invoice')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      setSelectedInvoice(null)
      toast.success('Invoice deleted')
    },
  })

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }])
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return
    setItems(items.filter((_, idx) => idx !== index))
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) {
      toast.error('Please select a client')
      return
    }
    const invalidItems = items.some((it) => !it.description || it.unitPrice <= 0)
    if (invalidItems) {
      toast.error('Please add valid description and price for all items')
      return
    }
    createMutation.mutate({
      clientId,
      dueDate,
      language,
      notes,
      items,
    })
  }

  const handlePrint = () => {
    window.print()
  }

  // --- Invoice Preview UI (RTL/LTR Translation Layout) ---
  if (selectedInvoice) {
    const isArabic = selectedInvoice.language === 'AR'
    const isBilingual = selectedInvoice.language === 'BILINGUAL'
    const dir = (isArabic || isBilingual) ? 'rtl' : 'ltr'

    return (
      <div className="py-8 max-w-4xl mx-auto px-4 md:px-8 space-y-6 print:p-0 print:m-0 print:max-w-full">
        {/* Back navigation & Actions (hidden during print) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-hairline pb-6 print:hidden">
          <Button
            onClick={() => setSelectedInvoice(null)}
            variant="ghost"
            className="rounded-lg text-sm text-ink h-10 gap-2 px-3"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Invoices
          </Button>

          <div className="flex flex-wrap gap-2">
            {selectedInvoice.status !== 'PAID' && (
              <Button
                onClick={() => statusMutation.mutate({ id: selectedInvoice.id, status: 'PAID' })}
                variant="outline"
                className="h-10 text-success border-success/35 hover:bg-success/10 rounded-lg text-sm gap-2"
                disabled={statusMutation.isPending}
              >
                <Check className="h-4 w-4" /> Mark Paid
              </Button>
            )}

            <Button
              onClick={handlePrint}
              className="h-10 bg-primary text-primary-foreground hover:bg-primary-active rounded-lg text-sm gap-2"
            >
              <Printer className="h-4 w-4" /> Print / Export PDF
            </Button>

            <Button
              onClick={() => deleteMutation.mutate(selectedInvoice.id)}
              variant="outline"
              className="h-10 text-destructive border-destructive/35 hover:bg-destructive/10 rounded-lg text-sm gap-2"
              disabled={deleteMutation.isPending}
            >
              <Trash className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        {/* Printable Card Area */}
        <Card className="rounded-lg border border-hairline bg-canvas shadow-none p-8 md:p-12 print:border-none print:shadow-none print:p-0 print:text-black">
          <div dir={dir} className="space-y-12">
            {/* Top Header: Business Logo and Title */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 border-b border-hairline pb-8">
              <div className="space-y-3">
                <h1 className="text-2xl font-semibold tracking-tight text-ink uppercase print:text-black">
                  {isArabic ? 'فاتورة' : isBilingual ? 'FACTURE / فاتورة' : 'FACTURE'}
                </h1>
                <p className="text-sm font-medium text-muted-custom">
                  {isArabic ? 'رقم الفاتورة: ' : isBilingual ? 'N° Facture / رقم: ' : 'Invoice No: '}
                  <span className="text-ink font-semibold">{selectedInvoice.invoiceNumber}</span>
                </p>
                <p className="text-xs text-muted-custom">
                  {isArabic ? 'تاريخ الإصدار: ' : isBilingual ? 'Date / تاريخ: ' : 'Date: '}
                  {format(new Date(selectedInvoice.date), 'yyyy-MM-dd')}
                </p>
                <p className="text-xs text-muted-custom">
                  {isArabic ? 'تاريخ الاستحقاق: ' : isBilingual ? 'Échéance / استحقاق: ' : 'Due Date: '}
                  <span className="font-medium text-ink">{format(new Date(selectedInvoice.dueDate), 'yyyy-MM-dd')}</span>
                </p>
              </div>

              {/* Business details */}
              <div className="text-right print:text-right space-y-1 text-sm text-body-text max-w-xs">
                <h3 className="font-semibold text-ink text-base">{settings?.businessName || 'Zestra User'}</h3>
                <p>{settings?.address}</p>
                <p>{settings?.phone}</p>
                <p>{settings?.email}</p>
                <p className="text-xs mt-2 border-t border-hairline/60 pt-2">
                  <span className="font-medium text-ink">NIF:</span> {settings?.nif}
                </p>
                <p className="text-xs">
                  <span className="font-medium text-ink">Auto-Entrepreneur N°:</span> {settings?.autoEntrepreneurNumber}
                </p>
              </div>
            </div>

            {/* Client Info block */}
            <div className="p-4 bg-surface-soft border border-hairline rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold text-ink uppercase text-xs tracking-wider mb-2">
                  {isArabic ? 'موجه إلى' : isBilingual ? 'CLIENT / العميل' : 'BILL TO'}
                </h4>
                <p className="font-medium text-ink text-base">{selectedInvoice.client.name}</p>
                <p className="text-muted-custom mt-1">{selectedInvoice.client.address}</p>
              </div>
              <div className="space-y-1 text-xs">
                {selectedInvoice.client.nif && (
                  <p>
                    <span className="font-semibold text-ink">NIF:</span> {selectedInvoice.client.nif}
                  </p>
                )}
                {selectedInvoice.client.email && (
                  <p>
                    <span className="font-semibold text-ink">Email:</span> {selectedInvoice.client.email}
                  </p>
                )}
                {selectedInvoice.client.phone && (
                  <p>
                    <span className="font-semibold text-ink">Phone:</span> {selectedInvoice.client.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-hairline rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-surface-soft">
                  <TableRow className="border-hairline">
                    <TableHead className="text-xs uppercase font-medium text-muted-custom py-3">
                      {isArabic ? 'الوصف' : isBilingual ? 'Description / الوصف' : 'Description'}
                    </TableHead>
                    <TableHead className="text-xs uppercase font-medium text-muted-custom py-3 text-center w-24">
                      {isArabic ? 'الكمية' : isBilingual ? 'Qté / الكمية' : 'Qty'}
                    </TableHead>
                    <TableHead className="text-xs uppercase font-medium text-muted-custom py-3 text-right w-36">
                      {isArabic ? 'سعر الوحدة' : isBilingual ? 'P.U. / السعر' : 'Unit Price'}
                    </TableHead>
                    <TableHead className="text-xs uppercase font-medium text-muted-custom py-3 text-right w-40">
                      {isArabic ? 'المجموع' : isBilingual ? 'Total / المجموع' : 'Total'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoice.items.map((item: any) => (
                    <TableRow key={item.id} className="border-hairline">
                      <TableCell className="text-sm font-medium text-ink py-4">{item.description}</TableCell>
                      <TableCell className="text-sm text-body-text text-center py-4">{item.quantity}</TableCell>
                      <TableCell className="text-sm text-body-text text-right py-4">
                        {item.unitPrice.toLocaleString()} DA
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-ink text-right py-4">
                        {item.total.toLocaleString()} DA
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Subtotal & Totals block */}
            <div className="flex justify-end pt-4">
              <div className="w-80 space-y-3 text-sm border-t border-hairline pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-custom">
                    {isArabic ? 'المجموع الفرعي' : isBilingual ? 'Sous-total / الفرعي' : 'Subtotal'}
                  </span>
                  <span className="font-medium text-ink">{selectedInvoice.subtotal.toLocaleString()} DA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-custom">
                    {isArabic ? 'الضريبة (0٪)' : isBilingual ? 'Taxe (0%) / الضريبة' : 'Tax (0%)'}
                  </span>
                  <span className="font-medium text-ink">0.00 DA</span>
                </div>
                <div className="flex justify-between text-base border-t border-hairline pt-3 font-semibold text-ink">
                  <span>
                    {isArabic ? 'الإجمالي الصافي' : isBilingual ? 'TOTAL NET / الإجمالي' : 'TOTAL NET'}
                  </span>
                  <span className="text-lg text-signature-coral print:text-black">
                    {selectedInvoice.total.toLocaleString()} DZD
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Notes */}
            {selectedInvoice.notes && (
              <div className="p-4 bg-surface-soft border border-hairline rounded-lg text-xs leading-relaxed text-body-text space-y-1">
                <h5 className="font-semibold text-ink">
                  {isArabic ? 'ملاحظات الدفع' : isBilingual ? 'CONDITIONS / ملاحظات' : 'PAYMENT TERMS'}
                </h5>
                <p className="whitespace-pre-line">{selectedInvoice.notes}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 py-8 max-w-5xl mx-auto px-4 md:px-8">
      {/* List Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-hairline pb-6">
        <div>
          <span className="text-xs font-semibold tracking-widest text-muted-custom uppercase">Billing Desk</span>
          <h1 className="text-3xl font-normal tracking-tight text-ink mt-1">Invoices</h1>
          <p className="text-sm text-body-text mt-1">Generate bilingual commercial invoices for your services.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger className="rounded-lg bg-primary text-primary-foreground hover:bg-primary-active h-10 px-4 gap-2 text-sm flex items-center justify-center font-medium cursor-pointer">
            <Plus className="h-4 w-4" /> Create Invoice
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl bg-canvas max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-normal tracking-tight text-ink">Generate Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-6 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase font-medium text-muted-custom">Client CRM Record</label>
                  <Select value={clientId} onValueChange={(val: any) => setClientId(val || '')} required>
                    <SelectTrigger className="border-hairline h-10 bg-canvas text-ink">
                      <SelectValue placeholder="Select Client" />
                    </SelectTrigger>
                    <SelectContent className="bg-canvas">
                      {clients.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase font-medium text-muted-custom">Invoice Language</label>
                  <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
                    <SelectTrigger className="border-hairline h-10 bg-canvas text-ink">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-canvas">
                      <SelectItem value="FR">French (LTR)</SelectItem>
                      <SelectItem value="AR">Arabic (RTL)</SelectItem>
                      <SelectItem value="BILINGUAL">Bilingual FR/AR (RTL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase font-medium text-muted-custom">Due Date</label>
                  <Input
                    required
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="border-hairline h-10"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-hairline pb-2">
                  <label className="text-xs uppercase font-semibold text-ink tracking-wider">Line Items</label>
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    variant="outline"
                    className="h-8 text-xs gap-1 border-hairline bg-canvas"
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </Button>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] uppercase font-medium text-muted-custom">Description</label>
                        <Input
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Web development service"
                          className="border-hairline h-9"
                        />
                      </div>
                      <div className="w-16 space-y-1">
                        <label className="text-[10px] uppercase font-medium text-muted-custom">Qty</label>
                        <Input
                          required
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="border-hairline h-9"
                        />
                      </div>
                      <div className="w-32 space-y-1">
                        <label className="text-[10px] uppercase font-medium text-muted-custom">Unit Price (DA)</label>
                        <Input
                          required
                          type="number"
                          value={item.unitPrice || ''}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          placeholder="Price"
                          className="border-hairline h-9"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        variant="ghost"
                        className="h-9 w-9 text-muted-custom hover:text-destructive hover:bg-destructive/10 shrink-0"
                        disabled={items.length === 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-muted-custom">Invoice Notes (e.g., Bank details / IBAN)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment bank details, CCP, or terms of service..."
                  rows={2}
                  className="w-full text-sm p-3 bg-canvas border border-hairline rounded-md focus:outline-none focus:border-ink resize-none"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-active text-primary-foreground font-medium rounded-lg h-10 text-sm"
                  disabled={createMutation.isPending}
                >
                  Generate Invoice PDF
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-custom" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number or client..."
            className="pl-9 border-hairline h-10 bg-canvas"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val: any) => setStatusFilter(val)}
        >
          <SelectTrigger className="w-full md:w-[180px] border-hairline h-10 bg-canvas text-ink">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent className="bg-canvas">
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table grid */}
      <Card className="rounded-lg border border-hairline shadow-none overflow-hidden bg-canvas">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-surface-soft">
              <TableRow className="border-hairline">
                <TableHead className="text-xs uppercase font-medium text-muted-custom py-3">Invoice Number</TableHead>
                <TableHead className="text-xs uppercase font-medium text-muted-custom py-3">Client</TableHead>
                <TableHead className="text-xs uppercase font-medium text-muted-custom py-3">Issue Date</TableHead>
                <TableHead className="text-xs uppercase font-medium text-muted-custom py-3">Due Date</TableHead>
                <TableHead className="text-xs uppercase font-medium text-muted-custom py-3">Status</TableHead>
                <TableHead className="text-xs uppercase font-medium text-muted-custom py-3 text-right">Total Net</TableHead>
                <TableHead className="text-xs uppercase font-medium text-muted-custom py-3 text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ink mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-custom">
                    No invoices found. Generate a client bill to get started.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv: any) => (
                  <TableRow
                    key={inv.id}
                    className="border-hairline hover:bg-surface-soft/50 cursor-pointer"
                    onClick={() => setSelectedInvoice(inv)}
                  >
                    <TableCell className="text-sm font-semibold text-ink py-4 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-custom" />
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell className="text-sm text-body-text py-4">{inv.client.name}</TableCell>
                    <TableCell className="text-sm text-body-text py-4">
                      {format(new Date(inv.date), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell className="text-sm text-body-text py-4">
                      {format(new Date(inv.dueDate), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={inv.status}
                        onValueChange={(val: any) => statusMutation.mutate({ id: inv.id, status: val })}
                      >
                        <SelectTrigger
                          className={`w-28 h-8 text-[11px] font-semibold uppercase rounded-full border-none focus:ring-0 ${
                            inv.status === 'PAID'
                              ? 'bg-success/10 text-success'
                              : inv.status === 'SENT'
                              ? 'bg-blue-100 text-blue-800'
                              : inv.status === 'OVERDUE'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-muted text-muted-custom'
                          }`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-canvas">
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="SENT">Sent</SelectItem>
                          <SelectItem value="PAID">Paid</SelectItem>
                          <SelectItem value="OVERDUE">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-ink text-right py-4">
                      {inv.total.toLocaleString()} DA
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedInvoice(inv)
                        }}
                        className="text-xs text-link font-medium hover:bg-surface-soft px-3 h-8"
                      >
                        View
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
