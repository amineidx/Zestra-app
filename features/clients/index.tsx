'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Plus, Search, Mail, Phone, MapPin, Trash, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

export function Clients() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [nif, setNif] = useState('')
  const [autoEntrepreneurNumber, setAutoEntrepreneurNumber] = useState('')

  // Load clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: async () => {
      const url = new URL('/api/clients', window.location.origin)
      if (search) url.searchParams.set('query', search)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Failed to load clients')
      return res.json()
    },
  })

  // Create Client Mutation
  const createMutation = useMutation({
    mutationFn: async (newClient: any) => {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      })
      if (!res.ok) throw new Error('Failed to create client')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setIsCreateOpen(false)
      toast.success('Client added to CRM database')
      // Reset form
      setName('')
      setEmail('')
      setPhone('')
      setAddress('')
      setNif('')
      setAutoEntrepreneurNumber('')
    },
  })

  // Delete Client Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete client')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client record removed')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) {
      toast.error('Client name is required')
      return
    }
    createMutation.mutate({
      name,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      nif: nif || undefined,
      autoEntrepreneurNumber: autoEntrepreneurNumber || undefined,
    })
  }

  return (
    <div className="space-y-8 py-8 max-w-5xl mx-auto px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-hairline pb-6">
        <div>
          <span className="text-xs font-semibold tracking-widest text-muted-custom uppercase">CRM Database</span>
          <h1 className="text-3xl font-normal tracking-tight text-ink mt-1">Clients</h1>
          <p className="text-sm text-body-text mt-1">Manage contact directories, business NIFs, and invoicing links.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger className="rounded-lg bg-primary text-primary-foreground hover:bg-primary-active h-10 px-4 gap-2 text-sm flex items-center justify-center font-medium cursor-pointer">
            <UserPlus className="h-4 w-4" /> Add Client
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-canvas">
            <DialogHeader>
              <DialogTitle className="text-xl font-normal tracking-tight text-ink">Add Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-muted-custom">Client Name / Corporate Name</label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Salim Boumedienne"
                  className="border-hairline h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase font-medium text-muted-custom">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@company.dz"
                    className="border-hairline h-10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase font-medium text-muted-custom">Phone</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+213 555..."
                    className="border-hairline h-10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-muted-custom">Physical Address</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Algiers, Algeria"
                  className="border-hairline h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase font-medium text-muted-custom">NIF (Tax ID)</label>
                  <Input
                    value={nif}
                    onChange={(e) => setNif(e.target.value)}
                    placeholder="15-digit Tax Code"
                    className="border-hairline h-10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase font-medium text-muted-custom">Auto-Entrepreneur Card N°</label>
                  <Input
                    value={autoEntrepreneurNumber}
                    onChange={(e) => setAutoEntrepreneurNumber(e.target.value)}
                    placeholder="e.g. 26/00123/AE"
                    className="border-hairline h-10"
                  />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-active text-primary-foreground font-medium rounded-lg h-10 text-sm"
                  disabled={createMutation.isPending}
                >
                  Create Client
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-custom" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone..."
          className="pl-9 border-hairline h-10 bg-canvas"
        />
      </div>

      {/* CRM Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ink mx-auto"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="col-span-full text-center py-8 text-sm text-muted-custom border border-dashed border-hairline rounded-lg p-12">
            No client records found. Create one or let the AI co-pilot do it.
          </div>
        ) : (
          clients.map((client: any) => (
            <Card key={client.id} className="rounded-lg border border-hairline shadow-none bg-canvas flex flex-col justify-between">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-ink text-base tracking-tight">{client.name}</h3>
                    {client.autoEntrepreneurNumber && (
                      <span className="text-[10px] bg-signature-cream px-2 py-0.5 rounded text-ink font-medium mt-1 inline-block">
                        Card: {client.autoEntrepreneurNumber}
                      </span>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(client.id)}
                    className="h-8 w-8 text-muted-custom hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 text-xs text-body-text">
                  {client.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-custom" /> {client.email}
                    </p>
                  )}
                  {client.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-custom" /> {client.phone}
                    </p>
                  )}
                  {client.address && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-custom" /> {client.address}
                    </p>
                  )}
                </div>

                {client.nif && (
                  <div className="text-[10px] text-muted-custom border-t border-hairline/60 pt-2">
                    <span className="font-semibold text-ink">NIF:</span> {client.nif}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
