import React from 'react'
import APP from '@/config'
import { CHALLENGE_DESC_TEMPLATE } from '@/_vars/const'
import { useSystemSettings } from '@/shared/contexts/SystemSettingsContext'
import { Label, Input, Textarea, Button } from '@/shared/ui'
import ConfirmDialog from '@/shared/components/ConfirmDialog'
import { MarkdownRenderer } from '@/shared/markdown/MarkdownRenderer'
import { Flag as FlagIcon, Loader2, Zap, Type, MapPin } from 'lucide-react'
import { ChallengeFormData } from '../../types'
import { cn } from '@/shared/lib/utils'
import { parseGeoFlagClient } from '@/features/challenges/lib'
import { GeoMapSelectorDialog } from '../GeoMapSelectorDialog'
import { getFlag } from '@/shared/lib'
import toast from 'react-hot-toast'
import {
  ADMIN_FORM_FIELD_CLASS,
  ADMIN_INPUT_CLASS,
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
  challengeId?: string
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  formData,
  onChange,
  showPreview,
  setShowPreview,
  flagLoading,
  handleViewFlag,
  editing,
  challengeId,
}) => {
  const { settings } = useSystemSettings()
  const geoDetails = parseGeoFlagClient(formData.flag || '')
  const [isGeoMapOpen, setIsGeoMapOpen] = React.useState(false)
  const [isFetchingGeoFlag, setIsFetchingGeoFlag] = React.useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)

  const resolvedTemplate = CHALLENGE_DESC_TEMPLATE.replace(
    '{{FLAG_FORMAT}}',
    settings.flag_format || 'NXCTF{your_flag_here}'
  )

  const handleGeoMapClick = async () => {
    let currentFlag = formData.flag || ''
    if (!currentFlag && editing && challengeId) {
      try {
        setIsFetchingGeoFlag(true)
        const flag = await getFlag(challengeId)
        if (flag) {
          onChange({ ...formData, flag })
        }
      } catch (err: any) {
        console.error('Failed to fetch flag for geo selector:', err)
        toast.error('Failed to fetch challenge flag')
      } finally {
        setIsFetchingGeoFlag(false)
      }
    }
    setIsGeoMapOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className={ADMIN_FORM_FIELD_CLASS}>
        <div className="flex items-center justify-between">
          <Label>Deskripsi</Label>
          <div className="flex items-center gap-1.5">
            {!showPreview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!formData.description) {
                    onChange({ ...formData, description: resolvedTemplate })
                  } else {
                    setIsConfirmOpen(true)
                  }
                }}
                className="h-8 px-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
              >
                Gunakan Template
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
          </div>
        </div>
        {showPreview ? (
          <div className="border rounded p-3 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            <MarkdownRenderer content={formData.description || '*No description provided*'} />
          </div>
        ) : (
          <Textarea required rows={5} value={formData.description} onChange={e => onChange({ ...formData, description: e.target.value })} className={ADMIN_TEXTAREA_CLASS} />
        )}
      </div>
      <div className={ADMIN_FORM_FIELD_CLASS}>
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
              aria-label="Select Geo Location"
              title="Select Geo Location"
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleGeoMapClick}
              disabled={isFetchingGeoFlag}
              className="flex-none pointer-events-auto text-gray-800 dark:text-gray-200 h-8 w-8"
            >
              {isFetchingGeoFlag ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
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
              {flagLoading ? <Loader2 size={18} className="animate-spin" /> : <FlagIcon size={18} />}
            </Button>
          </div>
        </div>
        {geoDetails && (
          <div className="mt-2 text-xs p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 space-y-1">
            <div className="font-bold flex items-center gap-1.5 font-sans">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              GeoGuessr Challenge Detected
            </div>
            <div className="font-mono text-[11px] grid grid-cols-2 gap-x-4 max-w-sm mt-1">
              <div>Prefix: <span className="font-bold text-gray-900 dark:text-gray-100">{geoDetails.prefix}</span></div>
              <div>Radius: <span className="font-bold text-gray-900 dark:text-gray-100">{geoDetails.radius_km} km</span></div>
              <div>Latitude: <span className="font-bold text-gray-900 dark:text-gray-100">{geoDetails.lat.toFixed(6)}</span></div>
              <div>Longitude: <span className="font-bold text-gray-900 dark:text-gray-100">{geoDetails.lng.toFixed(6)}</span></div>
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Gunakan Template"
        description="Apakah Anda ingin menimpa deskripsi saat ini dengan template?"
        confirmLabel="Ya, Timpa"
        cancelLabel="Batal"
        onConfirm={() => {
          onChange({ ...formData, description: resolvedTemplate })
        }}
      />
      <GeoMapSelectorDialog
        open={isGeoMapOpen}
        onOpenChange={setIsGeoMapOpen}
        initialFlag={formData.flag}
        onConfirm={(newFlag) => onChange({ ...formData, flag: newFlag })}
      />
    </div>
  )
}
