'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Landmark, Briefcase, Key, ShieldAlert } from 'lucide-react'

export function Settings() {
  const queryClient = useQueryClient()

  // Form State
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [nif, setNif] = useState('')
  const [autoEntrepreneurNumber, setAutoEntrepreneurNumber] = useState('')
  const [geminiApiKey, setGeminiApiKey] = useState('')

  // Load Settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to load settings')
      return res.json()
    },
  })

  // Sync state with fetched settings
  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName || '')
      setEmail(settings.email || '')
      setPhone(settings.phone || '')
      setAddress(settings.address || '')
      setNif(settings.nif || '')
      setAutoEntrepreneurNumber(settings.autoEntrepreneurNumber || '')
      setGeminiApiKey(settings.geminiApiKey || '')
    }
  }, [settings])

  // Save Settings Mutation
  const saveMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Business profile updated successfully')
    },
    onError: (err: any) => {
      toast.error(`Error saving profile: ${err.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate({
      businessName,
      email,
      phone,
      address,
      nif,
      autoEntrepreneurNumber,
      geminiApiKey,
    })
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ink"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 py-8 max-w-2xl mx-auto px-4 md:px-8">
      {/* Header */}
      <div className="border-b border-hairline pb-6">
        <span className="text-xs font-semibold tracking-widest text-muted-custom uppercase">Registry Profile</span>
        <h1 className="text-3xl font-normal tracking-tight text-ink mt-1">Settings</h1>
        <p className="text-sm text-body-text mt-1">Configure your official business credentials and API keys.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Business details card */}
        <Card className="rounded-lg border border-hairline shadow-none bg-canvas overflow-hidden">
          <div className="p-4 bg-surface-soft border-b border-hairline flex items-center gap-2 text-ink">
            <Briefcase className="h-4 w-4 text-signature-coral" />
            <h3 className="text-xs uppercase font-semibold tracking-wider">Business Profile</h3>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs uppercase font-medium text-muted-custom">Official Full Name</label>
              <Input
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Auto entrepreneur full name"
                className="border-hairline h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-muted-custom">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@mail.dz"
                  className="border-hairline h-10"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-muted-custom">Phone</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+213..."
                  className="border-hairline h-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase font-medium text-muted-custom">Physical / Mailing Address</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, City, Algeria"
                className="border-hairline h-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Official tax details card */}
        <Card className="rounded-lg border border-hairline shadow-none bg-canvas overflow-hidden">
          <div className="p-4 bg-surface-soft border-b border-hairline flex items-center gap-2 text-ink">
            <Landmark className="h-4 w-4 text-signature-coral" />
            <h3 className="text-xs uppercase font-semibold tracking-wider">Tax & Card Registry</h3>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-muted-custom">NIF (Numéro d'Identification Fiscale)</label>
                <Input
                  value={nif}
                  onChange={(e) => setNif(e.target.value)}
                  placeholder="15-digit tax code"
                  className="border-hairline h-10"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-muted-custom">Auto-Entrepreneur Number</label>
                <Input
                  value={autoEntrepreneurNumber}
                  onChange={(e) => setAutoEntrepreneurNumber(e.target.value)}
                  placeholder="e.g. 26/00123/AE"
                  className="border-hairline h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI key details card */}
        <Card className="rounded-lg border border-hairline shadow-none bg-canvas overflow-hidden">
          <div className="p-4 bg-surface-soft border-b border-hairline flex items-center gap-2 text-ink">
            <Key className="h-4 w-4 text-signature-coral" />
            <h3 className="text-xs uppercase font-semibold tracking-wider">Google Gemini API Key</h3>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs uppercase font-medium text-muted-custom">API Key</label>
              <Input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AQ.Ab8RN6IV..."
                className="border-hairline h-10"
              />
              <p className="text-[10px] text-muted-custom mt-1">
                Your key is stored safely and is used locally to run the Zestra AI agent chat workspace.
              </p>
            </div>

            {/* Warning block */}
            <div className="p-3 bg-signature-cream/50 rounded border border-hairline flex gap-2.5 items-start text-[11px] leading-relaxed text-body-text">
              <ShieldAlert className="h-4 w-4 text-signature-coral shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> Ensure that your billing and key status are valid on Google AI Studio. If tool execution returns API quota errors, verify your keys.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary-active rounded-lg font-medium text-sm transition"
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving changes...' : 'Save Profile Settings'}
        </Button>
      </form>
    </div>
  )
}
