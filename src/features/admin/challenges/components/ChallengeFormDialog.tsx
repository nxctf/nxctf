import React from 'react'
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui'

import { Attachment, Challenge, ChallengeFormData, Event, SubChallengeFormRow } from '../types'
import { BasicDetailsSection } from './ChallengeForm/BasicDetailsSection'
import { ScoringSection } from './ChallengeForm/ScoringSection'
import { ContentSection } from './ChallengeForm/ContentSection'
import { HintsAttachmentsSection } from './ChallengeForm/HintsAttachmentsSection'
import { SubChallengesSection } from './ChallengeForm/SubChallengesSection'

interface ChallengeFormDialogProps {
  open: boolean
  editing: Challenge | null
  formData: ChallengeFormData
  submitting: boolean
  showPreview: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (e?: React.FormEvent) => void
  onChange: (data: ChallengeFormData) => void
  onAddHint: () => void
  onUpdateHint: (i: number, v: string) => void
  onRemoveHint: (i: number) => void
  onAddAttachment: () => void
  onUpdateAttachment: (i: number, field: keyof Attachment, v: string) => void
  onRemoveAttachment: (i: number) => void
  subChallenges: SubChallengeFormRow[]
  subChallengesSequential: boolean
  onAddSubChallenge: () => void
  onUpdateSubChallenge: (i: number, field: keyof SubChallengeFormRow, value: SubChallengeFormRow[keyof SubChallengeFormRow]) => void
  onRemoveSubChallenge: (i: number) => void
  onReorderSubChallenge: (fromIndex: number, toIndex: number) => void
  onToggleSequential: (v: boolean) => void
  setShowPreview: (v: boolean) => void
  categories: string[]
  events?: Event[]
  hideMainEventOption?: boolean
  flagLoading: boolean
  handleViewFlag: () => void
  questionPreviewRows: Record<number, boolean>
  setQuestionPreviewRows: React.Dispatch<React.SetStateAction<Record<number, boolean>>>
  normalizeQuestionMarkdown: (v: string) => string
}

const ChallengeFormDialog: React.FC<ChallengeFormDialogProps> = (props) => {
  const {
    open,
    editing,
    formData,
    submitting,
    showPreview,
    onOpenChange,
    onSubmit,
    onChange,
    onAddHint,
    onUpdateHint,
    onRemoveHint,
    onAddAttachment,
    onUpdateAttachment,
    onRemoveAttachment,
    subChallenges,
    subChallengesSequential,
    onAddSubChallenge,
    onUpdateSubChallenge,
    onRemoveSubChallenge,
    onReorderSubChallenge,
    onToggleSequential,
    setShowPreview,
    categories,
    events,
    hideMainEventOption,
    flagLoading,
    handleViewFlag,
    questionPreviewRows,
    setQuestionPreviewRows,
    normalizeQuestionMarkdown
  } = props

  const sortedEvents = React.useMemo(() => {
    if (!events) return []
    const nowMs = Date.now()
    const getLabel = (evt: Event) => String(evt?.name ?? 'Untitled')
    const getState = (evt: Event) => {
      const start = evt?.start_time ? new Date(evt.start_time).getTime() : null
      const end = evt?.end_time ? new Date(evt.end_time).getTime() : null
      if (!start && !end) return 'permanent' as const
      if (end && nowMs > end) return 'ended' as const
      if (start && nowMs < start) return 'upcoming' as const
      return 'ongoing' as const
    }
    const statePriority: Record<ReturnType<typeof getState>, number> = {
      permanent: 0, ongoing: 1, upcoming: 2, ended: 3,
    }
    const safeTime = (t: number | null) => (typeof t === 'number' && !Number.isNaN(t) ? t : null)
    return [...events].sort((a: Event, b: Event) => {
      const stateA = getState(a); const stateB = getState(b)
      if (stateA !== stateB) return statePriority[stateA] - statePriority[stateB]
      const aStart = safeTime(a?.start_time ? new Date(a.start_time).getTime() : null)
      const bStart = safeTime(b?.start_time ? new Date(b.start_time).getTime() : null)
      const aEnd = safeTime(a?.end_time ? new Date(a.end_time).getTime() : null)
      const bEnd = safeTime(b?.end_time ? new Date(b.end_time).getTime() : null)
      if (stateA === 'permanent') return (aStart ?? 0) - (bStart ?? 0) || getLabel(a).localeCompare(getLabel(b))
      if (stateA === 'ongoing') return (aEnd ?? Infinity) - (bEnd ?? Infinity) || getLabel(a).localeCompare(getLabel(b))
      if (stateA === 'upcoming') return (aStart ?? Infinity) - (bStart ?? Infinity) || getLabel(a).localeCompare(getLabel(b))
      if (stateA === 'ended') return (bEnd ?? 0) - (aEnd ?? 0) || getLabel(a).localeCompare(getLabel(b))
      return 0
    })
  }, [events])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={'w-[calc(100vw-32px)] sm:w-full fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-3xl bg-card border border-border text-card-foreground rounded-2xl p-4 md:p-8 max-h-[85dvh] overflow-y-auto scroll-hidden'}
        >
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">{editing ? 'Edit Challenge' : 'Add New Challenge'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <BasicDetailsSection
              formData={formData}
              onChange={onChange}
              events={sortedEvents}
              categories={categories}
              hideMainEventOption={hideMainEventOption}
            />

            <ScoringSection
              formData={formData}
              onChange={onChange}
            />

            <ContentSection
              formData={formData}
              onChange={onChange}
              showPreview={showPreview}
              setShowPreview={setShowPreview}
              flagLoading={flagLoading}
              handleViewFlag={handleViewFlag}
              editing={!!editing}
            />

            <HintsAttachmentsSection
              formData={formData}
              onAddHint={onAddHint}
              onUpdateHint={onUpdateHint}
              onRemoveHint={onRemoveHint}
              onAddAttachment={onAddAttachment}
              onUpdateAttachment={onUpdateAttachment}
              onRemoveAttachment={onRemoveAttachment}
            />

            <SubChallengesSection
              subChallenges={subChallenges}
              subChallengesSequential={subChallengesSequential}
              onAdd={onAddSubChallenge}
              onUpdate={onUpdateSubChallenge}
              onRemove={onRemoveSubChallenge}
              onReorder={onReorderSubChallenge}
              onToggleSequential={onToggleSequential}
              questionPreviewRows={questionPreviewRows}
              setQuestionPreviewRows={setQuestionPreviewRows}
              normalizeQuestionMarkdown={normalizeQuestionMarkdown}
            />

            <DialogFooter className="flex flex-row items-center justify-end gap-2 sticky bottom-0 z-10 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-600 dark:text-white dark:hover:bg-primary-700"
              >
                {submitting ? 'Saving...' : (editing ? 'Update' : 'Add')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </>
  )
}

export default ChallengeFormDialog
