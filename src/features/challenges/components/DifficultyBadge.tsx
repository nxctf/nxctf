import APP from '@/config'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib/utils'

interface DifficultyBadgeProps {
  difficulty?: string | null
  className?: string
}

const colorMap: Record<string, string> = {
  cyan: 'bg-cyan-600 text-white dark:bg-cyan-600',
  green: 'bg-green-600 text-white dark:bg-green-600',
  yellow: 'bg-yellow-500 text-white dark:bg-yellow-600',
  red: 'bg-red-600 text-white dark:bg-red-600',
  purple: 'bg-purple-600 text-white dark:bg-purple-600',
}

export default function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const raw = (difficulty || '').toString().trim()
  const normalized = raw === 'imposible' ? 'Impossible' : raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
  const styles = (APP as any).difficultyStyles || {}
  const colorName = styles[normalized]
  const colorClass = colorMap[colorName] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white'

  return (
    <Badge className={cn('min-w-15.5 justify-center', colorClass, className)}>
      {difficulty || 'N/A'}
    </Badge>
  )
}
