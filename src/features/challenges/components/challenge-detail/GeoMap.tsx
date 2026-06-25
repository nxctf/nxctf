'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Marker, Popup, Circle, useMapEvents, useMap, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { ChallengeWithSolve } from '@/shared/types'
import type { GeoCoordinates } from '../../types'
import { getGeoChallengeTarget } from '@/shared/lib'
import { BaseMap, guessIcon, targetIcon } from '@/shared/components/BaseMap'
import { Copy, Eye, EyeOff, Minus, Plus, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'

type GeoMapProps = {
  challenge: ChallengeWithSolve
  geoGuesses: Record<string, GeoCoordinates | null>
  geoFeedback: Record<string, { success: boolean; message: string; distance_km?: number } | null>
  geoSubmitting: Record<string, boolean>
  geoSubmissionsRemaining: number
  geoCooldownSeconds: number
  isRevealed: boolean
  revealCardOpen: boolean
  setRevealCardOpen: (open: boolean) => void
  onTargetLoaded?: (target: { lat: number; lng: number; radius_km: number; flag?: string }) => void
  onReveal?: () => void
  handleGeoSubmit: (challengeId: string, coords: GeoCoordinates, prefix: string) => void
  handleGeoGuessChange: (challengeId: string, coords: GeoCoordinates | null) => void
}

function MapClickEvents({ onMapClick, disabled }: { onMapClick: (coords: L.LatLng) => void; disabled: boolean }) {
  useMapEvents({
    click(e) { if (!disabled) onMapClick(e.latlng) },
  })
  return null
}

function MapMovementTracker({ onMovementChange }: { onMovementChange: (moving: boolean) => void }) {
  useMapEvents({
    movestart() { onMovementChange(true) },
    moveend() { onMovementChange(false) },
  })
  return null
}

function MapFocusController({
  showTarget, targetCoords, currentGuess,
}: {
  showTarget: boolean
  targetCoords: { lat: number; lng: number } | null
  currentGuess: { lat: number; lng: number } | null
}) {
  const map = useMap()
  useEffect(() => {
    if (showTarget && targetCoords) {
      const timer = setTimeout(() => {
        const targetLatLng = L.latLng(targetCoords.lat, targetCoords.lng)
        const currentBounds = map.getBounds()
        const isTargetInView = currentBounds.contains(targetLatLng)
        const isGuessInView = currentGuess
          ? currentBounds.contains(L.latLng(currentGuess.lat, currentGuess.lng))
          : true
        const duration = (isTargetInView && isGuessInView) ? 0.4 : 0.8
        if (currentGuess) {
          map.flyToBounds(
            L.latLngBounds([[currentGuess.lat, currentGuess.lng], [targetCoords.lat, targetCoords.lng]]),
            { padding: [50, 50], duration }
          )
        } else {
          map.flyTo(targetLatLng, 13, { duration })
        }
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [showTarget, targetCoords, currentGuess, map])
  return null
}

function FlyToController({ searchResult }: { searchResult: { lat: number; lng: number; zoom: number } | null }) {
  const map = useMap()
  useEffect(() => {
    if (searchResult) map.flyTo([searchResult.lat, searchResult.lng], searchResult.zoom, { duration: 0.8 })
  }, [searchResult, map])
  return null
}

// Expose the map instance to a ref so we can call zoomIn/zoomOut from outside BaseMap
function MapRefGetter({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap()
  useEffect(() => { mapRef.current = map }, [map])
  return null
}

function parseCoords(input: string): [number, number] | null {
  const match = input.trim().match(/^(-?\d+(?:\.\d+)?)[,\s;]+(-?\d+(?:\.\d+)?)$/)
  if (match) {
    const lat = parseFloat(match[1])
    const lng = parseFloat(match[2])
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return [lat, lng]
  }
  return null
}

export default function GeoMap({
  challenge,
  geoGuesses,
  geoFeedback,
  geoSubmitting,
  geoSubmissionsRemaining,
  geoCooldownSeconds,
  isRevealed,
  revealCardOpen,
  setRevealCardOpen,
  onTargetLoaded,
  onReveal,
  handleGeoSubmit,
  handleGeoGuessChange,
}: GeoMapProps) {
  const currentGuess = geoGuesses[challenge.id] || null
  const feedback = geoFeedback[challenge.id] || null
  const submitting = geoSubmitting[challenge.id] || false
  const isSolved = challenge.is_solved || false

  const [targetCoords, setTargetCoords] = useState<{ lat: number; lng: number; radius_km: number; flag?: string } | null>(null)
  const [loadingTarget, setLoadingTarget] = useState(false)
  const [isMoving, setIsMoving] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<{ lat: number; lng: number; zoom: number } | null>(null)

  // Map ref for custom zoom controls
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    let active = true
    const fetchTarget = async () => {
      setLoadingTarget(true)
      try {
        const res = await getGeoChallengeTarget(challenge.id)
        if (active && res) { setTargetCoords(res); onTargetLoaded?.(res) }
      } catch (err) {
        console.error('Failed to load geo target:', err)
      } finally {
        if (active) setLoadingTarget(false)
      }
    }
    fetchTarget()
    return () => { active = false }
  }, [challenge.id, isSolved])

  useEffect(() => {
    if (feedback?.success && !isRevealed) { onReveal?.(); setRevealCardOpen(true) }
  }, [feedback?.success])

  const handleMapClick = (latlng: L.LatLng) =>
    handleGeoGuessChange(challenge.id, { lat: latlng.lat, lng: latlng.lng })

  const handleSearch = async () => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    const coords = parseCoords(trimmed)
    if (coords) { setSearchResult({ lat: coords[0], lng: coords[1], zoom: 13 }); return }
    setSearchLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (data?.length > 0) {
        setSearchResult({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), zoom: 13 })
      } else {
        toast.error('Location not found')
      }
    } catch {
      toast.error('Search failed')
    } finally {
      setSearchLoading(false)
    }
  }

  const defaultCenter: [number, number] = [-2.5489, 118.0149]
  const defaultZoom = 5
  const showTarget = !!(isRevealed && targetCoords && revealCardOpen)
  const showInfoCard = showTarget

  return (
    <div className="flex-1 w-full h-full min-h-[300px] sm:min-h-[400px] flex flex-col">
      {/* Hide Leaflet's default top-left zoom control — we render our own */}
      <style>{`
        .leaflet-top.leaflet-left { display: none !important; }
        .leaflet-zoom-anim .leaflet-zoom-animated {
          transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
        }
      `}</style>

      <div className="group/map relative flex-1 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-inner h-full w-full">
        <BaseMap
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ width: '100%', height: '100%' }}
          className="z-10"
        >
          <MapRefGetter mapRef={mapRef} />
          <MapFocusController showTarget={showTarget} targetCoords={targetCoords} currentGuess={currentGuess} />
          <MapMovementTracker onMovementChange={setIsMoving} />
          <MapClickEvents onMapClick={handleMapClick} disabled={showTarget || submitting} />
          <FlyToController searchResult={searchResult} />

          {currentGuess && (
            <Marker position={[currentGuess.lat, currentGuess.lng]} icon={guessIcon}>
              <Popup>
                <div className="text-gray-900 font-sans text-xs">
                  <strong>Your Guess</strong><br />
                  Lat: {currentGuess.lat.toFixed(6)}<br />
                  Lng: {currentGuess.lng.toFixed(6)}
                </div>
              </Popup>
            </Marker>
          )}

          {showTarget && (
            <>
              <Marker position={[targetCoords.lat, targetCoords.lng]} icon={targetIcon}>
                <Popup>
                  <div className="text-gray-900 font-sans text-xs">
                    <strong className="text-green-600">Answer Location</strong><br />
                    Lat: {targetCoords.lat.toFixed(6)}<br />
                    Lng: {targetCoords.lng.toFixed(6)}<br />
                    Radius: {targetCoords.radius_km} km
                  </div>
                </Popup>
              </Marker>
              {!isMoving && (
                <Circle
                  center={[targetCoords.lat, targetCoords.lng]}
                  radius={(targetCoords.radius_km || 1.5) * 1000}
                  pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.15, weight: 2 }}
                />
              )}
              {currentGuess && !isMoving && (
                <Polyline
                  positions={[[currentGuess.lat, currentGuess.lng], [targetCoords.lat, targetCoords.lng]]}
                  pathOptions={{ color: '#F59E0B', dashArray: '6, 8', weight: 2, opacity: 0.8 }}
                />
              )}
            </>
          )}
        </BaseMap>

        {/* ──────────────────────────────────────────────
            TOP-LEFT COLUMN: Search box + Zoom controls
        ────────────────────────────────────────────── */}
        <div
          className="absolute top-2 left-2 z-20 flex flex-col gap-1.5"
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
        >
          {/* Search box */}
          <div className="flex items-center bg-white/70 dark:bg-black/70 backdrop-blur-md border border-gray-200/70 dark:border-gray-800/70 rounded-lg shadow-lg overflow-hidden">
            <Search size={11} className="ml-2 text-gray-600 dark:text-gray-300 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSearch()
                if (e.key === 'Escape') setSearchQuery('')
              }}
              placeholder="Search location or coords…"
              className="bg-transparent text-[11px] font-mono text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 outline-none py-1.5 px-1.5 w-[150px] sm:w-[180px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
              >
                <X size={10} />
              </button>
            )}
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searchLoading}
              className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white transition-colors shrink-0 cursor-pointer"
            >
              {searchLoading ? '…' : 'Go'}
            </button>
          </div>

          {/* Horizontal Zoom controls: [+] [−] */}
          <div className="flex items-center self-start bg-white/70 dark:bg-black/70 backdrop-blur-md border border-gray-200/70 dark:border-gray-800/70 rounded-lg shadow overflow-hidden">
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
              title="Zoom in"
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
            <div className="w-px h-4 bg-gray-200/70 dark:bg-gray-700/70 shrink-0" />
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
              title="Zoom out"
            >
              <Minus size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* TOP-RIGHT: Reveal toggle / Reveal button */}
        {isRevealed && targetCoords ? (
          <button
            onClick={() => setRevealCardOpen(!revealCardOpen)}
            className="absolute top-2 right-2 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-white/70 dark:bg-black/70 backdrop-blur-md border border-emerald-500/25 shadow-lg hover:bg-emerald-50/80 dark:hover:bg-emerald-900/25 transition-all active:scale-95 cursor-pointer select-none"
          >
            {revealCardOpen ? <EyeOff size={12} /> : <Eye size={12} />}
            <span>{revealCardOpen ? 'Hide Answer' : 'Reveal Answer'}</span>
          </button>
        ) : isSolved && !isRevealed ? (
          <button
            onClick={() => { onReveal?.(); setRevealCardOpen(true) }}
            className="absolute top-2 right-2 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-white/70 dark:bg-black/70 backdrop-blur-md border border-emerald-500/25 shadow-lg hover:bg-emerald-50/80 dark:hover:bg-emerald-900/25 transition-all active:scale-95 cursor-pointer select-none"
          >
            <Eye size={12} />
            <span>Reveal Answer</span>
          </button>
        ) : null}

        {/* FEEDBACK TOAST — centered horizontally, Y aligned with the zoom +/- row */}
        {feedback && (
          <div
            className={`absolute top-[44px] left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest text-center shadow-lg z-20 animate-in fade-in slide-in-from-top-2 pointer-events-none select-none whitespace-nowrap
              ${feedback.success
                ? 'bg-green-500 text-white dark:bg-green-600'
                : 'bg-red-500 text-white dark:bg-red-600'
              }`}
          >
            {feedback.message}
          </div>
        )}

        {/* BOTTOM-LEFT: Legend — hidden by default, fades in on map hover */}
        <div className="absolute bottom-2 left-2 z-20 bg-white/70 dark:bg-black/70 backdrop-blur-md border border-gray-200/70 dark:border-gray-800/70 rounded-lg p-2.5 text-[10px] font-mono shadow select-none flex flex-col gap-1 pointer-events-none opacity-0 group-hover/map:opacity-100 transition-opacity duration-200">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500 inline-block shrink-0"></span>
            <span className="text-gray-700 dark:text-gray-200">Blue = Your guess</span>
          </div>
          {showInfoCard && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 inline-block shrink-0"></span>
              <span className="text-gray-700 dark:text-gray-200">Green = Answer</span>
            </div>
          )}
        </div>

        {/* BOTTOM-RIGHT: Info card (flag + lat/lon + radius) */}
        {showInfoCard && (
          <div className="absolute bottom-2 right-2 z-20 bg-white/70 dark:bg-black/70 backdrop-blur-md border border-emerald-500/25 rounded-lg shadow-lg overflow-hidden min-w-[240px] max-w-[300px]">
            <div className="px-3 pt-2 pb-2 flex flex-col gap-1.5">

              {/* Flag */}
              {targetCoords.flag && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 font-sans w-[42px] shrink-0">Flag</span>
                  <span className="text-[9px] text-gray-300 dark:text-gray-600 shrink-0">:</span>
                  <span
                    className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 truncate flex-1 select-text"
                    title={targetCoords.flag}
                  >
                    {targetCoords.flag}
                  </span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(targetCoords.flag!); toast.success('Flag copied!') }}
                    className="shrink-0 p-0.5 rounded text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer"
                    title="Copy flag"
                  >
                    <Copy size={10} />
                  </button>
                </div>
              )}

              {/* Separator */}
              <div className="w-full h-px bg-gray-100 dark:bg-gray-800" />

              {/* Lat/Lon */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 font-sans w-[42px] shrink-0">Lat/Lon</span>
                <span className="text-[9px] text-gray-300 dark:text-gray-600 shrink-0">:</span>
                <span className="text-[10px] font-mono text-gray-700 dark:text-gray-300 flex-1 select-text truncate">
                  {targetCoords.lat.toFixed(5)}, {targetCoords.lng.toFixed(5)}
                </span>
                <button
                  onClick={() => { navigator.clipboard.writeText(`${targetCoords.lat.toFixed(6)}, ${targetCoords.lng.toFixed(6)}`); toast.success('Coords copied!') }}
                  className="shrink-0 p-0.5 rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                  title="Copy coordinates"
                >
                  <Copy size={10} />
                </button>
              </div>

              {/* Radius */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 font-sans w-[42px] shrink-0">Radius</span>
                <span className="text-[9px] text-gray-300 dark:text-gray-600 shrink-0">:</span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex-1 select-text">
                  {targetCoords.radius_km} km
                </span>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
