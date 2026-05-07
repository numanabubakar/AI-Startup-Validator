'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Zap, LayoutDashboard, History, LogOut, Menu, X, User, BarChart2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/dashboard', label: 'Validate', icon: Zap },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/history', label: 'History', icon: History },
  { href: '/profile', label: 'Profile', icon: User },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md no-print">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-foreground">Startup Idea Generator</span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wide">PAKISTAN</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-0.5 sm:flex">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                  ? 'bg-secondary text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop sign out */}
        <div className="hidden sm:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-muted-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {signingOut ? 'Signing out...' : 'Sign out'}
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="sm:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-card px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-secondary text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
