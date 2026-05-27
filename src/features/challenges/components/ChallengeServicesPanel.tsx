"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Clock, Loader2, Play, PowerOff, RefreshCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { SURFACE_GLASS_CARD_COMPACT_CLASS } from '@/shared/styles'
import { parseNxctlService, type NxctlServiceEntry } from '../lib/nxctl-services'

type ServiceAction = 'up' | 'restart' | 'extend'
type ServiceActionLoadingState = ServiceAction | null

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

const parseTcpEndpoint = (endpoint: string) => {
  const match = endpoint.match(/^tcp:\/\/([^/:]+):(\d+)/i)
  if (match) return { host: match[1], port: match[2] }

  const fallbackMatch = endpoint.match(/^([^/:]+):(\d+)$/i)
  return fallbackMatch ? { host: fallbackMatch[1], port: fallbackMatch[2] } : null
}

const toTcpCommand = (endpoint: string) => {
  const parsed = parseTcpEndpoint(endpoint)
  return parsed ? `nc ${parsed.host} ${parsed.port}` : endpoint
}

const toSshCommand = (endpoint: string, user?: string) => {
  const parsed = parseTcpEndpoint(endpoint)
  if (!parsed) return endpoint

  const login = user ? `${user}@` : ''
  return `ssh ${login}${parsed.host} -p ${parsed.port}`
}

const isHttpEndpoint = (endpoint: string) => /^https?:\/\//i.test(endpoint)

const formatDuration = (seconds: number) => {
  if (seconds <= 0) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const sec = seconds % 60
  if (h > 0) return `${h}h ${m}m ${sec}s`
  return `${m}m ${sec}s`
}

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

const isNxctlNotFoundError = (status: number, data: any): boolean => {
  const getCode = (val: any): string | null => {
    if (!val) return null
    if (typeof val === 'string') return val
    if (typeof val === 'object') {
      if (typeof val.error === 'string') return val.error
      if (typeof val.code === 'string') return val.code
    }
    return null
  }

  const code = getCode(data?.detail) || getCode(data?.error) || getCode(data)
  if (code === 'challenge_not_found_or_not_authorized') return false
  return status === 404 || code === 'challenge_not_found'
}

const ChallengeServicesPanel: React.FC<ChallengeServicesPanelProps> = ({
  open,
  services = [],
}) => {
  const serviceActionButtonClass =
    'inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-gray-200/80 bg-white/50 px-2.5 text-[11px] font-medium text-gray-600 shadow-sm backdrop-blur-md transition-all hover:border-blue-500/40 hover:bg-white/80 disabled:opacity-40 dark:border-gray-700/80 dark:bg-[#111622]/60 dark:text-gray-300 dark:hover:bg-[#151b2a]'
  const serviceActionButtonIconClass = 'shrink-0'
  const rawServicesKey = services.join('\u0000')
  const parsedServices = useMemo(
    () => (rawServicesKey ? rawServicesKey.split('\u0000') : [])
      .map(parseNxctlService)
      .filter((service) => service.name.trim() !== ''),
    [rawServicesKey]
  )
  const serviceListKey = useMemo(
    () => parsedServices.map((service) => `${service.name}:${service.key || ''}`).join('\u0000'),
    [parsedServices]
  )

  const [serviceDetails, setServiceDetails] = useState<Record<string, any>>({})
  const [serviceDetailsFetchTime, setServiceDetailsFetchTime] = useState<Record<string, number>>({})
  const [serviceActionLoading, setServiceActionLoading] = useState<Record<string, ServiceActionLoadingState>>({})
  const [serviceDetailsLoading, setServiceDetailsLoading] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    parsedServices.forEach((service) => {
      initial[service.name] = true
    })
    return initial
  })
  const [serviceDetailsError, setServiceDetailsError] = useState<Record<string, string | null>>({})
  const [hiddenServices, setHiddenServices] = useState<Record<string, boolean>>({})
  const [nowTick, setNowTick] = useState<number>(() => Date.now())
  const inspectRunRef = React.useRef(0)
  const expiryReminderRef = React.useRef<Record<string, boolean>>({})

  const visibleServices = useMemo(
    () => parsedServices.filter((service) => !hiddenServices[service.name]),
    [parsedServices, hiddenServices]
  )

  useEffect(() => {
    const activeNames = new Set(parsedServices.map((service) => service.name))

    setServiceDetails((prev) => {
      const next: Record<string, any> = {}
      Object.entries(prev).forEach(([name, details]) => {
        if (activeNames.has(name)) next[name] = details
      })
      return next
    })
    setServiceDetailsFetchTime((prev) => {
      const next: Record<string, number> = {}
      Object.entries(prev).forEach(([name, fetchTime]) => {
        if (activeNames.has(name)) next[name] = fetchTime
      })
      return next
    })
    setServiceDetailsLoading(() => {
      const next: Record<string, boolean> = {}
      parsedServices.forEach((service) => {
        next[service.name] = true
      })
      return next
    })
    setServiceDetailsError(() => {
      const next: Record<string, string | null> = {}
      parsedServices.forEach((service) => {
        next[service.name] = null
      })
      return next
    })
    setServiceActionLoading(() => {
      const next: Record<string, ServiceActionLoadingState> = {}
      parsedServices.forEach((service) => {
        next[service.name] = null
      })
      return next
    })
    setHiddenServices(() => {
      const next: Record<string, boolean> = {}
      parsedServices.forEach((service) => {
        next[service.name] = false
      })
      return next
    })
    expiryReminderRef.current = {}
  }, [serviceListKey, parsedServices])

  useEffect(() => {
    if (!open || parsedServices.length === 0) return

    const runId = inspectRunRef.current + 1
    inspectRunRef.current = runId
    const isCurrentRun = () => inspectRunRef.current === runId

    parsedServices.forEach(async (service) => {
      setServiceDetailsLoading((prev) => ({ ...prev, [service.name]: true }))
      setServiceDetailsError((prev) => ({ ...prev, [service.name]: null }))
      try {
        const res = await fetch(`/api/nxctl?action=inspect&name=${encodeURIComponent(service.name)}`, {
          headers: buildNxctlHeaders(service),
        })
        const data = await res.json()
        if (!isCurrentRun()) return

        if (res.ok) {
          setServiceDetails((prev) => ({ ...prev, [service.name]: data }))
          setServiceDetailsFetchTime((prev) => ({ ...prev, [service.name]: Date.now() }))
          setServiceDetailsError((prev) => ({ ...prev, [service.name]: null }))
        } else {
          if (isNxctlNotFoundError(res.status, data)) {
            setHiddenServices((prev) => ({ ...prev, [service.name]: true }))
          } else {
            setServiceDetailsError((prev) => ({ ...prev, [service.name]: getNxctlErrorMessage(data) }))
          }
        }
      } catch (error: any) {
        if (!isCurrentRun()) return
        console.error(`Failed to fetch service details for ${service.name}`, error)
        setServiceDetailsError((prev) => ({ ...prev, [service.name]: error.message || 'Failed to inspect service status' }))
      } finally {
        if (isCurrentRun()) {
          setServiceDetailsLoading((prev) => ({ ...prev, [service.name]: false }))
        }
      }
    })

    return () => {
      inspectRunRef.current += 1
    }
  }, [open, parsedServices])

  // global ticking state to re-render countdowns every second while panel is open
  useEffect(() => {
    if (!open) return
    const id = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [open])

  useEffect(() => {
    if (!open) {
      expiryReminderRef.current = {}
      return
    }

    visibleServices.forEach((service) => {
      const details = serviceDetails[service.name]
      const isRunning = details?.runtime?.status === 'running'
      const remainingSecFromApi = details?.runtime?.remaining_seconds ?? null
      const fetchTime = serviceDetailsFetchTime[service.name] ?? nowTick
      const timeSinceFetch = Math.max(0, (nowTick - fetchTime) / 1000)
      const remainingSec = remainingSecFromApi !== null ? Math.max(0, remainingSecFromApi - timeSinceFetch) : null
      const thresholdSec = Number(details?.runtime?.extend?.threshold_seconds || 300)

      if (!isRunning || remainingSec === null || remainingSec <= 0) {
        expiryReminderRef.current[service.name] = false
        return
      }

      if (remainingSec > thresholdSec) {
        expiryReminderRef.current[service.name] = false
        return
      }

      if (expiryReminderRef.current[service.name]) return

      expiryReminderRef.current[service.name] = true
      toast(
        `${service.name} expires in ${formatDuration(Math.floor(remainingSec))}. Extend it if needed.`,
        {
          icon: '!',
          duration: 7000,
          id: `nxctl-expiry-${service.name}`,
        }
      )
    })
  }, [open, visibleServices, serviceDetails, serviceDetailsFetchTime, nowTick])

  const inspectService = async (service: NxctlServiceEntry) => {
    setServiceDetailsLoading((prev) => ({ ...prev, [service.name]: true }))
    setServiceDetailsError((prev) => ({ ...prev, [service.name]: null }))
    try {
      const resInspect = await fetch(`/api/nxctl?action=inspect&name=${encodeURIComponent(service.name)}`, {
        headers: buildNxctlHeaders(service),
      })
      const dataInspect = await resInspect.json()
      if (resInspect.ok) {
        setServiceDetails((prev) => ({ ...prev, [service.name]: dataInspect }))
        setServiceDetailsFetchTime((prev) => ({ ...prev, [service.name]: Date.now() }))
        setServiceDetailsError((prev) => ({ ...prev, [service.name]: null }))
      } else {
        if (isNxctlNotFoundError(resInspect.status, dataInspect)) {
          setHiddenServices((prev) => ({ ...prev, [service.name]: true }))
        } else {
          setServiceDetailsError((prev) => ({ ...prev, [service.name]: getNxctlErrorMessage(dataInspect) }))
        }
      }
    } catch (error: any) {
      console.error(`Failed to refresh service details for ${service.name}`, error)
      setServiceDetailsError((prev) => ({ ...prev, [service.name]: error.message || 'Failed to inspect service status' }))
    } finally {
      setServiceDetailsLoading((prev) => ({ ...prev, [service.name]: false }))
    }
  }

  const handleServiceAction = async (service: NxctlServiceEntry, action: ServiceAction) => {
    setServiceActionLoading((prev) => ({ ...prev, [service.name]: action }))
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
        await new Promise((resolve) => setTimeout(resolve, 500))
        await inspectService(service)
      } else {
        toast.error(`Failed to ${action} ${service.name}: ${getNxctlErrorMessage(data)}`, { id: toastId })
      }
    } catch (error) {
      console.error(`Failed to ${action} ${service.name}`, error)
      toast.error(`Error ${action}ing ${service.name}`, { id: toastId })
    } finally {
      setServiceActionLoading((prev) => ({ ...prev, [service.name]: null }))
    }
  }

  if (visibleServices.length === 0) return null

  return (
    <div>
      <p className="select-none text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5 opacity-80">
        <span className="h-4 w-4">🌐</span> <span>NXCTL Services</span>
      </p>
      <div className="grid grid-cols-1 gap-1.5">
        {visibleServices.map((service, idx) => {
          const details = serviceDetails[service.name]
          const isRunning = details?.runtime?.status === 'running'
          const serviceType = details?.challenge?.type
          const endpoints = Array.isArray(details?.exports)
            ? details.exports
              .map((item: any, exportIdx: number) => {
                const endpoint = getExportEndpoint(item)
                if (!endpoint) return null

                const isTcp = isTcpEndpoint(item, serviceType)
                const endpointType = String(item?.type || '').toLowerCase()
                const isReturnedTcp =
                  endpointType === 'tcp' ||
                  endpoint.toLowerCase().startsWith('tcp://') ||
                  (!isHttpEndpoint(endpoint) && parseTcpEndpoint(endpoint) !== null)
                const isSsh = isReturnedTcp && service.options.type === 'ssh'
                const command = isSsh ? toSshCommand(endpoint, service.options.user) : isTcp ? toTcpCommand(endpoint) : endpoint
                const password = isSsh ? service.options.pass || '' : ''

                return {
                  key: `${endpoint}-${exportIdx}`,
                  endpoint,
                  provider: item?.provider ? String(item.provider) : '',
                  port: item?.port ? String(item.port) : '',
                  status: item?.status ? String(item.status) : '',
                  type: item?.type ? String(item.type) : String(serviceType || ''),
                  isTcp,
                  isSsh,
                  command,
                  password,
                  copyText: password ? `${command}\npassword: ${password}` : command,
                  copyMessage: password ? 'Copied SSH details' : 'Copied endpoint',
                }
              })
              .filter(Boolean)
            : []

          // Use remaining_seconds directly from API and keep countdown local between refreshes.
          const remainingSecFromApi = details?.runtime?.remaining_seconds ?? null
          const fetchTime = serviceDetailsFetchTime[service.name] ?? nowTick
          const timeSinceFetch = Math.max(0, (nowTick - fetchTime) / 1000)
          const remainingSec = remainingSecFromApi !== null ? Math.max(0, remainingSecFromApi - timeSinceFetch) : null
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

          const timerClass = (() => {
            if (remainingSec === null) return 'border-gray-700/60 bg-gray-900/40 text-gray-500'
            if (remainingSec <= 60) return 'border-red-500/30 bg-red-500/10 text-red-300'
            if (remainingSec <= thresholdSec) return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
            return 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300'
          })()
          const isLoading = serviceDetailsLoading[service.name] ?? (!details && open)
          const errorMessage = serviceDetailsError[service.name]
          const actionLoading = serviceActionLoading[service.name] ?? null
          const isActionLoading = actionLoading !== null

          return (
            <div key={`${service.name}-${idx}`} className={`group flex min-h-[74px] flex-col gap-1.5 px-3 py-2.5 transition-colors duration-200 ${SURFACE_GLASS_CARD_COMPACT_CLASS} hover:border-blue-500/40`}>
              {/* Header: name + action buttons + timer */}
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 min-h-9">
                <div className="min-w-0 color-primary font-medium truncate">
                    {service.name}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    className={serviceActionButtonClass}
                    onClick={() => handleServiceAction(service, 'up')}
                    title={(() => {
                      if (isLoading) return 'Checking status...'
                      if (errorMessage) return `Error: ${errorMessage}`
                      if (isActionLoading) return 'Please wait...'
                      if (isRunning) return 'Service is already running'
                      return 'Start Service'
                    })()}
                    disabled={
                      isLoading ||
                      !!errorMessage ||
                      isActionLoading ||
                      isRunning
                    }
                  >
                    {actionLoading === 'up' ? <Loader2 size={12} className={`${serviceActionButtonIconClass} animate-spin`} /> : <Play size={12} className={serviceActionButtonIconClass} />}
                    <span>Start</span>
                  </button>
                  <button
                    type="button"
                    className={serviceActionButtonClass}
                    onClick={() => handleServiceAction(service, 'restart')}
                    title={(() => {
                      if (isLoading) return 'Checking status...'
                      if (errorMessage) return `Error: ${errorMessage}`
                      if (isActionLoading) return 'Please wait...'
                      if (!isRunning) return 'Cannot restart: service is not running'
                      if (restartCooldownSec && restartCooldownSec > 0) return `Restart cooldown: ${formatSecs(restartCooldownSec)}`
                      return 'Restart Service'
                    })()}
                    disabled={
                      isLoading ||
                      !!errorMessage ||
                      isActionLoading ||
                      !isRunning ||
                      !!(restartCooldownSec && restartCooldownSec > 0)
                    }
                  >
                    {actionLoading === 'restart' ? <Loader2 size={12} className={`${serviceActionButtonIconClass} animate-spin`} /> : <RefreshCcw size={12} className={serviceActionButtonIconClass} />}
                    <span>Restart</span>
                  </button>
                  <button
                    type="button"
                    className={serviceActionButtonClass}
                    onClick={() => handleServiceAction(service, 'extend')}
                    title={(() => {
                      if (isLoading) return 'Checking status...'
                      if (errorMessage) return `Error: ${errorMessage}`
                      if (isActionLoading) return 'Please wait...'
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
                    disabled={
                      isLoading ||
                      !!errorMessage ||
                      isActionLoading ||
                      !isRunning ||
                      !remainingSec ||
                      !canExtend
                    }
                  >
                    {actionLoading === 'extend' ? <Loader2 size={12} className={`${serviceActionButtonIconClass} animate-spin`} /> : <Clock size={12} className={serviceActionButtonIconClass} />}
                    <span>Extend</span>
                  </button>
                </div>

                {isRunning && remainingSec !== null ? (
                  <span
                    className={`inline-flex h-7 min-w-[100px] select-none items-center justify-between gap-1 rounded-md border px-2 text-[10px] font-semibold tabular-nums ${timerClass}`}
                    title="Time remaining"
                  >
                    <Clock size={11} className="shrink-0 opacity-80" />
                    {formatSecs(Math.floor(remainingSec))}
                  </span>
                ) : (
                  <span
                    className={`inline-flex h-7 min-w-[100px] select-none items-center justify-between gap-1 rounded-md border px-2 text-[10px] font-semibold tabular-nums ${timerClass}`}
                    title="Time remaining"
                  >
                    <Clock size={11} className="shrink-0 opacity-80" />
                    {details ? 'Not running' : 'Unknown status'}
                  </span>
                )}
              </div>

              {/* Per-service loading */}
              {isLoading && !details && (
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 select-none">
                  <Loader2 size={10} className="animate-spin text-blue-500" />
                  <span>Checking...</span>
                </div>
              )}

              {/* Per-service error */}
              {errorMessage && (
                <div className="flex items-center gap-1.5 text-[11px] select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                  <span className="text-red-400 truncate flex-1">{errorMessage}</span>
                  <button
                    type="button"
                    className="text-[11px] text-blue-500 hover:text-blue-400 hover:underline font-medium flex items-center gap-0.5 shrink-0 disabled:opacity-50"
                    onClick={() => inspectService(service)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 size={9} className="animate-spin" />
                    ) : (
                      <RefreshCcw size={9} />
                    )}
                    Retry
                  </button>
                </div>
              )}

              {/* Endpoints (only when running) */}
              {details && isRunning && (
                endpoints.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {endpoints.map((endpoint: any) => (
                      <div key={endpoint.key} className="flex min-w-0 flex-col gap-1">
                        {endpoint.isTcp || !isHttpEndpoint(endpoint.endpoint) ? (
                          <div className="flex min-w-0 flex-col gap-1">
                            <div className={`grid items-center gap-2 min-w-0 ${endpoint.isSsh && endpoint.password ? 'grid-cols-[minmax(0,1fr)_minmax(70px,120px)_auto]' : 'grid-cols-[minmax(0,1fr)_auto]'}`}>
                              <code className={`min-w-0 truncate rounded border px-2 py-1 font-mono text-[11px] ${endpoint.isSsh ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'}`}>
                                {endpoint.command}
                              </code>
                              {endpoint.isSsh && endpoint.password && (
                                <code
                                  className="min-w-0 truncate rounded border border-amber-500/20 bg-amber-500/10 px-2 py-1 font-mono text-[11px] text-amber-300"
                                  title={`Password: ${endpoint.password}`}
                                >
                                  <span className="select-none pr-1 text-[9px] font-bold uppercase tracking-wider text-amber-500/70">pw</span>
                                  {endpoint.password}
                                </code>
                              )}
                              <button
                                className={`select-none shrink-0 rounded px-2 py-1 text-[10px] font-bold transition ${endpoint.isSsh ? 'border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20' : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'}`}
                                onClick={() => {
                                  navigator.clipboard.writeText(endpoint.copyText)
                                  toast.success(endpoint.copyMessage)
                                }}
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <a href={endpoint.endpoint} target="_blank" rel="noreferrer" className="col-span-2 block w-full truncate rounded border border-blue-500/15 bg-blue-500/5 px-2 py-1 text-[11px] font-medium text-blue-400 transition hover:text-blue-300 hover:underline">
                            {endpoint.endpoint}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-yellow-500">Waiting for endpoint allocation...</span>
                )
              )}

              {/* Stopped state - minimal */}
              {details && !isRunning && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 select-none">
                  <PowerOff size={11} className="shrink-0 opacity-70" />
                  Stopped
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ChallengeServicesPanel
