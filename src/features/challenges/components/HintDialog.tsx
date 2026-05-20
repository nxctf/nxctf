import React from 'react'
import { Lightbulb } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui'
import type { ChallengeWithSolve } from '@/shared/types'

interface HintDialogProps {
  challenge: ChallengeWithSolve | null;
  hintIdx?: number;
  open: boolean;
  onClose: () => void;
}

const HintDialog: React.FC<HintDialogProps> = ({ challenge, hintIdx = 0, open, onClose }) => {
  if (!challenge) return null

  const hints: string[] = Array.isArray(challenge.hint) ? challenge.hint : []
  const hintText = hints[hintIdx]

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className={`${'w-[calc(100vw-32px)] sm:w-full fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md rounded-2xl bg-card border border-border text-card-foreground p-6'} max-h-[85dvh] overflow-y-auto scroll-hidden`}>
        <DialogHeader className="select-none space-y-0">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="flex min-w-0 items-center gap-3 text-lg font-bold tracking-tight text-gray-900 dark:text-white">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Lightbulb className="h-5 w-5" />
              </span>
              <span className="truncate">Hint {hintIdx + 1}</span>
            </DialogTitle>
            <DialogDescription className="max-w-[48%] truncate pt-2 text-right text-sm font-bold text-gray-500 dark:text-gray-400">
              {challenge.title}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="mt-6 select-text text-sm leading-relaxed text-gray-700 dark:text-gray-200">
          {hintText ? (
            <div className="whitespace-pre-wrap break-words">{hintText}</div>
          ) : (
            <p className="italic text-gray-500 dark:text-gray-400">No hint available.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default HintDialog
