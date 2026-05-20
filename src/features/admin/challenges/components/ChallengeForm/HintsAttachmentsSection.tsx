import React from 'react'
import {
  Label,
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui'
import {
  ADMIN_MUTED_INPUT_CLASS,
  ADMIN_SELECT_CONTENT_CLASS,
} from '@/features/admin/ui/form-field-styles'
import { Attachment, ChallengeFormData } from '../../types'

interface HintsAttachmentsSectionProps {
  formData: ChallengeFormData
  onAddHint: () => void
  onUpdateHint: (i: number, v: string) => void
  onRemoveHint: (i: number) => void
  onAddAttachment: () => void
  onUpdateAttachment: (i: number, f: keyof Attachment, v: string) => void
  onRemoveAttachment: (i: number) => void
}

export const HintsAttachmentsSection: React.FC<
  HintsAttachmentsSectionProps
> = ({
  formData,
  onAddHint,
  onUpdateHint,
  onRemoveHint,
  onAddAttachment,
  onUpdateAttachment,
  onRemoveAttachment,
}) => {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="md:col-span-2">
        <div className="flex items-center justify-between">
          <Label>Hints</Label>
          <Button type="button" variant="ghost" size="sm" onClick={onAddHint}>
            + Add
          </Button>
        </div>
        {formData.hint.length === 0 ? (
          <p className="text-xs text-muted-foreground">No hints added</p>
        ) : null}
        <div className="mt-2 space-y-2">
          {formData.hint.map((hint, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={hint}
                onChange={(event) => onUpdateHint(index, event.target.value)}
                className={ADMIN_MUTED_INPUT_CLASS}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => onRemoveHint(index)}
              >
                &times;
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="flex items-center justify-between">
          <Label>Attachments</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAddAttachment}
          >
            + Add
          </Button>
        </div>
        <div className="mt-2 space-y-2">
          {formData.attachments.map((attachment, index) => (
            <div
              key={index}
              className="grid grid-cols-12 items-center gap-2"
            >
              <Input
                className={`col-span-3 ${ADMIN_MUTED_INPUT_CLASS}`}
                value={attachment.name}
                onChange={(event) =>
                  onUpdateAttachment(index, 'name', event.target.value)
                }
                placeholder="File name / Label"
                required
              />
              <Input
                className={`col-span-6 ${ADMIN_MUTED_INPUT_CLASS}`}
                value={attachment.url}
                onChange={(event) =>
                  onUpdateAttachment(index, 'url', event.target.value)
                }
                placeholder="URL"
                required
              />
              <Select
                value={attachment.type}
                onValueChange={(value: 'file' | 'link') =>
                  onUpdateAttachment(index, 'type', value)
                }
              >
                <SelectTrigger
                  className={`col-span-2 ${ADMIN_MUTED_INPUT_CLASS}`}
                >
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className={ADMIN_SELECT_CONTENT_CLASS}>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onRemoveAttachment(index)}
                className="col-span-1"
              >
                &times;
              </Button>
            </div>
          ))}
          {formData.attachments.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No attachments added
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
