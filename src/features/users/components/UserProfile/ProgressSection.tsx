'use client'

import React from 'react'
import { BarChart3 } from 'lucide-react'
import APP from '@/config'
import { ChallengeWithSolve } from '@/shared/types'
import { normalizeChallengeCategory } from '../../lib/challenge-category'
import { UserEmptyState, UserSection } from '../ui'
import { cn } from '@/shared/lib/utils'
import {
  SURFACE_GLASS_CARD_COMPACT_CLASS,
  TYPO_CARD_TITLE_CLASS,
  TYPO_METADATA_CLASS
} from '@/shared/styles'

type ProgressSectionProps = {
  categoryTotals: { category: string; total_challenges: number }[]
  difficultyTotals: { difficulty: string; total_challenges: number }[]
  solvedChallenges: ChallengeWithSolve[]
}

export default function ProgressSection({
  categoryTotals,
  difficultyTotals,
  solvedChallenges
}: ProgressSectionProps) {
  const visibleCategories = React.useMemo(() => {
    const aggregated: Record<string, { category: string; total_challenges: number; solvedCount: number }> = {}

    categoryTotals.forEach(({ category, total_challenges }) => {
      const parent = (category || '').split('/')[0]
      if (!parent) return

      if (!aggregated[parent]) {
        const solvedCount = solvedChallenges.filter(c => {
          const challengeParent = (c.category || '').split('/')[0]
          return challengeParent.toLowerCase() === parent.toLowerCase()
        }).length

        aggregated[parent] = {
          category: parent,
          total_challenges: 0,
          solvedCount
        }
      }
      aggregated[parent].total_challenges += total_challenges
    })

    return Object.values(aggregated)
      .map(({ category, total_challenges, solvedCount }) => {
        const progress = total_challenges > 0 ? (solvedCount / total_challenges) * 100 : 0
        return { category, total_challenges, solvedCount, progress }
      })
      .filter(({ solvedCount }) => solvedCount > 0)
  }, [categoryTotals, solvedChallenges])

  const difficultyOrder = Object.keys(APP.difficultyStyles).map(k => k.toLowerCase())
  const activeDifficulties = difficultyTotals
    .map(({ difficulty, total_challenges }) => {
      const rawDiff = difficulty.toString().trim()
      const normalizedDiff = rawDiff === 'imposible' ? 'Impossible' : rawDiff.charAt(0).toUpperCase() + rawDiff.slice(1).toLowerCase()
      const colorBase = (APP.difficultyStyles as Record<string, string>)[normalizedDiff] || 'gray'

      // Color mapping
      const bgMap: Record<string, string> = {
        cyan: 'bg-cyan-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-400',
        red: 'bg-red-500',
        purple: 'bg-purple-500',
      }
      const textMap: Record<string, string> = {
        cyan: 'text-cyan-600 dark:text-cyan-400',
        green: 'text-green-600 dark:text-green-400',
        yellow: 'text-yellow-600 dark:text-yellow-400',
        red: 'text-red-600 dark:text-red-400',
        purple: 'text-purple-600 dark:text-purple-400',
      }
      const borderMap: Record<string, string> = {
        cyan: 'border-cyan-500/20 bg-cyan-500/10',
        green: 'border-green-500/20 bg-green-500/10',
        yellow: 'border-yellow-400/20 bg-yellow-400/10',
        red: 'border-red-500/20 bg-red-500/10',
        purple: 'border-purple-500/20 bg-purple-500/10',
      }

      return {
        difficulty,
        total_challenges,
        solvedCount: solvedChallenges.filter(c => c.difficulty === difficulty).length,
        bgColor: bgMap[colorBase] || 'bg-gray-500',
        textColor: textMap[colorBase] || 'text-gray-600 dark:text-gray-400',
        borderColor: borderMap[colorBase] || 'border-gray-500/20 bg-gray-500/10',
      }
    })
    .filter(({ solvedCount, total_challenges }) => total_challenges > 0 && solvedCount > 0)
    .sort((a, b) => {
      const aIndex = difficultyOrder.indexOf(a.difficulty.toLowerCase())
      const bIndex = difficultyOrder.indexOf(b.difficulty.toLowerCase())
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return a.difficulty.localeCompare(b.difficulty)
    })

  const totalChallenges = activeDifficulties.reduce((sum, d) => sum + d.total_challenges, 0)
  const totalSolved = activeDifficulties.reduce((sum, d) => sum + d.solvedCount, 0)

  return (
    <UserSection
      icon={BarChart3}
      title="Progress"
      description="Solved challenge coverage by category and difficulty."
      contentClassName="space-y-6"
    >
      {visibleCategories.length === 0 ? (
        <UserEmptyState
          icon={BarChart3}
          title="No progress yet"
          description="Solve a challenge to start filling this progress board."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleCategories.map(({ category, total_challenges, solvedCount, progress }) => (
            <div
              key={category}
              className={cn("p-4", SURFACE_GLASS_CARD_COMPACT_CLASS)}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className={TYPO_CARD_TITLE_CLASS}>
                  {category}
                </span>
                <span className={TYPO_METADATA_CLASS}>
                  {solvedCount}/{total_challenges}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200/50 dark:bg-gray-800/50">
                <div
                  style={{ width: `${progress}%` }}
                  className="h-full rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.2)]"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeDifficulties.length > 0 && (
        <div className={cn("p-4", SURFACE_GLASS_CARD_COMPACT_CLASS)}>
          <div className="mb-3 flex items-center justify-between">
            <span className={TYPO_CARD_TITLE_CLASS}>
              Difficulty Progress
            </span>
            <span className={TYPO_METADATA_CLASS}>
              {totalSolved}/{totalChallenges}
            </span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-gray-200/50 dark:bg-gray-800/50 gap-0.5">
            {activeDifficulties.map(({ difficulty, total_challenges, solvedCount, bgColor }, index) => {
              const segmentWidth = (total_challenges / totalChallenges) * 100
              const segmentProgress = (solvedCount / total_challenges) * 100

              return (
                <div
                  key={difficulty}
                  className="relative group h-full"
                  style={{ width: `${segmentWidth}%` }}
                  title={`${difficulty}: ${solvedCount}/${total_challenges}`}
                >
                  <div className="absolute inset-0 bg-black/5 dark:bg-white/5" />
                  <div
                    style={{ width: `${segmentProgress}%` }}
                    className={`h-full ${bgColor}`}
                  />
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {activeDifficulties.map(({ difficulty, total_challenges, solvedCount, bgColor, textColor, borderColor }) => (
              <span
                key={difficulty}
                className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition-colors", borderColor, textColor, TYPO_METADATA_CLASS)}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", bgColor)} />
                <span className="capitalize">{difficulty}</span>
                <span className="opacity-70">
                  ({solvedCount}/{total_challenges})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </UserSection>
  )
}
