import React from 'react'
import { Label, Input, Textarea, Button } from '@/shared/ui'
import { MarkdownRenderer } from '@/shared/markdown/MarkdownRenderer'
import { Flag as FlagIcon, Zap, Type } from 'lucide-react'
import { ChallengeFormData } from '../../types'
import { cn } from '@/shared/lib/utils'
import {
  ADMIN_INPUT_CLASS,
  ADMIN_MUTED_INPUT_CLASS,
  ADMIN_TEXTAREA_CLASS,
} from '@/features/admin/ui/form-field-styles'

interface ContentSectionProps {
  formData: ChallengeFormData
  onChange: (data: ChallengeFormData) => void
  showPreview: boolean
  setShowPreview: (v: boolean) => void
  flagLoading: boolean
  handleViewFlag: () => void
  editing: boolean
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  formData,
  onChange,
  showPreview,
  setShowPreview,
  flagLoading,
  handleViewFlag,
  editing
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="md:col-span-2">
        <div className="flex items-center justify-between">
          <Label>Deskripsi</Label>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>{showPreview ? 'Edit' : 'Preview'}</Button>
        </div>
        {showPreview ? (
          <div className="border rounded p-3 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            <MarkdownRenderer content={formData.description || '*No description provided*'} />
          </div>
        ) : (
          <Textarea required rows={5} value={formData.description} onChange={e => onChange({ ...formData, description: e.target.value })} className={ADMIN_TEXTAREA_CLASS} />
        )}
      </div>
      <div className="md:col-span-2">
        <Label>Flag</Label>
        <div className="flex gap-2 pointer-events-auto items-center">
          <Input
            required={!editing}
            value={formData.flag}
            onChange={e => onChange({ ...formData, flag: e.target.value })}
            placeholder={editing ? 'Leave blank to keep current' : 'ctf{...}'}
            className={ADMIN_INPUT_CLASS}
          />
          <div className="flex items-center gap-1 border-l pl-2 dark:border-gray-700">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange({ ...formData, flag_placeholder: !formData.flag_placeholder })}
              className={cn(
                "h-8 px-2 flex items-center gap-1.5 transition-all rounded-md",
                formData.flag_placeholder
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                  : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 border border-transparent"
              )}
              title={formData.flag_placeholder ? "Using Flag Placeholder" : "Using Static Flag"}
            >
              {formData.flag_placeholder ? <Zap size={14} className="fill-current" /> : <Type size={14} />}
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                {formData.flag_placeholder ? "Placeholder" : "Static"}
              </span>
            </Button>
            <Button
              aria-label="Show flag"
              title="Show flag"
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleViewFlag()}
              disabled={flagLoading || (!editing && !formData.flag)}
              className="flex-none pointer-events-auto text-gray-800 dark:text-gray-200 h-8 w-8"
            >
              {flagLoading ? <span className="animate-pulse">…</span> : <FlagIcon size={18} />}
            </Button>
          </div>
        </div>
      </div>
      <div className="md:col-span-2">
        <div className="flex items-center justify-between">
          <Label>NXCTL Services</Label>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...formData, services: [...formData.services, ''] })}>+ Add Service</Button>
        </div>
        {formData.services.length === 0 && <p className="text-xs text-muted-foreground">No CTFC services added</p>}
        <div className="space-y-2 mt-2">
          {formData.services.map((name, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input value={name} onChange={e => {
                const next = [...formData.services];
                next[idx] = e.target.value;
                onChange({ ...formData, services: next });
              }} placeholder="service-name" className={ADMIN_MUTED_INPUT_CLASS} />
              <Button type="button" variant="ghost" onClick={() => onChange({ ...formData, services: formData.services.filter((_, i) => i !== idx) })}>✕</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
