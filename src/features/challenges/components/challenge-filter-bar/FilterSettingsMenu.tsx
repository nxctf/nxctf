'use client'

import { RotateCcw, Settings } from 'lucide-react'

import { Switch } from '@/shared/ui'
import { setChallengeGuideSeenSetting } from '@/shared/lib/settings'
import {
  CHALLENGE_TOUR_RESTART_EVENT,
  CHALLENGE_TOUR_VERSION,
} from '../../lib/challenge-tour-steps'
import type { ChallengeFilterSettings } from '../../types'

type FilterSettingsMenuProps = {
  open: boolean
  settings: ChallengeFilterSettings
  onOpenChange: (open: boolean) => void
  onSettingsChange: (settings: ChallengeFilterSettings) => void
}

export default function FilterSettingsMenu({
  open,
  settings,
  onOpenChange,
  onSettingsChange,
}: FilterSettingsMenuProps) {
  const handleRestartTour = () => {
    setChallengeGuideSeenSetting(false, CHALLENGE_TOUR_VERSION)
    window.dispatchEvent(new Event(CHALLENGE_TOUR_RESTART_EVENT))
    onOpenChange(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        data-tour="challenge-filter-settings"
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${open
          ? 'border-blue-600 bg-blue-600 text-white shadow-inner dark:bg-blue-600 dark:border-blue-600'
          : 'bg-background border border-input text-foreground caret-transparent hover:border-ring/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 transition-all'
          }`}
        aria-label="Open filter settings"
      >
        <Settings size={16} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-3 z-40">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Hide maintenance</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Exclude maintenance challenges</p>
            </div>
            <Switch
              checked={settings.hideMaintenance}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, hideMaintenance: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Hide solved Intro</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Exclude completed intro tasks</p>
            </div>
            <Switch
              checked={settings.hideSolvedIntro}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, hideSolvedIntro: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Team solve highlight</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Purple cards for team solves</p>
            </div>
            <Switch
              checked={settings.highlightTeamSolves}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, highlightTeamSolves: checked })
              }
            />
          </div>

          <div className="mt-2 border-t border-gray-200 pt-3 dark:border-gray-800">
            <button
              type="button"
              onClick={handleRestartTour}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-blue-500/20 bg-blue-600/10 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white"
            >
              <RotateCcw size={15} />
              Reset tutorial
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
