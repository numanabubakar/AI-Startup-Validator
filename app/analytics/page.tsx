'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Brain, TrendingUp, Zap, Target, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

interface Idea {
  id: string
  title: string
  status: string
  region: string | null
  created_at: string
  result: {
    overallScore?: number
    marketResearch?: { score?: number }
    financials?: { score?: number }
    strategy?: { score?: number }
  } | null
}

const CITY_COLORS: Record<string, string> = {
  Karachi: '#01796F',
  Lahore: '#22c55e',
  Islamabad: '#3b82f6',
  Rawalpindi: '#8b5cf6',
  Faisalabad: '#f59e0b',
  Peshawar: '#ef4444',
  Quetta: '#06b6d4',
  Multan: '#ec4899',
}

export default function AnalyticsPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchIdeas = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('ideas')
      .select('id, title, status, region, created_at, result')
      .order('created_at', { ascending: true })
    setIdeas((data as Idea[]) ?? [])
    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  // Initial fetch + real-time subscription
  useEffect(() => {
    fetchIdeas()
    const supabase = createClient()
    const channel = supabase
      .channel('analytics-ideas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, () => {
        fetchIdeas()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchIdeas])

  const completed = ideas.filter((i) => i.status === 'complete' && i.result)

  // Scores over time
  const scoreOverTime = completed.map((i) => ({
    date: format(new Date(i.created_at), 'MMM d'),
    overall: i.result?.overallScore ?? 0,
    market: i.result?.marketResearch?.score ?? 0,
    financial: i.result?.financials?.score ?? 0,
    strategy: i.result?.strategy?.score ?? 0,
  }))

  // Ideas per city
  const cityCount: Record<string, number> = {}
  ideas.forEach((i) => {
    const city = i.region ?? 'Unknown'
    cityCount[city] = (cityCount[city] ?? 0) + 1
  })
  const cityData = Object.entries(cityCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([city, count]) => ({ city, count, fill: CITY_COLORS[city] ?? '#6b7280' }))

  // Average scores radar
  const avgScore = (key: (i: Idea) => number | undefined) =>
    completed.length
      ? Math.round(completed.reduce((s, i) => s + (key(i) ?? 0), 0) / completed.length)
      : 0

  const radarData = [
    { subject: 'Overall', value: avgScore((i) => i.result?.overallScore) },
    { subject: 'Market', value: avgScore((i) => i.result?.marketResearch?.score) },
    { subject: 'Financial', value: avgScore((i) => i.result?.financials?.score) },
    { subject: 'Strategy', value: avgScore((i) => i.result?.strategy?.score) },
  ]

  // Score distribution buckets
  const distData = [
    { range: '0–24', count: completed.filter((i) => (i.result?.overallScore ?? 0) < 25).length },
    { range: '25–49', count: completed.filter((i) => { const s = i.result?.overallScore ?? 0; return s >= 25 && s < 50 }).length },
    { range: '50–74', count: completed.filter((i) => { const s = i.result?.overallScore ?? 0; return s >= 50 && s < 75 }).length },
    { range: '75–100', count: completed.filter((i) => (i.result?.overallScore ?? 0) >= 75).length },
  ]

  const avgOverall = avgScore((i) => i.result?.overallScore)

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time insights across all your Pakistan startup validations
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Live &bull; Updated {format(lastUpdated, 'HH:mm:ss')}
          </div>
        </div>

        {/* Stat cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Ideas', value: ideas.length, icon: Zap, sub: `${ideas.filter(i => i.status === 'complete').length} completed` },
            { label: 'Avg. Overall Score', value: completed.length ? `${avgOverall}/100` : '—', icon: Brain, sub: completed.length ? 'across all validations' : 'no data yet' },
            { label: 'Top Scoring', value: completed.length ? `${Math.max(...completed.map(i => i.result?.overallScore ?? 0))}/100` : '—', icon: TrendingUp, sub: 'highest idea score' },
            { label: 'Cities Covered', value: Object.keys(cityCount).length, icon: Target, sub: 'unique Pakistani cities' },
          ].map(({ label, value, icon: Icon, sub }) => (
            <Card key={label}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-1.5 text-2xl font-bold text-foreground">{loading ? '—' : value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Score trends over time */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <CardTitle className="text-base">Score Trends Over Time</CardTitle>
              <Badge variant="secondary" className="ml-auto text-xs">Live</Badge>
            </CardHeader>
            <CardContent>
              {scoreOverTime.length < 2 ? (
                <p className="text-center text-sm text-muted-foreground py-12">Submit at least 2 ideas to see trends.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={scoreOverTime} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      {['overall', 'market', 'financial', 'strategy'].map((key, i) => {
                        const colors = ['#01796F', '#3b82f6', '#f59e0b', '#8b5cf6']
                        return (
                          <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={colors[i]} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={colors[i]} stopOpacity={0} />
                          </linearGradient>
                        )
                      })}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                    <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }} />
                    {(['overall', 'market', 'financial', 'strategy'] as const).map((key, i) => {
                      const colors = ['#01796F', '#3b82f6', '#f59e0b', '#8b5cf6']
                      return (
                        <Area key={key} type="monotone" dataKey={key} stroke={colors[i]} fill={`url(#grad-${key})`} strokeWidth={2} dot={false} />
                      )
                    })}
                  </AreaChart>
                </ResponsiveContainer>
              )}
              <div className="mt-3 flex flex-wrap gap-3">
                {[['Overall', '#01796F'], ['Market', '#3b82f6'], ['Financial', '#f59e0b'], ['Strategy', '#8b5cf6']].map(([label, color]) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                    {label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ideas by city */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ideas by Pakistani City</CardTitle>
            </CardHeader>
            <CardContent>
              {cityData.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={cityData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                    <YAxis type="category" dataKey="city" width={80} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                    <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {cityData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Score distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {completed.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No completed validations yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={distData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                    <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {distData.map((_, i) => {
                        const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#01796F']
                        return <Cell key={i} fill={colors[i]} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Radar chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Average Scores by Dimension</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {completed.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No completed validations yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
                    <PolarGrid stroke="var(--color-border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <Radar name="Avg Score" dataKey="value" stroke="#01796F" fill="#01796F" fillOpacity={0.25} strokeWidth={2} />
                    <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
