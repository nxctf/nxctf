'use client'

import { useMemo } from 'react'
import { CheckCircle2, Flame, ListChecks, LockKeyhole, Target } from 'lucide-react'
import {
  BaseModal,
  Loader,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@/shared/components'
import { Button } from '@/shared/ui'
import APP from '@/config'
import { useCategories } from '@/shared/contexts/CategoriesContext'
import { formatRelativeDate } from '@/shared/lib'
import type { ChallengeWithSolve } from '@/shared/types'
import { UserEmptyState } from '../ui'
import ProfileChallengeListItem from './ProfileChallengeListItem'

type ProfileChallengesModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'solved' | 'unsolved'
  challenges: ChallengeWithSolve[]
  loading?: boolean
  firstBloodIds?: string[]
  onSwitchMode?: () => void
}

export default function ProfileChallengesModal({
  open,
  onOpenChange,
  mode,
  challenges,
  loading = false,
  firstBloodIds = [],
  onSwitchMode,
}: ProfileChallengesModalProps) {
  const isSolvedMode = mode === 'solved'
  const { categories: dbCategories } = useCategories()
  const groupedChallenges = useMemo(() => {
    if (isSolvedMode) return {}

    return challenges.reduce((acc, challenge) => {
      if (!acc[challenge.category]) acc[challenge.category] = []
      acc[challenge.category].push(challenge)
      return acc
    }, {} as Record<string, ChallengeWithSolve[]>)
  }, [challenges, isSolvedMode])

  const orderedCategories = useMemo(() => {
    if (isSolvedMode) return []

    const preferredOrder = dbCategories.map((c) => c.name)
    const categories = Object.keys(groupedChallenges)
    const matchedCategorySet = new Set<string>()

    return [
      ...preferredOrder.flatMap((preferredCategory) => {
        const preferredCategoryLower = preferredCategory.toLowerCase()
        const found = categories.find((category) => {
          const categoryLower = category.toLowerCase()
          return categoryLower.includes(preferredCategoryLower) || preferredCategoryLower.includes(categoryLower)
        })
        if (found && !matchedCategorySet.has(found)) {
          matchedCategorySet.add(found)
          return found
        }
        return [] as string[]
      }),
      ...categories.filter((category) => !matchedCategorySet.has(category)).sort(),
    ]
  }, [groupedChallenges, isSolvedMode, dbCategories])

  const title = isSolvedMode ? 'All Solved Challenges' : 'Unsolved Challenges'
  const switchLabel = isSolvedMode ? 'Show Unsolved' : 'Show All Solved'
  const SwitchIcon = isSolvedMode ? Target : ListChecks

  return (
    <BaseModal open={open} onOpenChange={onOpenChange} size="3xl">
      <ModalHeader
        title={title}
        actions={onSwitchMode ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onSwitchMode}
            className="rounded-full border-blue-500/30 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
          >
            <SwitchIcon className="h-3.5 w-3.5" />
            {switchLabel}
          </Button>
        ) : undefined}
      />

      <ModalBody>
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader color="text-blue-500" />
          </div>
        ) : challenges.length === 0 ? (
          <UserEmptyState
            icon={isSolvedMode ? CheckCircle2 : LockKeyhole}
            title={isSolvedMode ? 'No solved challenges yet' : 'All challenges completed'}
            description={isSolvedMode ? 'Solved challenges will appear here.' : 'No available unsolved challenges in this event scope.'}
          />
        ) : isSolvedMode ? (
          <div className="space-y-3">
            {challenges.map((challenge) => (
              <SolvedChallengeModalRow
                key={challenge.id}
                challenge={challenge}
                firstBlood={firstBloodIds.includes(challenge.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {orderedCategories.map((category) => {
              const challengeList = groupedChallenges[category]

              return (
                <section key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                      {category.replace(/\//g, ' / ')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {challengeList.length} {challengeList.length === 1 ? 'challenge' : 'challenges'}
                    </span>
                  </div>

                  <div className="grid gap-2">
                    {challengeList.map((challenge) => (
                      <ProfileChallengeListItem
                        key={challenge.id}
                        title={challenge.title}
                        titleBadge={(
                          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                            {challenge.difficulty}
                          </span>
                        )}
                        subtitle={(
                          <p className="truncate">
                            {challenge.points} pts / {challenge.total_solves || 0} solves
                          </p>
                        )}
                        className="p-3"
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="border-blue-500/30 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
        >
          Close
        </Button>
      </ModalFooter>
    </BaseModal>
  )
}

function SolvedChallengeModalRow({
  challenge,
  firstBlood,
}: {
  challenge: ChallengeWithSolve
  firstBlood: boolean
}) {
  return (
    <ProfileChallengeListItem
      title={challenge.title}
      subtitle={(
        <p className="truncate">
          {(challenge.category || '').replace(/\//g, ' / ')} / {challenge.difficulty} / {challenge.solved_at ? formatRelativeDate(challenge.solved_at) : '-'}
        </p>
      )}
      trailing={(
        <div className="grid grid-cols-[96px_56px] items-center gap-2">
          {firstBlood ? (
            <span className="inline-flex w-24 items-center justify-center gap-1 rounded-full border border-red-500/25 bg-red-500/10 px-2 py-1 text-[11px] font-bold text-red-600 dark:text-red-400">
              <Flame className="h-3 w-3 fill-red-500 text-red-500" />
              First Blood
            </span>
          ) : (
            <span aria-hidden="true" />
          )}
          <span className="inline-flex w-14 items-center justify-center rounded-full bg-blue-500/10 px-2 py-1 text-sm font-bold text-blue-600 dark:text-blue-400">
            +{challenge.points}
          </span>
        </div>
      )}
    />
  )
}
