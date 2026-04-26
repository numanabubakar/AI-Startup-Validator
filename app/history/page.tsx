'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Empty } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import {
  Zap, ChevronRight, Clock, CheckCircle, AlertTriangle,
  Loader, MapPin, RefreshCw, ExternalLink, Trash2,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { ScoreRing } from '@/components/score-ring'
import { useRouter } from 'next/navigation'

interface Idea {
  id: string
  title: string
  description: string
  region: string | null
  target_audience: string | null
  budget: string | null
  status: string
  result: { overallScore?: number; verdict?: string; summary?: string } | null
  created_at: string
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'complete':
      return <Badge className="gap-1 bg-chart-1/10 text-chart-1 border-chart-1/20"><CheckCircle className="h-3 w-3" />Complete</Badge>
    case 'processing':
      return <Badge className="gap-1 bg-secondary text-muted-foreground"><Loader className="h-3 w-3 animate-spin" />Processing</Badge>
    case 'error':
      return <Badge className="gap-1 bg-destructive/10 text-destructive border-destructive/20"><AlertTriangle className="h-3 w-3" />Failed</Badge>
    default:
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>
  }
}

function ScorePill({ score }: { score: number }) {
  const color = score >= 75 ? 'bg-chart-1/10 text-chart-1' : score >= 50 ? 'bg-chart-4/10 text-chart-4' : 'bg-chart-5/10 text-chart-5'
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>{score}/100</span>
}

export default function HistoryPage() {
  const router = useRouter()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Idea | null>(null)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchIdeas = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('ideas')
      .select('id, title, description, region, target_audience, budget, status, result, created_at')
      .order('created_at', { ascending: false })
    setIdeas((data as Idea[]) ?? [])
    setLoading(false)
  }, [])

  // Initial load + real-time subscription
  useEffect(() => {
    fetchIdeas()
    const supabase = createClient()
    const channel = supabase
      .channel('history-ideas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, () => { fetchIdeas() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchIdeas])

  const handleRegenerate = useCallback(async (idea: Idea) => {
    setRegeneratingId(idea.id)
    const supabase = createClient()
    await supabase.from('ideas').update({ status: 'processing', result: null }).eq('id', idea.id)

    await fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ideaId: idea.id,
        title: idea.title,
        description: idea.description,
        targetAudience: idea.target_audience,
        budget: idea.budget,
        region: idea.region,
      }),
    })
    setRegeneratingId(null)
    setSelected(null)
    router.push(`/idea/${idea.id}`)
  }, [router])

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from('ideas').delete().eq('id', id)
    setIdeas(prev => prev.filter(i => i.id !== id))
    setSelected(null)
    setDeletingId(null)
  }, [])

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Navbar />
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Idea History</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading ? 'Loading...' : `${ideas.length} idea${ideas.length !== 1 ? 's' : ''} validated`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
            <Button asChild className="ml-2">
              <Link href="/dashboard"><Zap className="mr-2 h-4 w-4" />New idea</Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner className="h-6 w-6 text-primary" /></div>
        ) : ideas.length === 0 ? (
          <Empty>
            <Empty.Icon><Zap className="h-8 w-8 text-muted-foreground" /></Empty.Icon>
            <Empty.Title>No ideas yet</Empty.Title>
            <Empty.Description>Submit your first startup idea to get an AI-powered validation report.</Empty.Description>
            <Empty.Action asChild><Link href="/dashboard">Validate your first idea</Link></Empty.Action>
          </Empty>
        ) : (
          <div className="space-y-3">
            {ideas.map((idea) => {
              const score = idea.result?.overallScore ?? null
              const isComplete = idea.status === 'complete'
              const relativeTime = formatDistanceToNow(new Date(idea.created_at), { addSuffix: true })

              return (
                <div
                  key={idea.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30 cursor-pointer"
                  onClick={() => setSelected(idea)}
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground truncate">{idea.title}</p>
                      <StatusBadge status={idea.status} />
                      {score !== null && <ScorePill score={score} />}
                    </div>
                    {idea.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{idea.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{relativeTime}</span>
                      {idea.region && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{idea.region}
                        </span>
                      )}
                    </div>
                  </div>
                  {isComplete && <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl pr-8">{selected.title}</DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2 pt-1">
                  <StatusBadge status={selected.status} />
                  {selected.result?.overallScore != null && <ScorePill score={selected.result.overallScore} />}
                  {selected.region && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{selected.region}, Pakistan
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                {/* Score rings */}
                {selected.status === 'complete' && selected.result && (
                  <div className="flex flex-wrap justify-center gap-6 py-4 rounded-xl border border-border bg-muted/30">
                    <ScoreRing score={selected.result.overallScore ?? 0} label="Overall" size={100} />
                  </div>
                )}

                {/* Key info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Submitted', value: format(new Date(selected.created_at), 'dd MMM yyyy, HH:mm') },
                    { label: 'Status', value: selected.status },
                    { label: 'Budget', value: selected.budget ?? '—' },
                    { label: 'Audience', value: selected.target_audience ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className="mt-0.5 text-foreground font-medium">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Description</p>
                  <p className="text-sm text-foreground leading-relaxed">{selected.description}</p>
                </div>

                {/* Verdict & Summary */}
                {selected.result?.verdict && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">Verdict</p>
                    <p className="text-sm font-medium text-foreground">{selected.result.verdict}</p>
                  </div>
                )}
                {selected.result?.summary && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Executive Summary</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selected.result.summary}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  {selected.status === 'complete' && (
                    <Button size="sm" asChild>
                      <Link href={`/idea/${selected.id}`}>
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Full report
                      </Link>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRegenerate(selected)}
                    disabled={regeneratingId === selected.id}
                  >
                    {regeneratingId === selected.id
                      ? <Spinner className="mr-1.5 h-3.5 w-3.5" />
                      : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
                    Regenerate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto text-destructive hover:bg-destructive/10 border-destructive/30"
                    onClick={() => handleDelete(selected.id)}
                    disabled={deletingId === selected.id}
                  >
                    {deletingId === selected.id
                      ? <Spinner className="mr-1.5 h-3.5 w-3.5" />
                      : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
