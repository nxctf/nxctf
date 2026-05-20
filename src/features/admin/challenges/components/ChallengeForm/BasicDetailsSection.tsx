import React from 'react'
import { Label, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '@/shared/ui'
import { ChallengeFormData, Event } from '../../types'
import APP from '@/config'
import {
  ADMIN_INPUT_CLASS,
  ADMIN_SELECT_CONTENT_CLASS,
  ADMIN_SELECT_TRIGGER_CLASS,
} from '@/features/admin/ui/form-field-styles'

interface BasicDetailsSectionProps {
  formData: ChallengeFormData
  onChange: (data: ChallengeFormData) => void
  events?: Event[]
  categories: string[]
  hideMainEventOption?: boolean
}

export const BasicDetailsSection: React.FC<BasicDetailsSectionProps> = ({
  formData,
  onChange,
  events,
  categories,
  hideMainEventOption
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Top row: Switches */}
      <div className="md:col-span-2 flex items-center gap-4">
        <Label className="flex items-center gap-2">
          <Switch
            checked={formData.is_active !== false}
            onCheckedChange={v => onChange({ ...formData, is_active: v })}
            className="mr-2 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-500 transition-colors"
          />
          Active
        </Label>
        <Label className="flex items-center gap-2">
          <Switch
            checked={!!formData.is_maintenance}
            onCheckedChange={v => onChange({ ...formData, is_maintenance: v })}
            className="mr-2 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-500 transition-colors"
          />
          Maintenance
        </Label>
      </div>

      {/* Row 1: Title & Category */}
      <div>
        <Label>Title</Label>
        <Input
          required
          value={formData.title}
          onChange={e => onChange({ ...formData, title: e.target.value })}
          className={ADMIN_INPUT_CLASS}
        />
      </div>
      <div>
        <Label>Category</Label>
        <Select value={formData.category} onValueChange={v => onChange({ ...formData, category: v })}>
          <SelectTrigger className={ADMIN_SELECT_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
          <SelectContent className={ADMIN_SELECT_CONTENT_CLASS}>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Event & Difficulty */}
      {events && (
        <div>
          <Label>Event</Label>
          <Select
            value={formData.event_id ?? '__main__'}
            onValueChange={v => onChange({ ...formData, event_id: v === '__main__' ? null : v })}
          >
            <SelectTrigger className={ADMIN_SELECT_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
            <SelectContent className={ADMIN_SELECT_CONTENT_CLASS}>
              {!hideMainEventOption && (
                <SelectItem value="__main__">{String(APP.eventMainLabel || 'Main')}</SelectItem>
              )}
              {events.map((evt: Event) => (
                <SelectItem key={evt.id} value={evt.id}>{String(evt?.name ?? 'Untitled')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label className="mb-1">Difficulty</Label>
        <Select value={formData.difficulty} onValueChange={v => onChange({ ...formData, difficulty: v })}>
          <SelectTrigger className={ADMIN_SELECT_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
          <SelectContent className={ADMIN_SELECT_CONTENT_CLASS}>
            {Object.keys(APP.difficultyStyles || {}).map(key => {
              const label = key.charAt(0).toUpperCase() + key.slice(1)
              return <SelectItem key={key} value={label}>{label}</SelectItem>
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
