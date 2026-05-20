'use client'

import { ArrowRight, ClipboardList } from 'lucide-react'

import type { ChallengeDialogTab } from '../../types'

type ChallengeTasksTeaserProps = {
  challengeId: string
  onTabChange: (tab: ChallengeDialogTab, challengeId?: string) => void
}

export default function ChallengeTasksTeaser({
  challengeId,
  onTabChange,
}: ChallengeTasksTeaserProps) {
  return (
    <div>
      <p className="select-none text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5 opacity-80">
        <ClipboardList className="h-4 w-4" />
        <span>Tasks</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          title="Answer all questions to get the flag"
          aria-label="Answer all questions to get the flag"
          onClick={() => onTabChange('question', challengeId)}
          className={`flex select-none items-center gap-2 px-4 py-2 text-sm font-bold ${'inline-flex items-center justify-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground caret-transparent transition-all hover:border-ring/40 hover:bg-muted focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0'}`}
        >
          <ClipboardList className="h-4 w-4 text-gray-400" />
          <span>Answer Questions to Get the Flag</span>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  )
}
