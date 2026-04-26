'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Zap } from 'lucide-react'

const budgetOptions = [
  'Bootstrapped (< PKR 500k)',
  'Pre-seed (PKR 500k – 5M)',
  'Seed (PKR 5M – 50M)',
  'Series A (PKR 50M+)',
]

const pakistanCities = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
  'Bahawalpur',
  'Sargodha',
  'Sukkur',
  'Larkana',
  'Abbottabad',
  'Mardan',
  'Mingora',
  'All Pakistan',
]

const sectors = [
  'Fintech / Payments',
  'E-commerce / Retail',
  'Agritech',
  'EdTech',
  'HealthTech',
  'Logistics / Delivery',
  'Real Estate / Proptech',
  'SaaS / B2B Software',
  'Media / Entertainment',
  'Freelance / Gig Economy',
  'Clean Energy',
  'Telecom / Internet',
  'Other',
]

export function IdeaForm({ prefill }: { prefill?: { title?: string; description?: string; targetAudience?: string; budget?: string; region?: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: prefill?.title ?? '',
    description: prefill?.description ?? '',
    targetAudience: prefill?.targetAudience ?? '',
    budget: prefill?.budget ?? '',
    region: prefill?.region ?? '',
    sector: '',
  })

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in to submit an idea.')
      setLoading(false)
      return
    }

    const { data: idea, error: insertError } = await supabase
      .from('ideas')
      .insert({
        user_id: user.id,
        title: form.title,
        description: form.description,
        target_audience: form.targetAudience,
        budget: form.budget,
        region: form.region || 'Pakistan',
        status: 'pending',
      })
      .select()
      .single()

    if (insertError || !idea) {
      setError('Failed to save your idea. Please try again.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ideaId: idea.id,
        title: form.title,
        description: form.description,
        targetAudience: form.targetAudience,
        budget: form.budget,
        region: form.region || 'Pakistan',
        sector: form.sector,
      }),
    })

    if (!res.ok) {
      setError('AI analysis failed. Your idea was saved — try again from History.')
      setLoading(false)
      return
    }

    router.push(`/idea/${idea.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Idea title *</Label>
        <Input
          id="title"
          placeholder="e.g. AI-powered bill payment app for Karachi shopkeepers"
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          required
          maxLength={120}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Describe your idea *</Label>
        <Textarea
          id="description"
          placeholder="What problem does it solve? Who is it for? How does it work? What makes it different from existing Pakistani solutions?"
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          required
          rows={5}
          maxLength={2000}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">
          {form.description.length}/2000
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="targetAudience">Target audience</Label>
          <Input
            id="targetAudience"
            placeholder="e.g. Karachi kirana store owners"
            value={form.targetAudience}
            onChange={(e) => handleChange('targetAudience', e.target.value)}
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label>Sector</Label>
          <Select onValueChange={(v) => handleChange('sector', v)} defaultValue={form.sector}>
            <SelectTrigger>
              <SelectValue placeholder="Select sector" />
            </SelectTrigger>
            <SelectContent>
              {sectors.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Budget / stage</Label>
          <Select onValueChange={(v) => handleChange('budget', v)} defaultValue={form.budget}>
            <SelectTrigger>
              <SelectValue placeholder="Select budget range" />
            </SelectTrigger>
            <SelectContent>
              {budgetOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Target city / region</Label>
          <Select onValueChange={(v) => handleChange('region', v)} defaultValue={form.region}>
            <SelectTrigger>
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {pakistanCities.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Analyzing for Pakistan market...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4" />
            Validate my idea
          </>
        )}
      </Button>

      {loading && (
        <p className="text-center text-xs text-muted-foreground">
          Researching Pakistani market conditions, competitors, and financial projections. This takes about 30-60 seconds.
        </p>
      )}
    </form>
  )
}
