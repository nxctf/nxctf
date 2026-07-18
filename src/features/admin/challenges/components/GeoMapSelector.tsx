'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Marker, Circle, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Input, Label } from '@/shared/ui'
import { parseGeoFlagClient } from '@/features/challenges/lib'
import type { GeoCoordinates } from '@/shared/types'
import { BaseMap, adminPinIcon } from '@/shared/components/BaseMap'
import ConfirmDialog from '@/shared/components/ConfirmDialog'
import { Search, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface GeoMapSelectorProps {
  initialFlag: string
  onConfirm: (flag: string) => void
  onCancel: () => void
}

function MapClickEvents({ onMapClick }: { onMapClick: (coords: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng)
    },
  })
  return null
}

function MapMovementTracker({ onMovementChange }: { onMovementChange: (moving: boolean) => void }) {
  useMapEvents({
    movestart() {
      onMovementChange(true)
    },
    moveend() {
      onMovementChange(false)
    },
  })
  return null
}

function FlyToLocation({ coords, trigger }: { coords: GeoCoordinates | null; trigger: number }) {
  const map = useMap()
  const prevTrigger = useRef(-1)

  useEffect(() => {
    if (coords && trigger !== prevTrigger.current) {
      prevTrigger.current = trigger
      const timer = setTimeout(() => {
        const targetLatLng = L.latLng(coords.lat, coords.lng)
        const isTargetInView = map.getBounds().contains(targetLatLng)
        const duration = isTargetInView ? 0.4 : 0.8
        map.flyTo(targetLatLng, 13, { duration })
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [coords, trigger, map])

  return null
}

export default function GeoMapSelector({
  initialFlag,
  onConfirm,
  onCancel,
}: GeoMapSelectorProps) {
  const [prefix, setPrefix] = useState('NXCTF')
  const [radius, setRadius] = useState('1.5')
  const [coords, setCoords] = useState<GeoCoordinates | null>(null)
  const [isMoving, setIsMoving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingFlag, setPendingFlag] = useState('')
  const [flyTrigger, setFlyTrigger] = useState(0)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Manual lat/lng input state (string so user can type freely)
  const [latInput, setLatInput] = useState('')
  const [lngInput, setLngInput] = useState('')

  // Parse initial flag on mount — pre-populate prefix, radius, and coordinates
  useEffect(() => {
    const parsed = parseGeoFlagClient(initialFlag)
    if (parsed) {
      setPrefix(parsed.prefix)
      setRadius(parsed.radius_km.toString())
      const c = { lat: parsed.lat, lng: parsed.lng }
      setCoords(c)
      setLatInput(parsed.lat.toFixed(6))
      setLngInput(parsed.lng.toFixed(6))
      setFlyTrigger(1)
    }
  }, [initialFlag])

  // Sync lat/lng inputs when coords change via map click
  const applyCoords = (c: GeoCoordinates, shouldFly = false) => {
    setCoords(c)
    setLatInput(c.lat.toFixed(6))
    setLngInput(c.lng.toFixed(6))
    if (shouldFly) setFlyTrigger(t => t + 1)
  }

  const handleMapClick = (latlng: L.LatLng) => {
    applyCoords({ lat: latlng.lat, lng: latlng.lng })
  }

  // Apply manual lat/lng inputs
  const handleLatInputCommit = () => {
    const lat = parseFloat(latInput)
    const lng = parseFloat(lngInput)
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      applyCoords({ lat, lng }, true)
    }
  }

  const handleLngInputCommit = () => {
    handleLatInputCommit()
  }

  // Nominatim search
  const handleSearch = async () => {
    const q = searchQuery.trim()
    if (!q) return
    setIsSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'id,en' } }
      )
      const data = await res.json()
      if (!data || data.length === 0) {
        toast.error('Location not found. Try a different search term.')
        return
      }
      const { lat, lon } = data[0]
      applyCoords({ lat: parseFloat(lat), lng: parseFloat(lon) }, true)
    } catch (err) {
      console.error('Nominatim search failed:', err)
      toast.error('Search failed. Check your internet connection.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleConfirm = () => {
    if (!coords) return
    const r = parseFloat(radius)
    const finalRadius = isNaN(r) ? 1.5 : r
    const flagString = `${prefix}{geo:${coords.lat.toFixed(6)},${coords.lng.toFixed(6)},${finalRadius.toFixed(3)}}`

    if (initialFlag && initialFlag.trim() !== '') {
      setPendingFlag(flagString)
      setConfirmOpen(true)
    } else {
      onConfirm(flagString)
    }
  }

  const defaultCenter: [number, number] = [-2.5489, 118.0149]
  const defaultZoom = 5

  return (
    <div className="flex flex-col gap-4 h-full min-h-[500px]">
      {/* Row 1: Prefix & Radius */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold text-gray-500">Flag Prefix</Label>
          <Input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="e.g. nxctf"
            className="h-9 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold text-gray-500">Radius Toleransi (KM)</Label>
          <Input
            type="number"
            step="0.05"
            min="0"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            placeholder="e.g. 1.5"
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Row 2: Search by name */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-bold text-gray-500">Search Location</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="e.g. Bandung, Indonesia..."
              className="h-9 text-sm pl-8"
              disabled={isSearching}
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            {isSearching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
            Search
          </button>
        </div>
      </div>

      {/* Row 3: Manual lat/lng input */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold text-gray-500">Latitude</Label>
          <Input
            type="number"
            step="any"
            min="-90"
            max="90"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            onBlur={handleLatInputCommit}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLatInputCommit() } }}
            placeholder="-6.200000"
            className="h-9 text-sm font-mono"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold text-gray-500">Longitude</Label>
          <Input
            type="number"
            step="any"
            min="-180"
            max="180"
            value={lngInput}
            onChange={(e) => setLngInput(e.target.value)}
            onBlur={handleLngInputCommit}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLngInputCommit() } }}
            placeholder="106.816666"
            className="h-9 text-sm font-mono"
          />
        </div>
      </div>

      {/* Map display */}
      <div className="relative rounded-lg overflow-hidden border dark:border-gray-800 shadow-inner h-[320px] w-full">
        <BaseMap
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ width: '100%', height: '320px' }}
          className="z-10"
        >
          <MapClickEvents onMapClick={handleMapClick} />
          <MapMovementTracker onMovementChange={setIsMoving} />
          <FlyToLocation coords={coords} trigger={flyTrigger} />

          {coords && (
            <>
              <Marker position={[coords.lat, coords.lng]} icon={adminPinIcon} />
              {!isMoving && (
                <Circle
                  center={[coords.lat, coords.lng]}
                  radius={(parseFloat(radius) || 1.5) * 1000}
                  pathOptions={{
                    color: '#EF4444',
                    fillColor: '#EF4444',
                    fillOpacity: 0.15,
                    weight: 2,
                  }}
                />
              )}
            </>
          )}
        </BaseMap>
        <div className="absolute top-2 right-2 z-20 bg-white/95 dark:bg-black/90 border rounded p-2 text-[10px] text-gray-500 font-mono shadow pointer-events-none select-none">
          Click on map to select location
        </div>
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-between border-t pt-3 dark:border-gray-800">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-gray-400">Selected Coordinates</span>
          {coords ? (
            <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300">
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </span>
          ) : (
            <span className="text-xs text-red-500 italic">No location selected</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-4 rounded-lg border text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!coords}
            onClick={handleConfirm}
            className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            Select Location
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Change Flag to Geo Flag"
        description="Do you want to change the flag to the selected location's geo flag?"
        onConfirm={() => {
          onConfirm(pendingFlag)
        }}
        confirmLabel="Change Flag"
        cancelLabel="Keep Current"
      />
    </div>
  )
}
