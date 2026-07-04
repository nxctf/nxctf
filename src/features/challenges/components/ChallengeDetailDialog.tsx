'use client'

import React, { useState } from 'react'
import { Flag, Check, CheckCircle2, ListChecks, Server, Key, MapPin, ClipboardCopy } from 'lucide-react'
import toast from 'react-hot-toast'
import APP from '@/config'
import { useSystemSettings } from '@/shared/contexts/SystemSettingsContext'
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
  GeoFooter,
  ChallengeGeoTeaserFooter,
} from './challenge-detail/footers'
import GeoMapPanel from './challenge-detail/GeoMapPanel'
import type {
  ChallengeDialogTab,
  GeoCoordinates,
  HintModalState,
  KeyedBooleanMap,
  KeyedFlagFeedbackMap,
  KeyedStringMap,
  Solver,
  SubChallengeMode,
  SubChallengeQuestion,
} from '../types'
import { getCategoryDetails, getDifficultyStyle, getChallengeFeatureType } from '../lib'
import type { MutableRefObject } from 'react'

const ChallengeDescription = React.memo(function ChallengeDescription({ description }: { description: string }) {
  return (
    <MarkdownRenderer
      content={description}
      className="max-w-full select-text break-words text-gray-700 dark:text-gray-300 leading-relaxed [&_p:last-child]:mb-0 [&_ul:last-child]:mb-0 [&_ol:last-child]:mb-0 [&_blockquote:last-child]:my-0"
    />
  )
})

function getChallengeDialogTitle(title: string) {
  const normalized = title.trim().replace(/\\/g, '/')
  const parts = normalized.split('/').filter(Boolean)
  return parts.at(-1) || title
}

interface ChallengeDetailDialogProps {
  open: boolean
  challenge: (ChallengeWithSolve & { is_team_solved?: boolean }) | null
  solvers: Solver[]
  challengeTab: ChallengeDialogTab
  showQuestionTab: boolean
  setChallengeTab: (tab: ChallengeDialogTab, challengeId?: string) => void | Promise<unknown>
  onClose: () => void
  flagInputs: KeyedStringMap
  handleFlagInputChange: (challengeId: string, value: string) => void
  handleFlagSubmit: (challengeId: string, customFlag?: string) => void | Promise<unknown>
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
  onSubChallengeSubmit: (orderNumber?: number) => void | Promise<unknown>
  onSubChallengeReset: () => void | Promise<unknown>
  placeholders: KeyedStringMap
  submissionsRemaining?: number
  cooldownSeconds?: number
  services?: string[]
  scrollPositionRef: MutableRefObject<{ x: number; y: number }>
  geoGuesses?: Record<string, GeoCoordinates | null>
  geoFeedback?: Record<string, { success: boolean; message: string; distance_km?: number } | null>
  geoSubmitting?: KeyedBooleanMap
  geoSubmissionsRemaining?: number
  geoCooldownSeconds?: number
  handleGeoSubmit?: (challengeId: string, coords: GeoCoordinates, prefix: string) => Promise<boolean>
  handleGeoGuessChange?: (challengeId: string, coords: GeoCoordinates | null) => void
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
  submissionsRemaining = 10,
  cooldownSeconds = 0,
  services = [],
  scrollPositionRef,
  geoGuesses = {},
  geoFeedback = {},
  geoSubmitting = {},
  geoSubmissionsRemaining = 10,
  geoCooldownSeconds = 0,
  handleGeoSubmit = async () => false,
  handleGeoGuessChange = () => { },
}) => {
  const [solvesSortOrder, setSolvesSortOrder] = useState<'newest' | 'oldest'>('oldest')
  const [copiedMarkdown, setCopiedMarkdown] = useState(false)
  const contentScrollRef = React.useRef<HTMLDivElement | null>(null)

  const handleCopyChallengeMarkdown = React.useCallback(() => {
    if (!challenge) return

    const getAbsoluteUrl = (url: string) => {
      if (!url) return ''
      if (url.startsWith('http://') || url.startsWith('https://')) return url
      if (typeof window !== 'undefined') {
        return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`
      }
      return url
    }

    const fileAttachments = (challenge.attachments || []).filter((a) => a.type === 'file')

    const fileList = fileAttachments
      .map((a) => {
        const absUrl = getAbsoluteUrl(a.url)
        const filename = a.name || absUrl.split('/').pop() || 'file'
        return `- [${filename}](${absUrl})`
      })
      .join('\n')

    const wgetCommands = fileAttachments.length > 0
      ? '\n\n```bash\n' +
      fileAttachments.map((a, idx) => {
        const absUrl = getAbsoluteUrl(a.url)
        const filename = a.name || absUrl.split('/').pop() || `file-${idx}`
        const escUrl = absUrl.replace(/'/g, "'\\'\'")
        const escName = filename.replace(/'/g, "'\\'\'")
        return `wget '${escUrl}' -O '${escName}'`
      }).join(' && ') +
      '\n```'
      : ''

    const filesContent = fileList ? `${fileList}${wgetCommands}` : '- (No files)'

    const links = (challenge.attachments || [])
      .filter((a) => a.type !== 'file')
      .map((a) => `- [${a.name || a.url || 'link'}](${getAbsoluteUrl(a.url)})`)
      .join('\n')

    const flagPlaceholder = challenge.flag_placeholder && placeholders[challenge.id]
      ? placeholders[challenge.id]
      : 'FormatFLAGnya'

    const markdownText = `# ${challenge.title}
## Description
${challenge.description || ''}

## Attachment
### Files
${filesContent}

### Url
${links || '- (No links)'}

## Solution
-

## Flag
{${flagPlaceholder}}`

    if (!navigator.clipboard) {
      toast.error('Clipboard not available')
      return
    }

    navigator.clipboard.writeText(markdownText).then(() => {
      setCopiedMarkdown(true)
      setTimeout(() => setCopiedMarkdown(false), 2000)
      toast.success('Copied challenge markdown!')
    }).catch((err) => {
      console.error('Failed to copy challenge markdown:', err)
      toast.error('Failed to copy to clipboard')
    })
  }, [challenge, placeholders])

  const [geoRevealed, setGeoRevealed] = useState<Record<string, boolean>>({})
  const [geoTargets, setGeoTargets] = useState<Record<string, { lat: number; lng: number; radius_km: number; flag?: string }>>({})
  const [geoRevealCardOpen, setGeoRevealCardOpen] = useState<Record<string, boolean>>({})

  const handleGeoTargetLoaded = React.useCallback((target: { lat: number; lng: number; radius_km: number; flag?: string }) => {
    if (!challenge) return
    setGeoTargets(prev => ({ ...prev, [challenge.id]: target }))
  }, [challenge])

  const handleRevealGeo = React.useCallback(() => {
    if (!challenge) return
    setGeoRevealed(prev => ({ ...prev, [challenge.id]: true }))
  }, [challenge])

  const handleTabChange = React.useCallback((tab: ChallengeDialogTab, challengeId?: string) => {
    setChallengeTab(tab, challengeId)
  }, [setChallengeTab])

  const solverCount = solvers.length > 0 ? solvers.length : (challenge?.total_solves ?? 0)

  const tabs = React.useMemo(() => [
    { key: 'challenge' as ChallengeDialogTab, label: 'Challenge' },
    ...(challenge?.has_geo_flag ? [{ key: 'geo_answer' as ChallengeDialogTab, label: 'Geo Guess' }] : []),
    ...(showQuestionTab ? [{ key: 'question' as ChallengeDialogTab, label: 'Questions' }] : []),
    { key: 'solvers' as ChallengeDialogTab, label: `${solverCount} ${solverCount === 1 ? 'solve' : 'solves'}` },
  ], [solverCount, showQuestionTab, challenge?.has_geo_flag])

  // Sort solvers based on selected order
  const sortedSolvers = React.useMemo(() => {
    return [...solvers].sort((a, b) => {
      const timeA = new Date(a.solvedAt).getTime()
      const timeB = new Date(b.solvedAt).getTime()
      return solvesSortOrder === 'newest' ? timeB - timeA : timeA - timeB
    })
  }, [solvers, solvesSortOrder])

  React.useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [challenge?.id, challengeTab])

  const { settings } = useSystemSettings()

  if (!challenge) return null

  const isSolved = !!challenge.is_solved;
  const isTeamSolved = !!challenge.is_team_solved;

  // Difficulty color mapping (matching ChallengeCard)
  const rawDiff = (challenge.difficulty || '').toString().trim();
  const normalizedDiff = rawDiff === 'imposible' ? 'Impossible' : rawDiff.charAt(0).toUpperCase() + rawDiff.slice(1).toLowerCase();
  const colorName = (APP as any).difficultyStyles?.[normalizedDiff];
  const { badgeClass: diffBadgeColor, textClass: diffTextColor } = getDifficultyStyle(colorName);
  const { color: categoryIconColor, borderColor: categoryBorderColor, badgeColor: categoryBadgeColor } = getCategoryDetails(challenge.category);
  const eventName = events.find(e => e.id === challenge.event_id)?.name || String(settings.event_main_label || 'main');
  const dialogTitle = getChallengeDialogTitle(challenge.title);
  const featureType = getChallengeFeatureType(challenge);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isOpen) return
      onClose()
    }}>
      <DialogContent
        className={`${DIALOG_CONTENT_CLASS_2XL} w-[95vw] h-[90vh] flex flex-col`}
        aria-describedby={undefined}
        onClick={(event) => event.stopPropagation()}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          const { x, y } = scrollPositionRef.current
          requestAnimationFrame(() => {
            window.scrollTo({ left: x, top: y, behavior: 'auto' })
          })
        }}
      >
        {/* Fixed Header Section */}
        <div className="p-4 md:px-6 pb-0 shrink-0">
          <div className="flex flex-col gap-3 mb-5">
            {/* ROW 1: Title, Event & Copy */}
            <div className="flex items-start justify-between gap-4">
              <DialogTitle asChild>
                <h2 className="select-text text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight flex-1 min-w-0">
                  {dialogTitle}
                </h2>
              </DialogTitle>
              <div className="flex items-center gap-2 shrink-0 select-none mt-1 sm:mt-1.5">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] font-bold">
                  {eventName}
                </span>
                <span
                  aria-hidden="true"
                  className="h-3 w-px bg-gray-200 dark:bg-gray-700"
                />
                <button
                  type="button"
                  title="Copy Challenge Markdown"
                  onClick={handleCopyChallengeMarkdown}
                  className="flex items-center justify-center h-7 min-w-[28px] px-1.5 rounded-lg bg-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all duration-200 dark:hover:bg-gray-800/60 dark:text-gray-400 dark:hover:text-gray-200 shrink-0"
                >
                  {copiedMarkdown ? (
                    <Check size={14} className="shrink-0 text-emerald-500 dark:text-emerald-400" />
                  ) : (
                    <ClipboardCopy size={14} className="shrink-0" />
                  )}
                </button>
              </div>
            </div>

            {/* ROW 2: Metadata & Points */}
            <div className={`flex flex-wrap items-center justify-between gap-y-2 border-b pb-4 ${categoryBorderColor}`}>
              <div className="flex flex-wrap items-center gap-3">
                {/* Category Badge */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const parts = (challenge.category || '').split('/');
                    const parent = parts[0];
                    const sub = parts.slice(1).join('/');
                    return (
                      <div className="flex items-center gap-2">
                        <div className={`select-none text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${categoryBadgeColor} ${categoryBorderColor}`}>
                          {parent}
                        </div>
                        {sub && (
                          <>
                            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-600 select-none">
                              /
                            </span>
                            <div className={`select-none text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-dashed ${categoryBorderColor} ${categoryIconColor} bg-opacity-5`}>
                              {sub}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}


                </div>

                {/* Difficulty & Features */}
                <div className="select-none flex items-center gap-2">
                  <span className={`text-[11px] font-bold tracking-wide px-2 py-0.5 rounded border ${diffBadgeColor}`}>
                    {normalizedDiff}
                  </span>

                  {featureType !== 'N' && (
                    <>
                      <div className="w-[1px] h-3.5 bg-gray-300 dark:bg-gray-700 select-none" />
                      <div className="flex items-center gap-2">
                        {featureType.includes('T') && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">
                            <ListChecks size={12} className="shrink-0" />
                            Tasks
                          </span>
                        )}
                        {featureType.includes('S') && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
                            <Server size={12} className="shrink-0" />
                            Services
                          </span>
                        )}
                        {featureType.includes('F') && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">
                            <Key size={12} className="shrink-0" />
                            Placeholder
                          </span>
                        )}
                        {featureType.includes('G') && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded border border-rose-500/20">
                            <MapPin size={12} className="shrink-0" />
                            Location
                          </span>
                        )}
                      </div>
                    </>
                  )}
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
            onTabChange={handleTabChange}
          />
        </div>

        {/* Scrollable Content Area */}
        <div
          ref={contentScrollRef}
          className={`flex-1 overscroll-contain px-4 md:px-6 scroll-hidden [overflow-anchor:none] flex flex-col ${challengeTab === 'geo_answer' ? 'overflow-hidden pb-0' : 'overflow-y-auto pb-2'
            }`}
        >
          {challengeTab === 'challenge' && (
            <div className="min-h-full flex flex-col pb-5">
              {/* Description at the Top */}
              <div className="flex-1">
                <div className="max-w-full overflow-x-auto break-words mt-2">
                  <ChallengeDescription description={challenge.description} />
                </div>
              </div>

              {/* Links, Tasks, and Hints at the Bottom (before flag form) */}
              <div className="mt-5 space-y-6">
                <ChallengeServicesPanel open={open} services={services} />

                <ChallengeAttachments
                  challenge={challenge}
                  downloading={downloading}
                  downloadFile={downloadFile}
                />

                {showQuestionTab && (
                  <ChallengeTasksTeaser
                    challengeId={challenge.id}
                    onTabChange={handleTabChange}
                  />
                )}

                <ChallengeHints
                  challenge={challenge}
                  setShowHintModal={setShowHintModal}
                />
              </div>
            </div>
          )}

          {challengeTab === 'geo_answer' && (
            <div className="flex-1 w-full h-full flex flex-col">
              <GeoMapPanel
                challenge={challenge}
                geoGuesses={geoGuesses}
                geoFeedback={geoFeedback}
                geoSubmitting={geoSubmitting}
                geoSubmissionsRemaining={geoSubmissionsRemaining}
                geoCooldownSeconds={geoCooldownSeconds}
                isRevealed={!!geoRevealed[challenge.id]}
                revealCardOpen={!!geoRevealCardOpen[challenge.id]}
                setRevealCardOpen={(open) => setGeoRevealCardOpen(prev => ({ ...prev, [challenge.id]: open }))}
                onTargetLoaded={handleGeoTargetLoaded}
                onReveal={handleRevealGeo}
                handleGeoSubmit={handleGeoSubmit}
                handleGeoGuessChange={handleGeoGuessChange}
              />
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
        {challengeTab === 'challenge' && !challenge.has_geo_flag && (
          <ChallengeFooter
            challenge={challenge}
            flagInputs={flagInputs}
            placeholders={placeholders}
            submitting={submitting}
            flagFeedback={flagFeedback}
            handleFlagInputChange={handleFlagInputChange}
            handleFlagSubmit={handleFlagSubmit}
            submissionsRemaining={submissionsRemaining}
            cooldownSeconds={cooldownSeconds}
          />
        )}

        {challengeTab === 'challenge' && challenge.has_geo_flag && (
          <ChallengeGeoTeaserFooter
            onGoToMap={() => handleTabChange('geo_answer', challenge.id)}
          />
        )}

        {challengeTab === 'geo_answer' && (
          <GeoFooter
            currentGuess={geoGuesses[challenge.id] || null}
            submitting={geoSubmitting[challenge.id] || false}
            geoCooldownSeconds={geoCooldownSeconds}
            geoSubmissionsRemaining={geoSubmissionsRemaining}
            isSolved={!!challenge.is_solved}
            isTeamSolved={!!challenge.is_team_solved}
            isRevealed={!!geoRevealed[challenge.id]}
            isRevealCardOpen={!!geoRevealCardOpen[challenge.id]}
            target={geoTargets[challenge.id] || null}
            onSubmit={async () => {
              const currentGuess = geoGuesses[challenge.id]
              if (currentGuess) {
                const success = await handleGeoSubmit(challenge.id, currentGuess, challenge.geo_prefix || '')
                if (success) {
                  // Auto-reveal answer on correct submission
                  setGeoRevealed(prev => ({ ...prev, [challenge.id]: true }))
                  setGeoRevealCardOpen(prev => ({ ...prev, [challenge.id]: true }))
                }
              }
            }}
          />
        )}

        {challengeTab === 'question' && challenge && (
          <QuestionFooter
            subChallengeCompleted={subChallengeCompleted}
            subChallengeFlag={subChallengeFlag}
            onReset={onSubChallengeReset}
            onSubmitFlag={subChallengeFlag ? async () => {
              setChallengeTab('challenge', challenge.id)
              handleFlagInputChange(challenge.id, subChallengeFlag)
              await handleFlagSubmit(challenge.id, subChallengeFlag)
            } : undefined}
            submittingFlag={submitting[challenge.id] || false}
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
