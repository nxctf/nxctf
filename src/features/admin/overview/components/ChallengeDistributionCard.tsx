import { useMemo, useState } from 'react'
import { BarChart3, FolderOpen } from 'lucide-react'
import { AdminPanel } from '@/features/admin/ui'
import { AppTabs } from '@/shared/ui'
import type { Challenge } from '@/shared/types'

type DistributionTab = 'difficulty' | 'category'

type DistributionItem = {
  label: string
  count: number
}

type ChallengeDistributionCardProps = {
  challenges: Challenge[]
}

const DIFFICULTY_ORDER = ['easy', 'medium', 'hard', 'insane']

function normalizeLabel(value: string | null | undefined, fallback: string) {
  const trimmedValue = value?.trim()
  return trimmedValue || fallback
}

function buildDistribution(challenges: Challenge[], field: 'difficulty' | 'category') {
  const counts = new Map<string, number>()

  challenges.forEach((challenge) => {
    const label = normalizeLabel(challenge[field], field === 'difficulty' ? 'Unrated' : 'Uncategorized')
    counts.set(label, (counts.get(label) ?? 0) + 1)
  })

  const items = Array.from(counts.entries()).map(([label, count]) => ({ label, count }))

  if (field === 'difficulty') {
    return items.sort((a, b) => {
      const aOrder = DIFFICULTY_ORDER.indexOf(a.label.toLowerCase())
      const bOrder = DIFFICULTY_ORDER.indexOf(b.label.toLowerCase())
      if (aOrder !== -1 || bOrder !== -1) {
        return (aOrder === -1 ? Number.MAX_SAFE_INTEGER : aOrder) - (bOrder === -1 ? Number.MAX_SAFE_INTEGER : bOrder)
      }
      return a.label.localeCompare(b.label)
    })
  }

  return items.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

function DistributionRows({ items, total }: { items: DistributionItem[]; total: number }) {
  if (items.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center text-sm font-medium text-muted-foreground">
        No challenges available.
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200/70 overflow-hidden rounded-xl border border-gray-200/80 dark:divide-gray-800 dark:border-gray-800">
      {items.map((item) => {
        const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0

        return (
          <div key={item.label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <span className="min-w-0 truncate font-semibold text-gray-800 dark:text-gray-100">
              {item.label}
            </span>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {percentage}%
              </span>
              <span className="min-w-8 rounded-lg bg-blue-500/10 px-2 py-1 text-center text-xs font-bold text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                {item.count}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ChallengeDistributionCard({ challenges }: ChallengeDistributionCardProps) {
  const [activeTab, setActiveTab] = useState<DistributionTab>('difficulty')

  const difficultyItems = useMemo(() => buildDistribution(challenges, 'difficulty'), [challenges])
  const categoryItems = useMemo(() => buildDistribution(challenges, 'category'), [challenges])

  const items = activeTab === 'difficulty' ? difficultyItems : categoryItems

  return (
    <AdminPanel
      title="Challenge Distribution"
      icon={activeTab === 'difficulty' ? BarChart3 : FolderOpen}
      headerClassName="!px-4 !py-3"
      contentClassName="space-y-4 p-4"
      action={
        <AppTabs
          value={activeTab}
          onValueChange={setActiveTab}
          variant="compact"
          size="sm"
          ariaLabel="Challenge distribution view"
          items={[
            { value: 'difficulty', label: 'Difficulty', icon: BarChart3 },
            { value: 'category', label: 'Categories', icon: FolderOpen },
          ]}
        />
      }
    >
      <DistributionRows items={items} total={challenges.length} />
    </AdminPanel>
  )
}
