import { BarChart3, Calendar, Flag, ShieldCheck } from 'lucide-react'
import { DashboardShell } from '@/features/dashboard/components/DashboardShell'
import { RouteCard } from '@/features/dashboard/components/RouteCard'
import { StatCard } from '@/features/dashboard/components/StatCard'

const stats = [
  { title: 'Challenges', value: '—', description: 'Active in catalog', icon: Flag },
  { title: 'Events', value: '—', description: 'Running competitions', icon: Calendar },
  { title: 'Solvers', value: '—', description: 'Total solve records', icon: BarChart3 },
  { title: 'Admins', value: '—', description: 'Global + event roles', icon: ShieldCheck },
] as const

const modules = [
  {
    title: 'Challenges',
    description: 'Manage challenge catalog, scoring, and flags.',
    href: '/admin/challenges',
    icon: <Flag className="h-4 w-4" />,
  },
  {
    title: 'Events',
    description: 'Organize events, members, and joins.',
    href: '/admin/event',
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    title: 'Solvers',
    description: 'Inspect and moderate solve records.',
    href: '/admin/solvers',
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    title: 'Admins',
    description: 'Manage global and event administrators.',
    href: '/admin/admins',
    icon: <ShieldCheck className="h-4 w-4" />,
  },
] as const

export default function AdminDashboardPage() {
  return (
    <DashboardShell title="Overview" subtitle="Admin workspace.">
      <div className="flex flex-col gap-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.title} {...s} />
          ))}
        </div>

        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Modules
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {modules.map((mod) => (
              <RouteCard key={mod.href} {...mod} />
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
