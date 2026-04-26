import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IdeaForm } from '@/components/idea-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch recent ideas count
  const { count } = await supabase
    .from('ideas')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Validate a new idea</h1>
        <p className="text-muted-foreground">
          Describe your startup idea below and get a full AI analysis in under 60 seconds.
        </p>
      </div>

      {count !== null && count > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-secondary-foreground">
          <Zap className="h-4 w-4 text-primary shrink-0" />
          <span>
            You&apos;ve validated <strong>{count}</strong> idea{count !== 1 ? 's' : ''} so far.
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>New idea submission</CardTitle>
          <CardDescription>
            The more detail you provide, the more accurate your analysis will be.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IdeaForm />
        </CardContent>
      </Card>
    </div>
  )
}
