import React from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  AppTabs,
} from '@/shared/ui'
import { DIALOG_FORM_CONTENT_CLASS } from "@/shared/styles"
import { cn } from '@/shared/lib/utils'
import { Attachment, Challenge, ChallengeFormData, Event, SubChallengeFormRow } from '../types'
import { BasicDetailsSection } from './ChallengeForm/BasicDetailsSection'
import { ScoringSection } from './ChallengeForm/ScoringSection'
import { ContentSection } from './ChallengeForm/ContentSection'
import { HintsAttachmentsSection } from './ChallengeForm/HintsAttachmentsSection'
import { ChallengeServicesSection } from './ChallengeForm/ChallengeServicesSection'
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
  onUpdateSubChallenge: (i: number, field: keyof SubChallengeFormRow, value: any) => void
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
  initialTab?: 'general' | 'additional' | 'subquestions'
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

  const [activeFormTab, setActiveFormTab] = React.useState<'general' | 'additional' | 'subquestions'>(props.initialTab || 'general')

  React.useEffect(() => {
    if (open) {
      setActiveFormTab(props.initialTab || 'general')
    }
  }, [open, props.initialTab])

  const tabItems = [
    { value: 'general' as const, label: 'General Info' },
    { value: 'additional' as const, label: 'Additional Info' },
    { value: 'subquestions' as const, label: 'Sub Questions' },
  ]

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
          className={cn(DIALOG_FORM_CONTENT_CLASS, "flex flex-col h-[85vh] max-h-[85vh] max-w-3xl p-5 md:p-6")}
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
          }}
        >
          <DialogHeader className="pb-3 border-b dark:border-gray-800 shrink-0">
            <DialogTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">{editing ? 'Edit Challenge' : 'Add New Challenge'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden space-y-4">
            <div className="flex justify-center border-b pb-2 dark:border-gray-800 shrink-0">
              <AppTabs
                items={tabItems}
                value={activeFormTab}
                onValueChange={setActiveFormTab}
                variant="panel"
                stretch
              />
            </div>

            {activeFormTab === 'general' && (
              <div className="flex-1 overflow-y-auto scroll-hidden space-y-4 pr-1">
                <BasicDetailsSection
                  formData={formData}
                  onChange={onChange}
                  events={sortedEvents}
                  categories={categories}
                  hideMainEventOption={hideMainEventOption}
                  isEdit={!!editing}
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
                  challengeId={editing?.id}
                />
              </div>
            )}

            {activeFormTab === 'additional' && (
              <div className="flex-1 overflow-y-auto scroll-hidden space-y-6 pr-1">
                <HintsAttachmentsSection
                  formData={formData}
                  onAddHint={onAddHint}
                  onUpdateHint={onUpdateHint}
                  onRemoveHint={onRemoveHint}
                  onAddAttachment={onAddAttachment}
                  onUpdateAttachment={onUpdateAttachment}
                  onRemoveAttachment={onRemoveAttachment}
                  mode="all"
                />

                <ChallengeServicesSection
                  formData={formData}
                  onChange={onChange}
                />
              </div>
            )}

            {activeFormTab === 'subquestions' && (
              <div className="flex-1 overflow-y-auto scroll-hidden pr-1">
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
              </div>
            )}

            <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 shrink-0 pt-3 border-t dark:border-gray-800">
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
