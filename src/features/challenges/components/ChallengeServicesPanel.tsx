"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Clock, Loader2, Play, RefreshCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  SURFACE_GLASS_CARD_COMPACT_CLASS,
  SURFACE_GLASS_CONTROL_COMPACT_CLASS,
} from '@/shared/styles'
import { parseNxctlService, type NxctlServiceEntry } from '../lib/nxctl-services'

type ServiceAction = 'up' | 'restart' | 'extend'

interface ChallengeServicesPanelProps {
  open: boolean
  services?: string[]
}

const buildNxctlHeaders = (service: NxctlServiceEntry, json = false) => {
  const headers: Record<string, string> = {}
  if (json) headers['Content-Type'] = 'application/json'
  if (service.key) headers['X-NXCTL-Challenge-Key'] = service.key
  return headers
}

const getExportEndpoint = (item: any) => String(item?.endpoint || item?.url || '').trim()

const isTcpEndpoint = (item: any, fallbackType?: string) => {
  const endpoint = getExportEndpoint(item).toLowerCase()
  const type = String(item?.type || fallbackType || '').toLowerCase()
  return type === 'tcp' || endpoint.startsWith('tcp://')
}

const toTcpCommand = (endpoint: string) => {
  const match = endpoint.match(/^tcp:\/\/([^/:]+):(\d+)/i)
  return match ? `nc ${match[1]} ${match[2]}` : endpoint
}

const isHttpEndpoint = (endpoint: string) => /^https?:\/\//i.test(endpoint)

const stringifyNxctlDetail = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value !== 'object') return String(value)

  const detail = value as Record<string, unknown>
  const code = typeof detail.error === 'string' ? detail.error : ''
  const message = typeof detail.message === 'string' ? detail.message : ''

  if (code === 'challenge_not_found_or_not_authorized') {
    return 'Challenge not found, disabled, or missing/invalid challenge key.'
  }

  if (code === 'challenge_not_found') {
    return 'Challenge not found in NXCTL.'
  }

  if (code === 'invalid_or_missing_api_token') {
    return 'NXCTL API token is missing or invalid.'
  }

  if (code === 'invalid_or_missing_admin_secret') {
    return 'NXCTL admin secret is missing or invalid.'
  }

  if (code === 'api_admin_secret_not_configured') {
    return 'NXCTL admin secret is not configured.'
  }

  if (message) return message
  if (code) return code

  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

const getNxctlErrorMessage = (data: any) => {
  return (
    stringifyNxctlDetail(data?.detail) ||
    stringifyNxctlDetail(data?.error) ||
    stringifyNxctlDetail(data?.message) ||
    'Unknown error'
  )
}

const ChallengeServicesPanel: React.FC<ChallengeServicesPanelProps> = ({
  open,
  services = [],
}) => {
  const [serviceDetails, setServiceDetails] = useState<Record<string, any>>({})
  const [serviceDetailsFetchTime, setServiceDetailsFetchTime] = useState<Record<string, number>>({})
  const [serviceActionLoading, setServiceActionLoading] = useState<Record<string, boolean>>({})
  const [nowTick, setNowTick] = useState<number>(() => Date.now())
  const parsedServices = useMemo(
    () => services.map(parseNxctlService).filter((service) => service.name.trim() !== ''),
    [services]
  )

  useEffect(() => {
    if (!open || parsedServices.length === 0) return

    parsedServices.forEach(async (service) => {
      try {
        const res = await fetch(`/api/nxctl?action=inspect&name=${encodeURIComponent(service.name)}`, {
          headers: buildNxctlHeaders(service),
        })
        const data = await res.json()
        if (res.ok) {
          setServiceDetails((prev) => ({ ...prev, [service.name]: data }))
          setServiceDetailsFetchTime((prev) => ({ ...prev, [service.name]: Date.now() }))
        }
      } catch (error) {
        console.error(`Failed to fetch service details for ${service.name}`, error)
      }
    })
  }, [open, parsedServices])

  // global ticking state to re-render countdowns every second while panel is open
  useEffect(() => {
    if (!open) return
    const id = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [open])

  const inspectService = async (service: NxctlServiceEntry) => {
    try {
      const resInspect = await fetch(`/api/nxctl?action=inspect&name=${encodeURIComponent(service.name)}`, {
        headers: buildNxctlHeaders(service),
      })
      if (resInspect.ok) {
        const dataInspect = await resInspect.json()
        setServiceDetails((prev) => ({ ...prev, [service.name]: dataInspect }))
        setServiceDetailsFetchTime((prev) => ({ ...prev, [service.name]: Date.now() }))
      }
    } catch (error) {
      console.error(`Failed to refresh service details for ${service.name}`, error)
    }
  }

  const handleServiceAction = async (service: NxctlServiceEntry, action: ServiceAction) => {
    setServiceActionLoading((prev) => ({ ...prev, [service.name]: true }))
    const toastId = toast.loading(`${action}ing ${service.name}...`)

    try {
      const res = await fetch('/api/nxctl', {
        method: 'POST',
        headers: buildNxctlHeaders(service, true),
        body: JSON.stringify({ action, name: service.name }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(`Successfully ${action}ed ${service.name}`, { id: toastId })
        // Add small delay then refresh to let backend settle
        setTimeout(() => inspectService(service), 500)
      } else {
        toast.error(`Failed to ${action} ${service.name}: ${getNxctlErrorMessage(data)}`, { id: toastId })
      }
    } catch (error) {
      console.error(`Failed to ${action} ${service.name}`, error)
      toast.error(`Error ${action}ing ${service.name}`, { id: toastId })
    } finally {
      setServiceActionLoading((prev) => ({ ...prev, [service.name]: false }))
    }
  }

  function formatMinutes(sec?: number | null) {
    if (!sec || sec <= 0) return null

    const mins = Math.ceil(sec / 60)

    return `${mins}m`
  }

  if (parsedServices.length === 0) return null

  return (
    <div>
      <p className="select-none text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5 opacity-80">
        <span className="h-4 w-4">🌐</span> <span>NXCTL Services</span>
      </p>
      <div className="grid grid-cols-1 gap-1.5">
        {parsedServices.map((service, idx) => {
          const details = serviceDetails[service.name]
          const isRunning = details?.runtime?.status === 'running'
          const serviceType = details?.challenge?.type
          const endpoints = Array.isArray(details?.exports)
            ? details.exports
                .map((item: any, exportIdx: number) => {
                  const endpoint = getExportEndpoint(item)
                  if (!endpoint) return null

                  const isTcp = isTcpEndpoint(item, serviceType)
                  return {
                    key: `${endpoint}-${exportIdx}`,
                    endpoint,
                    provider: item?.provider ? String(item.provider) : '',
                    port: item?.port ? String(item.port) : '',
                    status: item?.status ? String(item.status) : '',
                    type: item?.type ? String(item.type) : String(serviceType || ''),
                    isTcp,
                    command: isTcp ? toTcpCommand(endpoint) : endpoint,
                  }
                })
                .filter(Boolean)
            : []

          // Use remaining_seconds directly from API, calculate expires_at for display
          const remainingSecFromApi = details?.runtime?.remaining_seconds ?? null
          const fetchTime = serviceDetailsFetchTime[service.name] ?? nowTick
          const timeSinceFetch = Math.max(0, (nowTick - fetchTime) / 1000)
          const remainingSec = remainingSecFromApi !== null ? Math.max(0, remainingSecFromApi - timeSinceFetch) : null
          const expiresAtMs = remainingSec !== null ? nowTick + remainingSec * 1000 : null
          const restartCooldownSec = typeof details?.runtime?.restart_cooldown === 'number' ? details.runtime.restart_cooldown : (details?.runtime?.restart_cooldown ? Number(details.runtime.restart_cooldown) : 0)

          // Use backend's extend_availability data
          const extendAvailability = details?.runtime?.extend
          const thresholdSec = extendAvailability?.threshold_seconds || 300 // fallback to 5 minutes
          const canExtend = extendAvailability?.can_extend || false

          const formatSecs = (s: number) => {
            if (s <= 0) return '0s'
            const h = Math.floor(s / 3600)
            const m = Math.floor((s % 3600) / 60)
            const sec = s % 60
            if (h > 0) return `${h}h ${m}m ${sec}s`
            return `${m}m ${sec}s`
          }

          const remainingClass = (() => {
            if (remainingSec === null) return 'text-gray-500'
            if (remainingSec <= 60) return 'text-red-400 font-semibold'
            if (remainingSec <= thresholdSec) return 'text-yellow-400 font-medium'
            return 'text-gray-400'
          })()

          return (
            <div key={`${service.name}-${idx}`} className={`group flex flex-col gap-2 p-3 ${SURFACE_GLASS_CARD_COMPACT_CLASS} hover:border-blue-500/40`}>
              <div className="flex items-center gap-2">
                <code className="select-none text-[13px] md:text-sm font-mono text-gray-900 dark:text-cyan-300 break-all flex-1 font-semibold">{service.name}</code>
                <button
                  type="button"
                  className={`select-none p-1.5 text-gray-500 hover:text-green-600 disabled:opacity-50 dark:text-gray-400 dark:hover:text-green-400 md:p-2 ${SURFACE_GLASS_CONTROL_COMPACT_CLASS}`}
                  onClick={() => handleServiceAction(service, 'up')}
                  title="Start Service"
                  disabled={serviceActionLoading[service.name] || isRunning}
                >
                  {serviceActionLoading[service.name] ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                </button>
                <button
                  type="button"
                  className={`flex select-none items-center gap-1 p-1.5 text-gray-500 hover:text-yellow-600 disabled:opacity-50 dark:text-gray-400 dark:hover:text-yellow-400 md:p-2 ${SURFACE_GLASS_CONTROL_COMPACT_CLASS}`}
                  onClick={() => handleServiceAction(service, 'restart')}
                  title={(() => {
                    if (serviceActionLoading[service.name]) return 'Please wait...'
                    if (!isRunning) return 'Cannot restart: service is not running'
                    if (restartCooldownSec && restartCooldownSec > 0) return `Restart cooldown: ${formatSecs(restartCooldownSec)}`
                    return 'Restart Service'
                  })()}
                  disabled={serviceActionLoading[service.name] || !isRunning || (restartCooldownSec && restartCooldownSec > 0)}
                >
                  {serviceActionLoading[service.name] ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                  {formatMinutes(restartCooldownSec) && (
                    <span className="text-[10px] text-yellow-300 font-semibold">
                      {formatMinutes(restartCooldownSec)}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className={`flex select-none items-center gap-1 p-1.5 text-gray-500 hover:text-blue-600 disabled:opacity-50 dark:text-gray-400 dark:hover:text-blue-400 md:p-2 ${SURFACE_GLASS_CONTROL_COMPACT_CLASS}`}
                  onClick={() => handleServiceAction(service, 'extend')}
                  title={(() => {
                    if (serviceActionLoading[service.name]) return 'Please wait...'
                    if (!isRunning) return 'Cannot extend: service is not running'
                    if (!remainingSec) return 'No expiration available to extend'
                    if (!canExtend) {
                      if (extendAvailability?.cooldown_remaining_seconds && extendAvailability.cooldown_remaining_seconds > 0) {
                        return `Extend cooldown: ${formatSecs(extendAvailability.cooldown_remaining_seconds)}`
                      }
                      return `Can extend when remaining ≤ ${formatSecs(thresholdSec)}`
                    }
                    return `Extend service time`
                  })()}
                  disabled={serviceActionLoading[service.name] || !isRunning || !remainingSec || !canExtend}
                >
                  {serviceActionLoading[service.name] ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                  {Number(extendAvailability?.cooldown_remaining_seconds) > 0 && (
                    <span className="text-[10px] text-blue-300 font-semibold">{Math.ceil(extendAvailability.cooldown_remaining_seconds / 60)}m</span>
                  )}
                  {!canExtend && remainingSec && remainingSec > thresholdSec && (
                    <span className="text-[10px] text-blue-300 font-semibold">{formatSecs(Math.floor(remainingSec - thresholdSec))}</span>
                  )}
                </button>
              </div>

              {details && (
                <div className="mt-1 flex flex-col gap-2 border-t border-gray-200/80 pt-2 dark:border-gray-700/70">
                  <div className="flex select-none items-center gap-2 text-[13px] md:text-sm">
                    <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-gray-400">Status: {details.runtime?.status || 'stopped'}</span>
                    {isRunning && remainingSec !== null && (
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-gray-500 text-[11px]">Expires: {expiresAtMs ? new Date(expiresAtMs).toLocaleTimeString() : '(unknown)'}</span>
                        <span className={`font-bold px-2 py-0.5 rounded ${remainingClass}`}>
                          {formatSecs(Math.floor(remainingSec))}
                        </span>
                      </div>
                    )}
                  </div>

                  {isRunning && (
                    endpoints.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {endpoints.map((endpoint: any, endpointIdx: number) => {
                          return (
                            <div key={endpoint.key} className="flex flex-col">
                              {endpoint.isTcp || !isHttpEndpoint(endpoint.endpoint) ? (
                                <div className="flex items-center gap-2">
                                  <code className="flex-1 select-all break-all rounded-lg border border-gray-300/60 bg-gray-200/50 px-2 py-1.5 font-mono text-[13px] text-gray-900 shadow-inner dark:border-gray-700/70 dark:bg-black/40 dark:text-green-300">
                                    {endpoint.command}
                                  </code>
                                  <button
                                    className="select-none rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-[13px] font-bold text-green-700 shadow-sm transition hover:bg-green-500/20 dark:text-green-300"
                                    onClick={() => {
                                      navigator.clipboard.writeText(endpoint.command)
                                      toast.success('Copied endpoint')
                                    }}
                                  >
                                    Copy
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <a href={endpoint.endpoint} target="_blank" rel="noreferrer" className="flex-1 select-none break-all rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1.5 text-[13px] font-semibold text-blue-600 shadow-inner transition hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300 md:text-sm">
                                    {endpoint.endpoint}
                                  </a>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-yellow-500">Waiting for endpoint allocation...</span>
                    )
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ChallengeServicesPanel
