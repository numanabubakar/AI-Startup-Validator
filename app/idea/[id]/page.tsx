import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { IdeaResultsClient } from '@/components/idea-results-client'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: idea } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!idea) notFound()

  if (idea.status === 'error') {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-destructive" />
          <h1 className="mb-2 text-2xl font-bold">Analysis failed</h1>
          <p className="mb-6 text-muted-foreground">Something went wrong with the AI analysis. Please try again.</p>
          <Button asChild><Link href="/dashboard">Try again</Link></Button>
        </div>
      </div>
    )
  }

  if (idea.status !== 'complete' || !idea.result) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <h1 className="mb-2 text-2xl font-bold">Analysis in progress</h1>
          <p className="text-muted-foreground">Your idea is being analyzed. Refresh in a moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Navbar />
      <IdeaResultsClient idea={idea} />
    </div>
  )
}
