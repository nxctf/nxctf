import React from 'react'
import { DialogFooterLayout } from './DialogFooterLayout'
import ChallengeFlagForm from '../ChallengeFlagForm'
import type { ChallengeWithSolve } from '@/shared/types'
import type { KeyedBooleanMap, KeyedFlagFeedbackMap, KeyedStringMap } from '../../../types'

interface ChallengeFooterProps {
  challenge: ChallengeWithSolve
  flagInputs: KeyedStringMap
  placeholders: KeyedStringMap
  submitting: KeyedBooleanMap
  flagFeedback: KeyedFlagFeedbackMap
  handleFlagInputChange: (challengeId: string, value: string) => void
  handleFlagSubmit: (challengeId: string) => void
}

export const ChallengeFooter: React.FC<ChallengeFooterProps> = ({
  challenge,
  flagInputs,
  placeholders,
  submitting,
  flagFeedback,
  handleFlagInputChange,
  handleFlagSubmit,
}) => {
  return (
    <DialogFooterLayout>
      <ChallengeFlagForm
        challenge={challenge}
        flagInputs={flagInputs}
        placeholders={placeholders}
        submitting={submitting}
        flagFeedback={flagFeedback}
        handleFlagInputChange={handleFlagInputChange}
        handleFlagSubmit={handleFlagSubmit}
      />
    </DialogFooterLayout>
  )
}
