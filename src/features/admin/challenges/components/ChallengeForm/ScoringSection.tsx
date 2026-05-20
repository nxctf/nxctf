import React from 'react'
import { Label, Input, Switch } from '@/shared/ui'
import { ChallengeFormData } from '../../types'
import { ADMIN_INPUT_CLASS } from '@/features/admin/ui/form-field-styles'

interface ScoringSectionProps {
  formData: ChallengeFormData
  onChange: (data: ChallengeFormData) => void
}

export const ScoringSection: React.FC<ScoringSectionProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <Label>{formData.is_dynamic ? 'Max Points' : 'Points'}</Label>
          <Input
            type="number"
            required
            min={0}
            value={formData.is_dynamic ? (formData.max_points ?? '') : (formData.points ?? '')}
            onChange={e => {
              let val = e.target.value.replace(/^0+(?=\d)/, '');
              if (val === '') {
                onChange({ ...formData, points: '', max_points: '' });
              } else {
                const n = Number(val);
                onChange({ ...formData, points: n, max_points: n });
              }
            }}
            placeholder={formData.is_dynamic ? 'Nilai awal' : 'Points'}
            className={ADMIN_INPUT_CLASS}
          />
        </div>
        <div className="flex items-center pb-2">
          <Label className="flex items-center gap-2 cursor-pointer">
            <Switch
              checked={!!formData.is_dynamic}
              onCheckedChange={v => {
                if (v) {
                  onChange({ ...formData, is_dynamic: true, max_points: formData.points ?? '' });
                } else {
                  onChange({ ...formData, is_dynamic: false, points: formData.max_points ?? '' });
                }
              }}
              className="data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500 bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-500 transition-colors"
            />
            <span className="text-sm font-medium">Dynamic Score</span>
          </Label>
        </div>
      </div>

      {formData.is_dynamic && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="min_points" className="mb-1 text-xs">Min Points</Label>
            <Input
              id="min_points"
              type="number"
              min={0}
              value={formData.min_points === undefined || formData.min_points === null ? '' : formData.min_points}
              onChange={e => {
                let val = e.target.value.replace(/^0+(?=\d)/, '');
                let maxVal = (formData.max_points === undefined || formData.max_points === null || formData.max_points === '') ? 0 : Number(formData.max_points);
                if (val === '') {
                  onChange({ ...formData, min_points: '' });
                } else {
                  let minVal = Number(val);
                  if (minVal > maxVal) minVal = maxVal;
                  onChange({ ...formData, min_points: minVal });
                }
              }}
              className={ADMIN_INPUT_CLASS}
              placeholder="Batas minimum"
            />
            {formData.max_points !== '' && Number(formData.min_points) > Number(formData.max_points) && (
              <p className="text-xs text-red-500 mt-1">Min Points tidak boleh lebih dari Max Points</p>
            )}
          </div>
          <div>
            <Label htmlFor="decay_per_solve" className="mb-1 text-xs">Decay/Solve</Label>
            <Input
              id="decay_per_solve"
              type="number"
              min={0}
              value={formData.decay_per_solve === undefined || formData.decay_per_solve === null ? '' : formData.decay_per_solve}
              onChange={e => {
                let val = e.target.value.replace(/^0+(?=\d)/, '');
                if (val === '') {
                  onChange({ ...formData, decay_per_solve: '' });
                } else {
                  onChange({ ...formData, decay_per_solve: Number(val) });
                }
              }}
              className={ADMIN_INPUT_CLASS}
              placeholder="Turun tiap solve"
            />
          </div>
        </div>
      )}
    </div>
  )
}
