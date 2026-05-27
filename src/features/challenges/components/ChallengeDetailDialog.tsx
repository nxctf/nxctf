'use client'

import React, { useState } from 'react'
import { Flag, CheckCircle2 } from 'lucide-react'
import APP from '@/config'
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui'
import { MarkdownRenderer } from '@/shared/markdown/MarkdownRenderer'
import { DIALOG_CONTENT_CLASS_2XL } from '@/shared/styles'
import type { Attachment, ChallengeWithSolve } from '@/shared/types'
import ChallengeServicesPanel from './ChallengeServicesPanel'
import HintDialog from './HintDialog'
import SolversList from './SolversList'
import ChallengeAttachments from './challenge-detail/ChallengeAttachments'
import ChallengeDialogTabs from './challenge-detail/ChallengeDialogTabs'
import ChallengeFlagForm from './challenge-detail/ChallengeFlagForm'
import ChallengeHints from './challenge-detail/ChallengeHints'
import ChallengeMetadata from './challenge-detail/ChallengeMetadata'
import ChallengeTasksTeaser from './challenge-detail/ChallengeTasksTeaser'
import SubChallengePanel from './challenge-detail/SubChallengePanel'
import {
  ChallengeFooter,
  QuestionFooter,
  SolversFooter,
} from './challenge-detail/footers'
import type {
  ChallengeDialogTab,
  HintModalState,
  KeyedBooleanMap,
  KeyedFlagFeedbackMap,
  KeyedStringMap,
  Solver,
  SubChallengeMode,
  SubChallengeQuestion,
} from '../types'
import { getCategoryDetails, getDifficultyStyle, getChallengeFeatureType } from '../lib'

const ChallengeDescription = React.memo(function ChallengeDescription({ description }: { description: string }) {
  return (
    <MarkdownRenderer
      content={description}
      className="max-w-full select-text break-words text-gray-700 dark:text-gray-300 leading-relaxed [&_p:last-child]:mb-0 [&_ul:last-child]:mb-0 [&_ol:last-child]:mb-0 [&_blockquote:last-child]:my-0"
    />
  )
})

interface ChallengeDetailDialogProps {
  open: boolean
  challenge: (ChallengeWithSolve & { is_team_solved?: boolean }) | null
  solvers: Solver[]
  challengeTab: ChallengeDialogTab
  showQuestionTab: boolean
  setChallengeTab: (tab: ChallengeDialogTab, challengeId?: string) => void
  onClose: () => void
  flagInputs: KeyedStringMap
  handleFlagInputChange: (challengeId: string, value: string) => void
  handleFlagSubmit: (challengeId: string) => void
  submitting: KeyedBooleanMap
  flagFeedback: KeyedFlagFeedbackMap
  downloading: KeyedBooleanMap
  downloadFile: (attachment: Attachment, attachmentKey: string) => void
  showHintModal: HintModalState
  setShowHintModal: (modal: HintModalState) => void
  events?: { id: string; name: string }[]
  subChallengeLoaded: boolean
  subChallengeLoading: boolean
  subChallengeSubmitting: boolean
  subChallengeMode: SubChallengeMode
  subChallengeQuestions: SubChallengeQuestion[]
  subChallengeNextQuestion: SubChallengeQuestion | null
  subChallengeAnswers: Record<string, string>
  subChallengeResults: Record<string, boolean>
  subChallengeCompleted: boolean
  subChallengeFlag: string | null
  subChallengeMessage: string | null
  onSubChallengeAnswerChange: (orderNumber: number, value: string) => void
  onSubChallengeSubmit: (orderNumber?: number) => void
  onSubChallengeReset: () => void
  placeholders: KeyedStringMap
  services?: string[]
}

const ChallengeDetailDialog: React.FC<ChallengeDetailDialogProps> = ({
  open,
  challenge,
  solvers,
  challengeTab,
  showQuestionTab,
  setChallengeTab,
  onClose,
  flagInputs,
  handleFlagInputChange,
  handleFlagSubmit,
  submitting,
  flagFeedback,
  downloading,
  downloadFile,
  showHintModal,
  setShowHintModal,
  onSubChallengeReset,
  events = [],
  subChallengeLoaded,
  subChallengeLoading,
  subChallengeSubmitting,
  subChallengeMode,
  subChallengeQuestions,
  subChallengeNextQuestion,
  subChallengeAnswers,
  subChallengeResults,
  subChallengeCompleted,
  subChallengeFlag,
  subChallengeMessage,
  onSubChallengeAnswerChange,
  onSubChallengeSubmit,
  placeholders,
  services = [],
}) => {
  const [solvesSortOrder, setSolvesSortOrder] = useState<'newest' | 'oldest'>('oldest')
  const contentScrollRef = React.useRef<HTMLDivElement | null>(null)

  const solverCount = solvers.length > 0 ? solvers.length : (challenge?.total_solves ?? 0)

  const tabs = React.useMemo(() => [
    { key: 'challenge' as ChallengeDialogTab, label: 'Challenge' },
    ...(showQuestionTab ? [{ key: 'question' as ChallengeDialogTab, label: 'Questions' }] : []),
    { key: 'solvers' as ChallengeDialogTab, label: `${solverCount} ${solverCount === 1 ? 'solve' : 'solves'}` },
  ], [solverCount, showQuestionTab])

  // Sort solvers based on selected order
  const sortedSolvers = React.useMemo(() => {
    return [...solvers].sort((a, b) => {
      const timeA = new Date(a.solvedAt).getTime()
      const timeB = new Date(b.solvedAt).getTime()
      return solvesSortOrder === 'newest' ? timeB - timeA : timeA - timeB
    })
  }, [solvers, solvesSortOrder])

  React.useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [challenge?.id, challengeTab])

  if (!challenge) return null

  const isSolved = !!challenge.is_solved;
  const isTeamSolved = !!challenge.is_team_solved;

  // Difficulty color mapping (matching ChallengeCard)
  const rawDiff = (challenge.difficulty || '').toString().trim();
  const normalizedDiff = rawDiff === 'imposible' ? 'Impossible' : rawDiff.charAt(0).toUpperCase() + rawDiff.slice(1).toLowerCase();
  const colorName = (APP as any).difficultyStyles?.[normalizedDiff];
  const { textClass: diffTextColor } = getDifficultyStyle(colorName);
  const { borderColor: categoryBorderColor, badgeColor: categoryBadgeColor } = getCategoryDetails(challenge.category);
  const eventName = events.find(e => e.id === challenge.event_id)?.name || '';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent
        className={`${DIALOG_CONTENT_CLASS_2XL} w-[95vw] h-[90vh] flex flex-col`}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Fixed Header Section */}
        <div className="p-4 md:px-6 pb-0 shrink-0">
          <div className="flex flex-col gap-3 mb-5">
            {/* ROW 1: Title & Event */}
            <div className="flex items-start justify-between gap-4">
              <DialogTitle asChild>
                <h2 className="select-text text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
                  {challenge.title}
                </h2>
              </DialogTitle>
              {eventName && (
                <span className="select-none text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-2 shrink-0 font-medium">
                  {eventName}
                </span>
              )}
            </div>

            {/* ROW 2: Metadata & Points */}
            <div className={`flex items-center justify-between border-b pb-4 ${categoryBorderColor}`}>
              <div className="flex items-center gap-4">
                {/* Category Badge */}
                <div className="flex items-center gap-2">
                  <div className={`select-none text-[12px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${categoryBadgeColor}`}>
                    {challenge.category}
                  </div>

                  {(() => {
                    const featureType = getChallengeFeatureType(challenge);
                    return featureType !== 'N' ? (
                      <span className="select-none text-[11px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-tight">
                        {featureType}
                      </span>
                    ) : null;
                  })()}
                </div>

                {/* Difficulty */}
                <div className="select-none flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${diffTextColor.replace('text-', 'bg-').replace('-400', '-500')} shadow-sm`} />
                  <span className="text-[12px] font-semibold text-gray-500 tracking-tight">
                    {normalizedDiff}
                  </span>
                </div>
              </div>

              {/* Points & Solved Status */}
              <div className="flex items-center gap-4">
                {isSolved && (
                  <div className="select-none flex items-center gap-1.5 px-2 py-1 bg-green-500/15 rounded-md border border-green-500/20">
                    <Flag size={12} className="text-green-400 fill-green-400" />
                    <span className="text-[11px] font-bold text-green-400 uppercase tracking-widest">Solved</span>
                  </div>
                )}
                {!isSolved && isTeamSolved && (
                  <div className="select-none flex items-center gap-1.5 px-2 py-1 bg-purple-500/15 rounded-md border border-purple-500/20">
                    <CheckCircle2 size={12} className="text-purple-400" />
                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">Team Solved</span>
                  </div>
                )}
                <div className={`select-text text-2xl font-black tracking-tighter ${isSolved ? 'text-green-400' : isTeamSolved ? 'text-purple-400' : 'text-gray-900 dark:text-white'}`}>
                  {challenge.points} <span className="text-[14px] font-bold opacity-60 ml-0.5">pts</span>
                </div>
              </div>
            </div>
          </div>

          <ChallengeDialogTabs
            challengeId={challenge.id}
            tabs={tabs}
            activeTab={challengeTab}
            onTabChange={setChallengeTab}
          />
        </div>

        {/* Scrollable Content Area */}
        <div ref={contentScrollRef} className="flex-1 overflow-y-auto px-4 pb-2 md:px-6 scroll-hidden">
          {challengeTab === 'challenge' && (
            <div className="min-h-full flex flex-col pb-5">
              {/* Description at the Top */}
              <div className="flex-1">
                <div className="max-w-full overflow-x-auto break-words mt-2">
                  <ChallengeDescription description={challenge.description} />
                </div>
              </div>

              {/* Links, Tasks, and Hints at the Bottom (before flag form) */}
              <div className="mt-8 space-y-6">
                <ChallengeServicesPanel open={open} services={services} />

                <ChallengeAttachments
                  challenge={challenge}
                  downloading={downloading}
                  downloadFile={downloadFile}
                />

                {showQuestionTab && (
                  <ChallengeTasksTeaser
                    challengeId={challenge.id}
                    onTabChange={setChallengeTab}
                  />
                )}

                <ChallengeHints
                  challenge={challenge}
                  setShowHintModal={setShowHintModal}
                />
              </div>
            </div>
          )}

          {challengeTab === 'solvers' && (
            <div className="min-h-full">
              <SolversList solvers={sortedSolvers} />
            </div>
          )}

          {challengeTab === 'question' && (
            <div className="min-h-full">
              <SubChallengePanel
                challengeId={challenge.id}
                loaded={subChallengeLoaded}
                loading={subChallengeLoading}
                submitting={subChallengeSubmitting}
                mode={subChallengeMode}
                questions={subChallengeQuestions}
                nextQuestion={subChallengeNextQuestion}
                answers={subChallengeAnswers}
                results={subChallengeResults}
                completed={subChallengeCompleted}
                flag={subChallengeFlag}
                message={subChallengeMessage}
                onAnswerChange={onSubChallengeAnswerChange}
                onSubmit={onSubChallengeSubmit}
                onReset={onSubChallengeReset}
              />
            </div>
          )}
        </div>

        {/* Fixed Footer for Flag Submission / Questions Progress */}
        {challengeTab === 'challenge' && (
          <ChallengeFooter
            challenge={challenge}
            flagInputs={flagInputs}
            placeholders={placeholders}
            submitting={submitting}
            flagFeedback={flagFeedback}
            handleFlagInputChange={handleFlagInputChange}
            handleFlagSubmit={handleFlagSubmit}
          />
        )}

        {challengeTab === 'question' && (
          <QuestionFooter
            subChallengeCompleted={subChallengeCompleted}
            subChallengeFlag={subChallengeFlag}
            onReset={onSubChallengeReset}
          />
        )}

        {challengeTab === 'solvers' && (
          <SolversFooter
            solvesSortOrder={solvesSortOrder}
            setSolvesSortOrder={setSolvesSortOrder}
          />
        )}
      </DialogContent>
      <HintDialog
        challenge={showHintModal.challenge}
        hintIdx={showHintModal.hintIdx}
        open={!!showHintModal.challenge}
        onClose={() => setShowHintModal({ challenge: null })}
      />
    </Dialog>
  )
}

export default ChallengeDetailDialog
