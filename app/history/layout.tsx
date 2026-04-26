import { Navbar } from '@/components/navbar'

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
