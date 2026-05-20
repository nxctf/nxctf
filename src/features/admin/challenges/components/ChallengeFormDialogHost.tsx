import React from 'react'
import { AnimatePresence } from 'framer-motion'
import ChallengeFormDialog from './ChallengeFormDialog'
import type { useChallengeForm } from '../hooks/useChallengeForm'
import type { Event } from '../types'

type ChallengeFormController = ReturnType<typeof useChallengeForm>

interface ChallengeFormDialogHostProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challengeForm: ChallengeFormController
  categories: string[]
  events: Event[]
  hideMainEventOption: boolean
  onSubmitSuccess: () => void
}

const ChallengeFormDialogHost: React.FC<ChallengeFormDialogHostProps> = ({
  open,
  onOpenChange,
  challengeForm,
  categories,
  events,
  hideMainEventOption,
  onSubmitSuccess,
}) => {
  const {
    formData,
    setFormData,
    editing,
    subChallenges,
    subChallengesSequential,
    setSubChallengesSequential,
    submitting,
    showPreview,
    setShowPreview,
    resetForm,
    handleSubmit,
    subChallengeOps,
    hintOps,
    attachmentOps,
    flagLoading,
    handleViewFlag,
    questionPreviewRows,
    setQuestionPreviewRows,
    normalizeQuestionMarkdown,
  } = challengeForm

  const handleFormSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const success = await handleSubmit()
    if (success) {
      onOpenChange(false)
      onSubmitSuccess()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <ChallengeFormDialog
          open={open}
          editing={editing}
          formData={formData}
          submitting={submitting}
          showPreview={showPreview}
          onOpenChange={value => { onOpenChange(value); if (!value) resetForm() }}
          onSubmit={handleFormSubmit}
          onChange={setFormData}
          onAddHint={hintOps.add}
          onUpdateHint={hintOps.update}
          onRemoveHint={hintOps.remove}
          onAddAttachment={attachmentOps.add}
          onUpdateAttachment={attachmentOps.update}
          onRemoveAttachment={attachmentOps.remove}
          subChallenges={subChallenges}
          subChallengesSequential={subChallengesSequential}
          onAddSubChallenge={subChallengeOps.add}
          onUpdateSubChallenge={subChallengeOps.update}
          onRemoveSubChallenge={subChallengeOps.remove}
          onReorderSubChallenge={subChallengeOps.reorder}
          onToggleSequential={setSubChallengesSequential}
          setShowPreview={setShowPreview}
          categories={categories}
          events={events}
          hideMainEventOption={hideMainEventOption}
          flagLoading={flagLoading}
          handleViewFlag={handleViewFlag}
          questionPreviewRows={questionPreviewRows}
          setQuestionPreviewRows={setQuestionPreviewRows}
          normalizeQuestionMarkdown={normalizeQuestionMarkdown}
        />
      )}
    </AnimatePresence>
  )
}

export default ChallengeFormDialogHost
