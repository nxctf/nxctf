'use client'

import React from 'react'
import APP from '@/config'
import DifficultyBadge from '@/features/challenges/components/DifficultyBadge'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib/utils'
import type { ChallengeWithSolve } from '@/shared/types'

type ChallengeMetadataProps = {
  challenge: ChallengeWithSolve
  events: { id: string; name: string }[]
}

export default function ChallengeMetadata({ challenge, events }: ChallengeMetadataProps) {
  const getEventName = (eventId?: string | null) => {
    if (!eventId) return String(APP.eventMainLabel || 'Main')
    const event = events.find((candidate) => candidate.id === eventId)
    return event?.name || 'Unknown Event'
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {challenge.category}
        </Badge>
        <React.Suspense
          fallback={
            <span className="inline-flex min-w-16 items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium">
              {challenge.difficulty}
            </span>
          }
        >
          <DifficultyBadge difficulty={challenge.difficulty} />
        </React.Suspense>
        {challenge.event_id && (
          <Badge className="bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            {getEventName(challenge.event_id)}
          </Badge>
        )}
      </div>
      <span className={cn('flex items-center gap-1 text-base font-bold', challenge.is_solved ? 'text-green-300' : 'text-yellow-300')}>
        🪙 {challenge.points}
      </span>
    </div>
  )
}
