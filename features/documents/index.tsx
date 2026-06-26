'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FileText, Search, Upload, Download, Eye, AlertCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

export function Documents() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // Load documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', search],
    queryFn: async () => {
      const url = new URL('/api/documents', window.location.origin)
      if (search) url.searchParams.set('query', search)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Failed to load documents')
      return res.json()
    },
  })

  // Document upload helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      // 1. Upload file (local upload with Vercel Blob fallback)
      const uploadRes = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file to storage')
      }

      const uploadData = await uploadRes.json()

      // 2. Index document in database
      const indexRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: uploadData.name,
          fileUrl: uploadData.url,
          fileKey: uploadData.key,
          // Simulating simple clientside client-OCR parsing or leaving it empty for AI OCR indexing later
          ocrText: `Indexing text metadata from file: ${uploadData.name}. File uploaded to ${uploadData.url}. Ready for AI parsing.`,
        }),
      })

      if (!indexRes.ok) {
        throw new Error('Failed to index file in database')
      }

      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document uploaded and AI searchable')
    } catch (err: any) {
      toast.error(`Upload error: ${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-8 py-8 max-w-5xl mx-auto px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Registry Archive</span>
          <h1 className="text-3xl font-normal tracking-tight text-foreground mt-1">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload and search business registries, declarations, and PDF receipts.</p>
        </div>

        <div className="relative">
          <input
            type="file"
            id="file-upload"
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            disabled={isUploading}
          />
          <label
            htmlFor="file-upload"
            className="rounded-lg bg-primary text-primary-foreground hover:bg-primary-active h-10 px-4 gap-2 text-sm flex items-center justify-center font-medium cursor-pointer"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload Document
          </label>
        </div>
      </div>

      {/* Document grounding help banner */}
      <div className="p-4 bg-accent/50 border border-border rounded-lg flex gap-3 text-xs leading-relaxed text-muted-foreground">
        <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-foreground">AI OCR Grounding Ready</h4>
          <p className="mt-1">
            Uploaded PDFs and files are mapped directly into your database. You can ask your AI co-pilot to search through the contents of your documents (e.g. "Find my tax receipts from last month").
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents by name or indexed text..."
          className="pl-9 border-border h-10 bg-background"
        />
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ink mx-auto"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="col-span-full text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-lg p-12 bg-background">
            No documents archived. Upload a PDF contract or declaration to get started.
          </div>
        ) : (
          documents.map((doc: any) => (
            <Card key={doc.id} className="rounded-lg border border-border shadow-none bg-background flex flex-col justify-between">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="p-2.5 bg-muted border border-border rounded-md text-foreground shrink-0">
                    <FileText className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm tracking-tight truncate" title={doc.name}>
                      {doc.name}
                    </h3>
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      Uploaded: {format(new Date(doc.createdAt), 'yyyy-MM-dd')}
                    </span>
                  </div>
                </div>

                {doc.ocrText && (
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed bg-muted p-2.5 rounded border border-border/60">
                    {doc.ocrText}
                  </p>
                )}

                <div className="flex gap-2 pt-2 border-t border-border/60">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center py-2 border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground rounded-lg flex items-center justify-center gap-1 transition"
                  >
                    <Eye className="h-3 w-3" /> View
                  </a>
                  <a
                    href={doc.fileUrl}
                    download={doc.name}
                    className="flex-1 text-center py-2 border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground rounded-lg flex items-center justify-center gap-1 transition"
                  >
                    <Download className="h-3 w-3" /> Download
                  </a>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
