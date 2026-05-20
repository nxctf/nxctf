'use client'

import { Lightbulb } from 'lucide-react'

import type { ChallengeWithSolve } from '@/shared/types'
import type { HintModalState } from '../../types'

const RESOURCE_ACTION_CLASS =
  `flex select-none items-center gap-2 px-4 py-2 text-sm font-bold ${'inline-flex items-center justify-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground caret-transparent transition-all hover:border-ring/40 hover:bg-muted focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0'}`

type ChallengeHintsProps = {
  challenge: ChallengeWithSolve
  setShowHintModal: (modal: HintModalState) => void
}

export default function ChallengeHints({
  challenge,
  setShowHintModal,
}: ChallengeHintsProps) {
  if (!Array.isArray(challenge.hint) || challenge.hint.length === 0) return null

  return (
    <div>
      <p className="mb-2 flex select-none items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 opacity-80">
        <Lightbulb className="h-4 w-4" />
        <span>Hints</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {(challenge.hint ?? []).map((_hint: string, idx: number) => (
          <button
            key={idx}
            type="button"
            className={RESOURCE_ACTION_CLASS}
            onClick={(event) => {
              event.stopPropagation()
              setShowHintModal({ challenge, hintIdx: idx })
            }}
          >
            <Lightbulb className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            <span>Hint {(challenge.hint?.length ?? 0) > 1 ? idx + 1 : ''}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
