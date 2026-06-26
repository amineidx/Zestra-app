'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Search, Plus, BookOpen, Trash, Edit, Tag } from 'lucide-react'
import { toast } from 'sonner'

export function Knowledge() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<any | null>(null)

  // Form States
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')

  // Load articles
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['knowledge', search],
    queryFn: async () => {
      const url = new URL('/api/knowledge', window.location.origin)
      if (search) url.searchParams.set('query', search)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Failed to load articles')
      return res.json()
    },
  })

  // Create article mutation
  const createMutation = useMutation({
    mutationFn: async (newArt: any) => {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArt),
      })
      if (!res.ok) throw new Error('Failed to create article')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] })
      setIsCreateOpen(false)
      toast.success('Knowledge article added')
      // Reset
      setTitle('')
      setContent('')
      setTags('')
    },
  })

  // Edit article mutation
  const editMutation = useMutation({
    mutationFn: async (art: any) => {
      const res = await fetch(`/api/knowledge/${art.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(art),
      })
      if (!res.ok) throw new Error('Failed to update article')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] })
      setEditingArticle(null)
      toast.success('Article updated')
    },
  })

  // Delete article mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete article')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] })
      toast.success('Article removed')
    },
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) {
      toast.error('Title and Content are required')
      return
    }
    createMutation.mutate({ title, content, tags })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingArticle.title || !editingArticle.content) {
      toast.error('Title and Content are required')
      return
    }
    editMutation.mutate(editingArticle)
  }

  const openEdit = (art: any) => {
    setEditingArticle({ ...art })
  }

  return (
    <div className="space-y-8 py-8 max-w-5xl mx-auto px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-hairline pb-6">
        <div>
          <span className="text-xs font-semibold tracking-widest text-muted-custom uppercase">Business Wiki</span>
          <h1 className="text-3xl font-normal tracking-tight text-ink mt-1">Knowledge Articles</h1>
          <p className="text-sm text-body-text mt-1">Create business guidelines and references used by the AI co-pilot before web search.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger className="rounded-lg bg-primary text-primary-foreground hover:bg-primary-active h-10 px-4 gap-2 text-sm flex items-center justify-center font-medium cursor-pointer">
            <Plus className="h-4 w-4" /> Add Article
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-canvas">
            <DialogHeader>
              <DialogTitle className="text-xl font-normal tracking-tight text-ink">Add Knowledge Article</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-muted-custom">Article Title</label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. My bank coordinates & payment accounts"
                  className="border-hairline h-10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-muted-custom">Content (Detailed Markdown/Text)</label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write detailed guidelines..."
                  rows={6}
                  className="w-full text-sm p-3 bg-canvas border border-hairline rounded-md focus:outline-none focus:border-ink resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-muted-custom">Tags (Comma-separated)</label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. bank, ccp, payments"
                  className="border-hairline h-10"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-active text-primary-foreground font-medium rounded-lg h-10 text-sm"
                  disabled={createMutation.isPending}
                >
                  Save Article
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
          placeholder="Search articles..."
          className="pl-9 border-hairline h-10 bg-canvas"
        />
      </div>

      {/* Articles list */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ink mx-auto"></div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-custom border border-dashed border-hairline rounded-lg p-12 bg-canvas">
            No articles found. Add custom payment terms or business guidelines to assist the AI.
          </div>
        ) : (
          articles.map((art: any) => (
            <Card key={art.id} className="rounded-lg border border-hairline shadow-none bg-canvas">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-2.5 items-start">
                    <BookOpen className="h-5 w-5 text-signature-coral shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-ink text-base tracking-tight">{art.title}</h3>
                      {art.tags && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {art.tags.split(',').map((tag: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase px-2 py-0.5 rounded bg-surface-soft text-muted-custom border border-hairline">
                              <Tag className="h-2 w-2" /> {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(art)}
                      className="h-8 w-8 text-muted-custom hover:text-ink hover:bg-surface-soft"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(art.id)}
                      className="h-8 w-8 text-muted-custom hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-body-text whitespace-pre-line leading-relaxed pt-2 border-t border-hairline/60">
                  {art.content}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingArticle} onOpenChange={(open) => !open && setEditingArticle(null)}>
        <DialogContent className="sm:max-w-lg bg-canvas">
          <DialogHeader>
            <DialogTitle className="text-xl font-normal tracking-tight text-ink">Edit Article</DialogTitle>
          </DialogHeader>
          {editingArticle && (
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-muted-custom">Article Title</label>
                <Input
                  required
                  value={editingArticle.title}
                  onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                  className="border-hairline h-10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-muted-custom">Content</label>
                <textarea
                  required
                  value={editingArticle.content}
                  onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                  rows={6}
                  className="w-full text-sm p-3 bg-canvas border border-hairline rounded-md focus:outline-none focus:border-ink resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-muted-custom">Tags</label>
                <Input
                  value={editingArticle.tags || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, tags: e.target.value })}
                  className="border-hairline h-10"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-active text-primary-foreground font-medium rounded-lg h-10 text-sm"
                  disabled={editMutation.isPending}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
