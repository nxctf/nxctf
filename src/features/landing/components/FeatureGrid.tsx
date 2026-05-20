import type { LucideIcon } from 'lucide-react'
import {
  CalendarDays, ListChecks, Server, Shield, Terminal, Trophy, Users, Zap,
} from 'lucide-react'
import { Separator } from '@/shared/ui/separator'

const FEATURES: Array<{ icon: LucideIcon; title: string; description: string }> = [
  { icon: Trophy, title: 'Real-time Scoreboard', description: 'Live ranking with dynamic scoring.' },
  { icon: Users, title: 'Team Collaboration', description: 'Shared progress and coordinated solves.' },
  { icon: Zap, title: 'Dynamic Challenges', description: 'Fast workflows for admins and players.' },
  { icon: ListChecks, title: 'Multi-Task Challenges', description: 'Structured sub-task challenge support.' },
  { icon: Server, title: 'NXCTL Instance', description: 'On-demand challenge infrastructure.' },
  { icon: CalendarDays, title: 'Multi-Event', description: 'Run multiple CTF events cleanly.' },
  { icon: Terminal, title: 'Flag Placeholders', description: 'Configurable flag formats.' },
  { icon: Shield, title: 'Secure Platform', description: 'Role-based access and safer auth.' },
]

export function FeatureGrid() {
  return (
    <section className="flex flex-col gap-8">
      <Separator />

      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight">Platform Features</h2>
        <p className="text-sm text-muted-foreground">
          Everything you need to run a successful CTF competition.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 xl:grid-cols-4 rounded-xl overflow-hidden border">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex flex-col gap-3 bg-card p-5 transition-colors hover:bg-muted/40"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-background">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
