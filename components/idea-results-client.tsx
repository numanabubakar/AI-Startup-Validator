'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScoreRing } from '@/components/score-ring'
import { PakistanMap } from '@/components/pakistan-map'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Brain, TrendingUp, Target, MessageSquare, AlertTriangle,
  CheckCircle, ArrowLeft, Users, DollarSign, Clock,
  Download, RefreshCw, MapPin, Printer,
} from 'lucide-react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'

interface Competitor { name: string | null; description: string | null; weakness: string | null }
interface Risk { risk: string | null; mitigation: string | null }
interface IdeaResult {
  overallScore: number | null; verdict: string | null; summary: string | null
  marketResearch: { marketSize: string | null; growthRate: string | null; competitors: Competitor[] | null; targetSegment: string | null; demandSignals: string | null; score: number | null }
  financials: { revenueModel: string | null; estimatedMRR: string | null; customerAcquisitionCost: string | null; lifetimeValue: string | null; breakEvenTimeline: string | null; fundingRequired: string | null; score: number | null }
  strategy: { mvpFeatures: (string | null)[] | null; gtmStrategy: string | null; moat: string | null; keyRisks: Risk[] | null; score: number | null }
  coFounderTake: string | null
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null
  if (score >= 75) return <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">Strong</Badge>
  if (score >= 50) return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">Moderate</Badge>
  return <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">Weak</Badge>
}

interface IdeaResultsClientProps {
  idea: {
    id: string; title: string; description: string; region: string | null
    target_audience: string | null; budget: string | null
    status: string; result: IdeaResult; created_at: string
  }
}

export function IdeaResultsClient({ idea }: IdeaResultsClientProps) {
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [html2pdfLib, setHtml2pdfLib] = useState<any>(null)

  const result = idea.result
  const overall = result.overallScore ?? 0

  // Pre-load pdf library to avoid "untrusted click" issues in async imports
  useEffect(() => {
    import('html2pdf.js').then((mod) => {
      setHtml2pdfLib(() => mod.default)
    }).catch(err => console.error('Failed to load html2pdf lib:', err))
  }, [])

  // Bar chart data for scores
  const scoreBarData = [
    { name: 'Overall', score: overall, fill: '#01796F' },
    { name: 'Market', score: result.marketResearch?.score ?? 0, fill: '#3b82f6' },
    { name: 'Financials', score: result.financials?.score ?? 0, fill: '#f59e0b' },
    { name: 'Strategy', score: result.strategy?.score ?? 0, fill: '#8b5cf6' },
  ]

  // Radar data
  const radarData = [
    { subject: 'Market', value: result.marketResearch?.score ?? 0 },
    { subject: 'Financial', value: result.financials?.score ?? 0 },
    { subject: 'Strategy', value: result.strategy?.score ?? 0 },
    { subject: 'Overall', value: overall },
  ]

  // City scores for map
  const regionCity = idea.region ?? ''
  const marketScore = result.marketResearch?.score ?? 0
  const cityScores: Record<string, number> = {
    Karachi: Math.min(100, marketScore + 5),
    Lahore: Math.min(100, marketScore + 2),
    Islamabad: Math.min(100, marketScore - 2),
    Faisalabad: Math.min(100, marketScore - 5),
    Peshawar: Math.min(100, marketScore - 8),
    Multan: Math.min(100, marketScore - 6),
  }
  if (regionCity && cityScores[regionCity] === undefined) {
    cityScores[regionCity] = marketScore
  }

  const handleDownloadPdf = useCallback(async () => {
    if (downloadingPdf) return
    
    // Fallback if lib failed to pre-load
    let h2p = html2pdfLib
    if (!h2p) {
      setDownloadingPdf(true)
      try {
        const mod = await import('html2pdf.js')
        h2p = mod.default
      } catch (err) {
        setDownloadingPdf(false)
        alert('Could not initialize PDF library. Using print dialog instead.')
        window.print()
        return
      }
    }

    setDownloadingPdf(true)
    
    try {
      const element = printRef.current
      if (!element) throw new Error('Print element not found')

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${idea.title.replace(/\s+/g, '-').toLowerCase()}-validation-report.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 1.5, // Slightly lower scale to reduce memory/crashes
          useCORS: true, 
          letterRendering: true,
          backgroundColor: '#ffffff',
          logging: false,
          onclone: (clonedDoc: Document) => {
            // Ensure charts are rendered in the clone
            const containers = clonedDoc.querySelectorAll('.recharts-responsive-container')
            containers.forEach((container) => {
              const el = container as HTMLElement
              el.style.width = '600px'
              el.style.height = '300px'
              el.style.display = 'block'
            })
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }

      // Slightly longer wait for heavy components
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      await h2p().set(opt).from(element).save()
    } catch (err: any) {
      console.error('PDF generation error:', err)
      // Some browsers block programmatic downloads. Fallback to print which is native and unrestricted.
      if (confirm('The direct download was blocked by your browser\'s security or memory limits. Would you like to use the system print dialog to save as PDF?')) {
        window.print()
      }
    } finally {
      setDownloadingPdf(false)
    }
  }, [idea.title, downloadingPdf, html2pdfLib])

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true)
    const supabase = createClient()
    await supabase.from('ideas').update({ status: 'pending', result: null }).eq('id', idea.id)

    const res = await fetch('/api/validate', {
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

    if (res.ok) router.refresh()
    setRegenerating(false)
  }, [idea, router])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Back + actions */}
      <div className="mb-6 flex items-center justify-between gap-4 no-print">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link href="/history">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            History
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating}>
            {regenerating ? <Spinner className="mr-1.5 h-3.5 w-3.5" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
            Regenerate
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print
          </Button>
          <Button size="sm" onClick={handleDownloadPdf} disabled={downloadingPdf}>
            {downloadingPdf ? <Spinner className="mr-1.5 h-3.5 w-3.5" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
            Download PDF
          </Button>
        </div>
      </div>

      {/* Printable content */}
      <div ref={printRef} className="print:p-8">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="flex flex-wrap items-start gap-3">
            <h1 className="text-balance text-2xl font-bold text-foreground sm:text-3xl">{idea.title}</h1>
            <Badge variant={overall >= 65 ? 'default' : 'secondary'} className="shrink-0 mt-1">
              {overall >= 75 ? 'High potential' : overall >= 50 ? 'Worth exploring' : 'Needs work'}
            </Badge>
          </div>
          {idea.region && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {idea.region}, Pakistan
            </div>
          )}
          {result.verdict && (
            <p className="text-pretty text-base text-muted-foreground">{result.verdict}</p>
          )}
        </div>

        {/* Score rings */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="py-8">
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              <ScoreRing score={overall} label="Overall" size={130} />
              {result.marketResearch?.score != null && <ScoreRing score={result.marketResearch.score} label="Market" size={110} />}
              {result.financials?.score != null && <ScoreRing score={result.financials.score} label="Financials" size={110} />}
              {result.strategy?.score != null && <ScoreRing score={result.strategy.score} label="Strategy" size={110} />}
            </div>
          </CardContent>
        </Card>

        {/* Charts row */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          {/* Bar chart */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Score Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreBarData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: 12 }} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {scoreBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Radar */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Dimension Radar</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Radar dataKey="value" stroke="#01796F" fill="#01796F" fillOpacity={0.25} strokeWidth={2} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pakistan Map */}
        <div className="mb-6 break-inside-avoid">
          <PakistanMap
            highlightCity={regionCity}
            cityScores={cityScores}
            title={`Market Opportunity Map \u2014 ${regionCity || 'Pakistan'}`}
          />
        </div>

        {/* Summary */}
        {result.summary && (
          <Card className="mb-6 break-inside-avoid">
            <CardHeader><CardTitle className="text-base">Executive Summary</CardTitle></CardHeader>
            <CardContent>
              <p className="text-pretty leading-relaxed text-muted-foreground">{result.summary}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Market Research */}
          <Card className="break-inside-avoid">
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Market Research</CardTitle>
              <div className="ml-auto"><ScoreBadge score={result.marketResearch?.score ?? null} /></div>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.marketResearch?.marketSize && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Market Size (TAM)</p>
                  <p className="mt-1 text-sm text-foreground">{result.marketResearch.marketSize}</p>
                </div>
              )}
              {result.marketResearch?.growthRate && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Growth Rate</p>
                  <p className="mt-1 text-sm text-foreground">{result.marketResearch.growthRate}</p>
                </div>
              )}
              {result.marketResearch?.targetSegment && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Target Segment</p>
                  <p className="mt-1 text-sm text-foreground">{result.marketResearch.targetSegment}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financials */}
          <Card className="break-inside-avoid">
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Financial Projections</CardTitle>
              <div className="ml-auto"><ScoreBadge score={result.financials?.score ?? null} /></div>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.financials?.revenueModel && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue Model</p>
                  <p className="mt-1 text-sm text-foreground">{result.financials.revenueModel}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {result.financials?.estimatedMRR && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><DollarSign className="h-3.5 w-3.5" />MRR</div>
                    <p className="mt-1 font-semibold text-foreground text-sm">{result.financials.estimatedMRR}</p>
                  </div>
                )}
                {result.financials?.breakEvenTimeline && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Clock className="h-3.5 w-3.5" />Break-even</div>
                    <p className="mt-1 font-semibold text-foreground text-sm">{result.financials.breakEvenTimeline}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Strategy */}
          <Card className="break-inside-avoid">
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">GTM Strategy</CardTitle>
              <div className="ml-auto"><ScoreBadge score={result.strategy?.score ?? null} /></div>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.strategy?.mvpFeatures && result.strategy.mvpFeatures.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">MVP Features</p>
                  <ul className="space-y-1.5">
                    {result.strategy.mvpFeatures.map((f, i) => f && (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-chart-1" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Co-founder take */}
          {result.coFounderTake && (
            <Card className="border-primary/20 bg-primary/5 break-inside-avoid">
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle className="text-base text-primary">Co-Founder Take</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-pretty leading-relaxed text-foreground">{result.coFounderTake}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center no-print">
        <Button asChild><Link href="/dashboard">Validate another idea</Link></Button>
        <Button variant="outline" asChild><Link href="/history">View all ideas</Link></Button>
      </div>
    </div>
  )
}
