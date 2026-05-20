'use client'

import { Clock3 } from 'lucide-react'
import { Button } from '@/shared/ui'

import type { ChallengeSortMode } from '../../types'

type SortToggleProps = {
  sortMode: ChallengeSortMode
  onToggle: () => void
}

export default function SortToggle({ sortMode, onToggle }: SortToggleProps) {
  const isDefaultSort = sortMode === 'default'

  return (
    <Button
      type="button"
      variant={isDefaultSort ? 'outline' : 'default'}
      size="icon-sm"
      data-tour="challenge-sort-toggle"
      onClick={onToggle}
      title={sortMode === 'default' ? 'Switch to newest first' : 'Switch to default sort'}
      aria-label="Toggle challenge sorting"
      className="rounded-xl"
    >
      <Clock3 size={16} className={isDefaultSort ? 'opacity-70' : undefined} />
    </Button>
  )
}
