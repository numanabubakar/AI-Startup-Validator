'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { User, Mail, MapPin, Briefcase, Save, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

const pakistanCities = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Hyderabad',
  'Gujranwala', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Abbottabad', 'Other',
]

const roles = [
  'Founder', 'Co-Founder', 'Student', 'Product Manager', 'Business Analyst',
  'Investor', 'Consultant', 'Developer', 'Other',
]

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    city: '',
    role: '',
    company: '',
  })
  const [stats, setStats] = useState({ total: 0, completed: 0, avgScore: 0 })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      setEmail(user.email ?? '')
      setForm({
        fullName: user.user_metadata?.full_name ?? '',
        city: user.user_metadata?.city ?? '',
        role: user.user_metadata?.role ?? '',
        company: user.user_metadata?.company ?? '',
      })

      // Load stats
      const { data: ideas } = await supabase
        .from('ideas')
        .select('status, result')
        .eq('user_id', user.id)

      if (ideas) {
        const completed = ideas.filter(i => i.status === 'complete' && i.result)
        const avgScore = completed.length
          ? Math.round(completed.reduce((s, i) => s + (i.result?.overallScore ?? 0), 0) / completed.length)
          : 0
        setStats({ total: ideas.length, completed: completed.length, avgScore })
      }

      setLoading(false)
    }
    load()
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: form.fullName,
        city: form.city,
        role: form.role,
        company: form.company,
      },
    })
    if (updateError) {
      setError(updateError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="h-6 w-6 text-primary" />
        </div>
      </div>
    )
  }

  const initials = form.fullName
    ? form.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Navbar />
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="mb-8 text-2xl font-bold text-foreground">Your Profile</h1>

        {/* Avatar + stats */}
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center gap-6 py-8 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xl font-bold text-foreground">{form.fullName || 'Unnamed founder'}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
              {form.city && (
                <div className="mt-1 flex items-center justify-center gap-1 sm:justify-start">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{form.city}, Pakistan</span>
                </div>
              )}
              {form.role && <Badge variant="secondary" className="mt-2">{form.role}</Badge>}
            </div>
            <div className="flex gap-4 sm:flex-col sm:items-end sm:gap-2">
              {[
                { label: 'Ideas', value: stats.total },
                { label: 'Completed', value: stats.completed },
                { label: 'Avg Score', value: stats.avgScore ? `${stats.avgScore}/100` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    <User className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
                    Full name
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Ahmed Khan"
                    value={form.fullName}
                    onChange={(e) => setForm(p => ({ ...p, fullName: e.target.value }))}
                    maxLength={80}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    <Mail className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
                    Email address
                  </Label>
                  <Input value={email} disabled className="text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Label>
                    <MapPin className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
                    City
                  </Label>
                  <Select onValueChange={(v) => setForm(p => ({ ...p, city: v }))} defaultValue={form.city}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent>
                      {pakistanCities.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    <Briefcase className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
                    Role
                  </Label>
                  <Select onValueChange={(v) => setForm(p => ({ ...p, role: v }))} defaultValue={form.role}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="company">
                    <Briefcase className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
                    Company / University
                  </Label>
                  <Input
                    id="company"
                    placeholder="e.g. LUMS, Arbisoft, Careem"
                    value={form.company}
                    onChange={(e) => setForm(p => ({ ...p, company: e.target.value }))}
                    maxLength={100}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={saving || saved} className="w-full sm:w-auto">
                {saving ? (
                  <><Spinner className="mr-2 h-4 w-4" /> Saving...</>
                ) : saved ? (
                  <><CheckCircle className="mr-2 h-4 w-4" /> Saved!</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Save changes</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
