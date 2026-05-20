'use client'

import type { useChallengesPageData } from '../../hooks/useChallengesPageData'
import ChallengeDetailDialog from '../ChallengeDetailDialog'
import JoinEventDialog from '../JoinEventDialog'

type ChallengesPageData = ReturnType<typeof useChallengesPageData>

type ChallengeDialogsProps = {
  data: ChallengesPageData
}

export default function ChallengeDialogs({ data }: ChallengeDialogsProps) {
  return (
    <>
      <JoinEventDialog
        open={data.isJoinDialogOpen}
        onOpenChange={data.setIsJoinDialogOpen}
        event={data.targetEventMembership?.evt || null}
        joinMode={data.targetEventMembership?.joinMode || 'open'}
        membershipData={data.targetEventMembership?.membership || null}
        onSuccess={async () => {
          if (data.targetEventId) {
            const membership = await data.getCachedEventMembership(data.targetEventId, true)
            data.setEventMembership(membership)
            data.setSelectedEvent(data.targetEventId)
            if (data.currentTab === 'events') data.setCurrentTab('challenges')
          }
          data.setIsJoinDialogOpen(false)
          data.setTargetEventMembership(null)
          data.setTargetEventId(null)
        }}
      />

      <ChallengeDetailDialog
        open={!!data.selectedChallenge}
        challenge={data.selectedChallenge}
        solvers={data.solvers}
        challengeTab={data.challengeTab}
        showQuestionTab={!!data.selectedSubChallengeState?.hasQuestions}
        setChallengeTab={(tab) => {
          if ((tab === 'solvers' || tab === 'question') && data.selectedChallenge) {
            data.handleTabChange(tab, data.selectedChallenge.id)
          } else {
            data.setChallengeTab(tab)
          }
        }}
        onClose={() => {
          data.closeChallenge()
          data.setChallengeTab('challenge')
        }}
        flagInputs={data.flagInputs}
        handleFlagInputChange={data.handleFlagInputChange}
        handleFlagSubmit={data.handleFlagSubmit}
        submitting={data.submitting}
        flagFeedback={data.flagFeedback}
        downloading={data.downloading}
        downloadFile={data.downloadFile}
        showHintModal={data.showHintModal}
        setShowHintModal={data.setShowHintModal}
        events={data.events}
        subChallengeLoaded={!!data.selectedSubChallengeState?.loaded}
        subChallengeLoading={!!data.selectedSubChallengeState?.loading}
        subChallengeSubmitting={!!data.selectedSubChallengeState?.submitting}
        subChallengeMode={data.selectedSubChallengeState?.mode || 'none'}
        subChallengeQuestions={data.selectedSubChallengeState?.questions || []}
        subChallengeNextQuestion={data.selectedSubChallengeState?.nextQuestion || null}
        subChallengeAnswers={data.selectedSubChallengeAnswers}
        subChallengeResults={data.selectedSubChallengeState?.results || {}}
        subChallengeCompleted={!!data.selectedSubChallengeState?.completed}
        subChallengeFlag={data.selectedSubChallengeState?.flag || null}
        subChallengeMessage={data.selectedSubChallengeState?.message || null}
        placeholders={data.placeholders}
        services={data.selectedChallenge?.services || []}
        onSubChallengeAnswerChange={(orderNumber, value) => {
          if (!data.selectedChallenge) return
          data.handleSubChallengeAnswerChange(data.selectedChallenge.id, orderNumber, value)
        }}
        onSubChallengeSubmit={(orderNumber) => {
          if (!data.selectedChallenge) return
          data.handleSubChallengeSubmit(data.selectedChallenge.id, orderNumber)
        }}
        onSubChallengeReset={() => {
          if (!data.selectedChallenge) return
          data.resetSubChallengeAnswers(data.selectedChallenge.id)
        }}
      />
    </>
  )
}
