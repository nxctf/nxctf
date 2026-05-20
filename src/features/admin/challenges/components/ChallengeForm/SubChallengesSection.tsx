import React, { useState } from 'react'
import { Label, Input, Textarea, Button, Switch } from '@/shared/ui'
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react'
import { SubChallengeFormRow } from '../../types'
import { MarkdownRenderer } from '@/shared/markdown/MarkdownRenderer'
import { ADMIN_MUTED_INPUT_CLASS } from '@/features/admin/ui/form-field-styles'

interface SubChallengesSectionProps {
  subChallenges: SubChallengeFormRow[]
  subChallengesSequential: boolean
  onAdd: () => void
  onUpdate: (i: number, field: keyof SubChallengeFormRow, value: any) => void
  onRemove: (i: number) => void
  onReorder: (from: number, to: number) => void
  onToggleSequential: (v: boolean) => void
  questionPreviewRows: Record<number, boolean>
  setQuestionPreviewRows: React.Dispatch<React.SetStateAction<Record<number, boolean>>>
  normalizeQuestionMarkdown: (v: string) => string
}

export const SubChallengesSection: React.FC<SubChallengesSectionProps> = ({
  subChallenges,
  subChallengesSequential,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
  onToggleSequential,
  questionPreviewRows,
  setQuestionPreviewRows,
  normalizeQuestionMarkdown
}) => {
  const [draggedSubChallengeIndex, setDraggedSubChallengeIndex] = useState<number | null>(null)

  return (
    <div className="md:col-span-2 space-y-3 rounded-md border border-gray-200 dark:border-gray-700 p-3 bg-gray-50/70 dark:bg-gray-800/40">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Label className="text-sm font-semibold">Sub-Challenges</Label>
        <div className="flex items-center gap-2">
          <Label className="flex items-center gap-2 text-sm">
            <Switch
              checked={subChallengesSequential}
              onCheckedChange={onToggleSequential}
              className="mr-1 data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500 bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-500 transition-colors"
            />
            Sequential
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="gap-1"
          >
            <Plus size={14} />
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {subChallenges.length === 0 && (
          <p className="text-xs text-muted-foreground">No sub-challenges yet.</p>
        )}

        {subChallenges.map((row, idx) => (
          <div
            key={row.id || idx}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              if (draggedSubChallengeIndex === null) return
              onReorder(draggedSubChallengeIndex, idx)
              setDraggedSubChallengeIndex(null)
            }}
            className={`grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-start rounded-md border bg-white dark:bg-gray-900 p-3 transition ${draggedSubChallengeIndex === idx
              ? 'border-primary-400 opacity-70'
              : 'border-gray-200 dark:border-gray-700'
              }`}
          >
            <div className="flex items-center gap-2 md:w-12 md:flex-col md:items-center md:gap-1 md:pt-4 md:self-start">
              <span className="min-w-8 rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-center text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 md:w-full">
                #{idx + 1}
              </span>
              <button
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move'
                  setDraggedSubChallengeIndex(idx)
                }}
                onDragEnd={() => setDraggedSubChallengeIndex(null)}
                className="cursor-grab rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing dark:hover:bg-gray-800 dark:hover:text-gray-200"
                title="Drag"
                aria-label="Drag sub-challenge"
              >
                <GripVertical size={16} />
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onReorder(idx, idx - 1)}
                disabled={idx === 0}
              >
                <ChevronUp size={15} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onReorder(idx, idx + 1)}
                disabled={idx === subChallenges.length - 1}
              >
                <ChevronDown size={15} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemove(idx)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 size={15} />
              </Button>
            </div>

            <div className="space-y-3 min-w-0">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs">Question</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuestionPreviewRows(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    className="h-6 px-2 text-[10px]"
                  >
                    {questionPreviewRows[idx] ? 'Edit' : 'Preview'}
                  </Button>
                </div>
                {questionPreviewRows[idx] ? (
                  <div className="mt-1 rounded-md border border-gray-200 bg-gray-50 p-2 text-sm dark:border-gray-700 dark:bg-gray-800/70">
                    <div className="max-w-full overflow-hidden break-words text-sm font-semibold [&_p]:m-0 [&_p]:text-sm [&_p]:leading-snug [&_ul]:my-0 [&_ol]:my-0 [&_li]:my-0">
                      <MarkdownRenderer content={normalizeQuestionMarkdown(row.question || '*No question yet*')} className="max-w-full break-words" />
                    </div>
                  </div>
                ) : (
                  <Textarea
                    required
                    rows={3}
                    value={row.question}
                    onChange={e => onUpdate(idx, 'question', e.target.value)}
                    placeholder="Question text, markdown supported"
                    className={`mt-1 h-24 min-h-21 resize-none overflow-y-auto ${ADMIN_MUTED_INPUT_CLASS}`}
                  />
                )}
              </div>

              <div>
                <Label className="text-xs">Answer</Label>
                <Input
                  required
                  value={row.answer}
                  onChange={e => onUpdate(idx, 'answer', e.target.value)}
                  placeholder="Plaintext answer"
                  className={ADMIN_MUTED_INPUT_CLASS}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
