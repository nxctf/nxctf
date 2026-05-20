'use client'

import React from 'react'
import { ChartColumnDecreasing, Flag } from 'lucide-react'
import { UserTabs } from '../ui'
import BackButton from '@/shared/components/BackButton'

type ProfileTabsProps = {
  activeTab: 'profile' | 'stats'
  setActiveTab: (tab: 'profile' | 'stats') => void
  onBack?: () => void
  editAction?: React.ReactNode
}

export default function ProfileTabs({ activeTab, setActiveTab, onBack, editAction }: ProfileTabsProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="flex items-center justify-center gap-3 sm:justify-start">
        {onBack && (
          <BackButton
            onClick={onBack}
            label="Go Back"
          />
        )}
        {editAction}
      </div>

      <UserTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { value: 'profile', label: 'Challenges', icon: Flag },
          { value: 'stats', label: 'Stats', icon: ChartColumnDecreasing },
        ]}
      />
    </div>
  )
}
