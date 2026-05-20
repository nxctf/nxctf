'use client'

import { LayoutGrid, List, ListTree } from 'lucide-react'
import { Button } from '@/shared/ui'

import { useFilterContext } from '../../contexts/FilterContext'
import {
  CHALLENGE_LAYOUT_MODES,
  getNextChallengeLayoutMode,
} from '../../lib'

export default function LayoutToggle() {
  const { layoutMode, setLayoutMode } = useFilterContext()
  const isDefaultLayout = layoutMode === CHALLENGE_LAYOUT_MODES.GROUPED
  const nextLayoutMode = getNextChallengeLayoutMode(layoutMode)
  const title = layoutMode === CHALLENGE_LAYOUT_MODES.GROUPED
    ? 'Switch to category compact view'
    : layoutMode === CHALLENGE_LAYOUT_MODES.CATEGORY_COMPACT
      ? 'Switch to compact view'
      : 'Switch to grouped view'

  return (
    <Button
      type="button"
      variant={isDefaultLayout ? 'outline' : 'default'}
      size="icon-sm"
      data-tour="challenge-layout-toggle"
      onClick={() => setLayoutMode(nextLayoutMode)}
      title={title}
      aria-label={title}
      className="rounded-xl"
    >
      {layoutMode === CHALLENGE_LAYOUT_MODES.COMPACT
        ? <LayoutGrid size={16} />
        : layoutMode === CHALLENGE_LAYOUT_MODES.CATEGORY_COMPACT
          ? <ListTree size={16} />
          : <List size={16} />}
    </Button>
  )
}
