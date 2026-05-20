import { Separator } from '@/shared/ui/separator'

const STATS = [
  { value: '12+', label: 'Challenge categories' },
  { value: 'Static & Dynamic', label: 'Scoring modes' },
  { value: 'Multi-event', label: 'Event support' },
  { value: 'Built-in', label: 'Team collaboration' },
] as const

export function PlatformStats() {
  return (
    <section className="py-12">
      <Separator className="mb-12" />
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
        {STATS.map(({ value, label }) => (
          <div key={label} className="flex flex-col gap-1">
            <p className="text-lg font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
