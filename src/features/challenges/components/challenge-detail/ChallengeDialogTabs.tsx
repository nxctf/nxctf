'use client'

import { SegmentedTabs } from '@/shared/components'
import type { ChallengeDialogTab } from '../../types'

type ChallengeDialogTabsProps = {
  challengeId: string
  tabs: Array<{ key: ChallengeDialogTab; label: string }>
  activeTab: ChallengeDialogTab
  onTabChange: (tab: ChallengeDialogTab, challengeId?: string) => void
}

export default function ChallengeDialogTabs({
  challengeId,
  tabs,
  activeTab,
  onTabChange,
}: ChallengeDialogTabsProps) {
  return (
    <SegmentedTabs
      items={tabs.map((tab) => ({ value: tab.key, label: tab.label }))}
      value={activeTab}
      onChange={(tab) => onTabChange(tab, challengeId)}
      variant="panel"
      stretch
    />
  )
}
