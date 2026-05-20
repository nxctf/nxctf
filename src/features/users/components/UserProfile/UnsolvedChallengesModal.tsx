'use client'

import { useMemo } from 'react'
import { LockKeyhole } from 'lucide-react'
import { Loader } from '@/shared/components'
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@/shared/ui'
import APP from '@/config'
import type { ChallengeWithSolve } from '@/shared/types'
import { UserEmptyState } from '../ui'
import ProfileChallengeListItem from './ProfileChallengeListItem'

type UnsolvedChallengesModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  unsolvedChallenges: ChallengeWithSolve[]
}

export default function UnsolvedChallengesModal({
  open,
  onOpenChange,
  loading,
  unsolvedChallenges
}: UnsolvedChallengesModalProps) {
  const unsolvedByCategory = useMemo(() => {
    return unsolvedChallenges.reduce((acc, challenge) => {
      if (!acc[challenge.category]) {
        acc[challenge.category] = []
      }
      acc[challenge.category].push(challenge)
      return acc
    }, {} as Record<string, ChallengeWithSolve[]>)
  }, [unsolvedChallenges])

  const orderedUnsolvedCategories = useMemo(() => {
    const preferredOrder = (typeof APP !== 'undefined' && APP.challengeCategories) ? APP.challengeCategories : []
    const categories = Object.keys(unsolvedByCategory)
    const matchedCategorySet = new Set<string>()

    return [
      ...preferredOrder.flatMap(p => {
        const pLower = p.toLowerCase()
        const found = categories.find(c => {
          const cLower = c.toLowerCase()
          return cLower.includes(pLower) || pLower.includes(cLower)
        })
        if (found && !matchedCategorySet.has(found)) {
          matchedCategorySet.add(found)
          return found
        }
        return [] as string[]
      }),
      ...categories.filter(c => !matchedCategorySet.has(c)).sort()
    ]
  }, [unsolvedByCategory])

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="3xl">
      <ModalHeader title="Unsolved Challenges" />

      <ModalBody>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader color="text-blue-500" />
          </div>
        ) : unsolvedChallenges.length === 0 ? (
          <UserEmptyState
            icon={LockKeyhole}
            title="All challenges completed"
            description="No available unsolved challenges in this event scope."
          />
        ) : (
          <div className="space-y-5">
            {orderedUnsolvedCategories.map(category => {
              const challengeList = unsolvedByCategory[category]

              return (
                <section key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                      {category}
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
    </Modal>
  )
}
