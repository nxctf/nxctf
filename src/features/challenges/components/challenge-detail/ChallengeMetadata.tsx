'use client'

import React from 'react'
import APP from '@/config'
import { useSystemSettings } from '@/shared/contexts/SystemSettingsContext'
import DifficultyBadge from '@/features/challenges/components/DifficultyBadge'
import { CustomBadge } from '@/shared/ui'
import type { ChallengeWithSolve } from '@/shared/types'

type ChallengeMetadataProps = {
  challenge: ChallengeWithSolve
  events: { id: string; name: string }[]
}

export default function ChallengeMetadata({ challenge, events }: ChallengeMetadataProps) {
  const { settings } = useSystemSettings()
  const getEventName = (eventId?: string | null) => {
    if (!eventId) return String(settings.event_main_label || 'Main')
    const event = events.find((candidate) => candidate.id === eventId)
    return event?.name || 'Unknown Event'
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {(() => {
          const parts = (challenge.category || '').split('/')
          const parent = parts[0]
          const sub = parts.slice(1).join('/')
          return (
            <div className="flex items-center gap-2">
              <CustomBadge label={parent} color="bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200" />
              {sub && (
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  / {sub}
                </span>
              )}
            </div>
          )
        })()}
        <span>
          <React.Suspense fallback={<span className="inline-block min-w-[64px] text-center text-xs font-semibold">{challenge.difficulty}</span>}>
            <DifficultyBadge className="min-w-[62px]" difficulty={challenge.difficulty} />
          </React.Suspense>
        </span>
        {challenge.event_id && (
          <CustomBadge
            label={getEventName(challenge.event_id)}
            color="bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
          />
        )}
      </div>
      <span className={`flex items-center gap-1 text-base font-bold ${challenge.is_solved ? 'text-green-300 dark:text-white' : 'text-yellow-300 dark:text-white'}`}>
        ðŸª™ {challenge.points}
      </span>
    </div>
  )
}
