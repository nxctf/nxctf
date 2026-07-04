'use client'

import { useState } from 'react'
import { CheckCircle2, Trophy, ListChecks, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog'
import { EmptyState } from '@/shared/components'
import { DIALOG_CONTENT_CLASS_3XL, SURFACE_GLASS_CARD_COMPACT_CLASS, TYPO_SECTION_TITLE_CLASS } from '@/shared/styles'
import { cn } from '@/shared/lib/utils'
import { TeamChallenge } from '../types'
import { formatDate } from '../lib/team-utils'
import ProfileChallengeListItem from '@/features/users/components/UserProfile/ProfileChallengeListItem'

interface TeamSolvesProps {
  challenges: TeamChallenge[]
  title?: string
}

export default function TeamSolves({
  challenges,
  title = 'Recent Team Solves',
}: TeamSolvesProps) {
  const [showAllSolves, setShowAllSolves] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className={cn(TYPO_SECTION_TITLE_CLASS, "flex items-center gap-2 !text-gray-900 dark:!text-white")}>
          <CheckCircle2 size={16} className="text-green-500" />
          {title}
        </h2>

        {challenges.length > 10 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAllSolves(true)}
            className="text-blue-500 hover:text-blue-600 font-bold text-xs uppercase tracking-wider"
          >
            Show All <ListChecks size={14} className="ml-1" />
          </Button>
        )}
      </div>

      <div className="grid gap-2.5">
        {challenges.length === 0 ? (
          <Card className={SURFACE_GLASS_CARD_COMPACT_CLASS}>
            <CardContent className="pt-4">
              <EmptyState
                icon={<Trophy className="w-full h-full text-gray-400" />}
                title="No solves yet"
                description="Challenges solved by your team will appear here."
                containerHeight="py-6"
              />
            </CardContent>
          </Card>
        ) : (
          challenges.slice(0, 10).map((c) => (
            <TeamSolveRow key={c.challenge_id} challenge={c} />
          ))
        )}
      </div>

      <Dialog open={showAllSolves} onOpenChange={setShowAllSolves}>
        <DialogContent className={DIALOG_CONTENT_CLASS_3XL + " fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 !rounded-2xl border-none p-0 overflow-hidden"}>
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200/30 bg-white/40 px-5 py-4 backdrop-blur-md dark:border-gray-800/30 dark:bg-[#0b0f19]/40">
            <DialogTitle className="text-base font-black uppercase tracking-widest text-gray-900 dark:text-white sm:text-lg">
              All Team Solves ({challenges.length})
            </DialogTitle>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowAllSolves(false)}
              className="rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-5 pt-3">
            {challenges.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">No solves yet.</div>
            ) : (
              <div className="scroll-hidden max-h-[60vh] space-y-2.5 overflow-y-auto pr-2">
                {challenges.map((c) => (
                  <TeamSolveRow key={c.challenge_id} challenge={c} />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TeamSolveRow({ challenge }: { challenge: TeamChallenge }) {
  return (
    <div className="transition-transform duration-200 hover:-translate-y-0.5">
      <ProfileChallengeListItem
        title={challenge.title}
        subtitle={
          <div className="flex items-center gap-2 flex-wrap">
            {(() => {
              const parts = (challenge.category || '').split('/')
              const parent = parts[0]
              const sub = parts.slice(1).join('/')
              return (
                <span className="font-bold text-blue-500/80">
                  {parent}
                  {sub && <span className="text-xs font-semibold text-gray-500 dark:text-gray-400"> / {sub}</span>}
                </span>
              )
            })()}
            <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            <span>Solved {formatDate(challenge.first_solved_at)}</span>
            <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            <span className="italic">by <span className="font-bold text-gray-700 dark:text-gray-300">{challenge.first_solver_username}</span></span>
          </div>
        }
        trailing={(
          <span className="rounded-full bg-green-500/10 px-4 py-1.5 text-sm font-black text-green-600 dark:text-green-400 border border-green-500/20 shadow-sm">
            +{challenge.points}
          </span>
        )}
      />
    </div>
  )
}
