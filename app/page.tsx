import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Zap, ArrowRight, Brain, TrendingUp, Target, MessageSquare } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI Market Research',
    description: 'Deep analysis of your target market, competitors, and demand signals powered by GPT-4.',
  },
  {
    icon: TrendingUp,
    title: 'Financial Projections',
    description: 'Realistic MRR estimates, CAC/LTV ratios, and break-even timelines based on your inputs.',
  },
  {
    icon: Target,
    title: 'GTM Strategy',
    description: 'Your first 90-day go-to-market plan and MVP feature list — ready to execute.',
  },
  {
    icon: MessageSquare,
    title: 'Co-Founder Take',
    description: 'An honest, candid perspective on what excites us and what to validate first.',
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">IdeaForge</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/sign-up">Get started free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-sm text-secondary-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" />
            AI-Powered Startup Validation
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Validate your startup idea{' '}
            <span className="text-primary">in minutes</span>
          </h1>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Get a co-founder-level analysis of your startup idea — market research, financial
            projections, competitive landscape, and a go-to-market strategy — all powered by AI.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/auth/sign-up">
                Start validating for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-balance text-3xl font-bold text-foreground">
              Everything you need to decide faster
            </h2>
            <p className="mt-3 text-muted-foreground">
              Stop spending weeks on research. Get a complete analysis in under 2 minutes.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} IdeaForge. Built with AI.</p>
      </footer>
    </main>
  )
}
