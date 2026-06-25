import React from 'react'
import { DialogFooterLayout } from './DialogFooterLayout'
import { MapPin } from 'lucide-react'
import type { GeoCoordinates } from '../../../types'

interface GeoFooterProps {
  currentGuess: GeoCoordinates | null
  submitting: boolean
  geoCooldownSeconds: number
  geoSubmissionsRemaining: number
  isSolved: boolean
  isTeamSolved: boolean
  isRevealed: boolean
  isRevealCardOpen: boolean
  target: { lat: number; lng: number; radius_km: number; flag?: string } | null
  onSubmit: () => void
}

export const GeoFooter: React.FC<GeoFooterProps> = ({
  currentGuess,
  submitting,
  geoCooldownSeconds,
  geoSubmissionsRemaining,
  isSolved,
  isTeamSolved,
  isRevealed,
  isRevealCardOpen,
  target,
  onSubmit,
}) => {
  return (
    <DialogFooterLayout>
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <MapPin size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 font-sans">
              Selected Coordinates
            </span>
            {currentGuess ? (
              <span className="text-xs font-mono text-gray-800 dark:text-gray-200 truncate mt-0.5">
                {currentGuess.lat.toFixed(6)}, {currentGuess.lng.toFixed(6)}
              </span>
            ) : (
              <span className="text-xs text-gray-400 dark:text-gray-600 italic mt-0.5">
                Click on the map to place your pin
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500 shrink-0 hidden sm:block">
            {geoSubmissionsRemaining}/10
          </span>
          <button
            onClick={onSubmit}
            disabled={!currentGuess || submitting || geoCooldownSeconds > 0 || (isRevealed && isRevealCardOpen)}
            className={`flex h-[38px] min-w-[96px] px-5 select-none items-center justify-center rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 disabled:opacity-30
              ${geoCooldownSeconds > 0
                ? 'bg-red-600 hover:bg-red-600 cursor-not-allowed shadow-red-500/10'
                : 'bg-blue-600 shadow-blue-500/20 hover:bg-blue-500 hover:shadow-blue-500/30'}
            `}
          >
            {submitting ? (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:-0.3s]"></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:-0.15s]"></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white"></span>
              </span>
            ) : geoCooldownSeconds > 0 ? (
              `${geoCooldownSeconds}s`
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </div>
    </DialogFooterLayout>
  )
}
