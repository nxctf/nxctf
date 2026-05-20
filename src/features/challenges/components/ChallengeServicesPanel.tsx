"use client"

import React, { useEffect, useState } from 'react'
import { Clock, Loader2, Play, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import { ChallengeRuntimeService, type ServiceAction } from '@/features/challenges/services/challenge-runtime.service'
import { DEFAULT_EXTEND_THRESHOLD_SECONDS } from '@/features/challenges/constants/challenge-runtime.constants'

interface ChallengeServicesPanelProps {
  open: boolean
  services?: string[]
}

const ChallengeServicesPanel: React.FC<ChallengeServicesPanelProps> = ({
  open,
  services = [],
}) => {
  const [serviceDetails, setServiceDetails] = useState<Record<string, any>>({})
  const [serviceDetailsFetchTime, setServiceDetailsFetchTime] = useState<Record<string, number>>({})
  const [serviceActionLoading, setServiceActionLoading] = useState<Record<string, boolean>>({})
  const [nowTick, setNowTick] = useState<number>(() => Date.now())

  useEffect(() => {
    if (!open || services.length === 0) return

    services.forEach(async (service) => {
      try {
        const data = await ChallengeRuntimeService.inspect(service)
        setServiceDetails((prev) => ({ ...prev, [service]: data }))
        setServiceDetailsFetchTime((prev) => ({ ...prev, [service]: Date.now() }))
      } catch (error) {
        console.error(`Failed to fetch service details for ${service}`, error)
      }
    })
  }, [open, services])

  // global ticking state to re-render countdowns every second while panel is open
  useEffect(() => {
    if (!open) return
    const id = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [open])

  const inspectService = async (service: string) => {
    try {
      const dataInspect = await ChallengeRuntimeService.inspect(service)
      setServiceDetails((prev) => ({ ...prev, [service]: dataInspect }))
      setServiceDetailsFetchTime((prev) => ({ ...prev, [service]: Date.now() }))
    } catch (error) {
      console.error(`Failed to refresh service details for ${service}`, error)
    }
  }

  const handleServiceAction = async (service: string, action: ServiceAction) => {
    setServiceActionLoading((prev) => ({ ...prev, [service]: true }))
    const toastId = toast.loading(`${action}ing ${service}...`)

    try {
      const data = await ChallengeRuntimeService.mutate(service, action)
      if (data) {
        toast.success(`Successfully ${action}ed ${service}`, { id: toastId })
        // Add small delay then refresh to let backend settle
        setTimeout(() => inspectService(service), 500)
      }
    } catch (error) {
      console.error(`Failed to ${action} ${service}`, error)
      toast.error(`Error ${action}ing ${service}`, { id: toastId })
    } finally {
      setServiceActionLoading((prev) => ({ ...prev, [service]: false }))
    }
  }

  function formatMinutes(sec?: number | null) {
    if (!sec || sec <= 0) return null

    const mins = Math.ceil(sec / 60)

    return `${mins}m`
  }

  if (services.length === 0) return null

  return (
    <div>
      <p className="select-none text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5 opacity-80">
        <span className="h-4 w-4">🌐</span> <span>NXCTL Services</span>
      </p>
      <div className="grid grid-cols-1 gap-1.5">
        {services.map((service, idx) => {
          const details = serviceDetails[service]
          const isRunning = details?.runtime?.status === 'running'
          const activeExport = details?.exports?.[0]
          const endpoint = activeExport?.endpoint || ''
          const isTcp = details?.challenge?.type === 'tcp'

          // Use remaining_seconds directly from API, calculate expires_at for display
          const remainingSecFromApi = details?.runtime?.remaining_seconds ?? null
          const fetchTime = serviceDetailsFetchTime[service] ?? nowTick
          const timeSinceFetch = Math.max(0, (nowTick - fetchTime) / 1000)
          const remainingSec = remainingSecFromApi !== null ? Math.max(0, remainingSecFromApi - timeSinceFetch) : null
          const expiresAtMs = remainingSec !== null ? nowTick + remainingSec * 1000 : null
          const restartCooldownSec = typeof details?.runtime?.restart_cooldown === 'number' ? details.runtime.restart_cooldown : (details?.runtime?.restart_cooldown ? Number(details.runtime.restart_cooldown) : 0)

          // Use backend's extend_availability data
          const extendAvailability = details?.runtime?.extend
          const thresholdSec = extendAvailability?.threshold_seconds || DEFAULT_EXTEND_THRESHOLD_SECONDS
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

          let displayUrl = ''
          let ncCommand = ''

          if (isRunning && endpoint) {
            if (isTcp) {
              const match = endpoint.match(/tcp:\/\/(.*):(\d+)/)
              if (match) {
                ncCommand = `nc ${match[1]} ${match[2]}`
              } else {
                ncCommand = endpoint
              }
            } else {
              displayUrl = endpoint
            }
          }

          return (
            <div key={idx} className={`group flex flex-col gap-2 p-3 ${'bg-card border border-border rounded-xl'} hover:border-blue-500/40`}>
              <div className="flex items-center gap-2">
                <code className="select-none text-[13px] md:text-sm font-mono text-gray-900 dark:text-cyan-300 break-all flex-1 font-semibold">{service}</code>
                <button
                  type="button"
                  className={`select-none p-1.5 text-gray-500 hover:text-green-600 disabled:opacity-50 dark:text-gray-400 dark:hover:text-green-400 md:p-2 ${'inline-flex items-center justify-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground caret-transparent transition-all hover:border-ring/40 hover:bg-muted focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0'}`}
                  onClick={() => handleServiceAction(service, 'up')}
                  title="Start Service"
                  disabled={serviceActionLoading[service] || isRunning}
                >
                  {serviceActionLoading[service] ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                </button>
                <button
                  type="button"
                  className={`flex select-none items-center gap-1 p-1.5 text-gray-500 hover:text-yellow-600 disabled:opacity-50 dark:text-gray-400 dark:hover:text-yellow-400 md:p-2 ${'inline-flex items-center justify-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground caret-transparent transition-all hover:border-ring/40 hover:bg-muted focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0'}`}
                  onClick={() => handleServiceAction(service, 'restart')}
                  title={(() => {
                    if (serviceActionLoading[service]) return 'Please wait...'
                    if (!isRunning) return 'Cannot restart: service is not running'
                    if (restartCooldownSec && restartCooldownSec > 0) return `Restart cooldown: ${formatSecs(restartCooldownSec)}`
                    return 'Restart Service'
                  })()}
                  disabled={serviceActionLoading[service] || !isRunning || (restartCooldownSec && restartCooldownSec > 0)}
                >
                  {serviceActionLoading[service] ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                  {formatMinutes(restartCooldownSec) && (
                    <span className="text-[10px] text-yellow-300 font-semibold">
                      {formatMinutes(restartCooldownSec)}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className={`flex select-none items-center gap-1 p-1.5 text-gray-500 hover:text-blue-600 disabled:opacity-50 dark:text-gray-400 dark:hover:text-blue-400 md:p-2 ${'inline-flex items-center justify-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground caret-transparent transition-all hover:border-ring/40 hover:bg-muted focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0'}`}
                  onClick={() => handleServiceAction(service, 'extend')}
                  title={(() => {
                    if (serviceActionLoading[service]) return 'Please wait...'
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
                  disabled={serviceActionLoading[service] || !isRunning || !remainingSec || !canExtend}
                >
                  {serviceActionLoading[service] ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
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
                    isTcp && ncCommand ? (
                      <div className="flex items-center gap-2">
                        <code className="flex-1 select-all break-all rounded-lg border border-gray-300/60 bg-gray-200/50 px-2.5 py-1.5 font-mono text-[13px] text-gray-900 shadow-inner dark:border-gray-700/70 dark:bg-black/40 dark:text-green-300">
                          {ncCommand}
                        </code>
                        <button
                          className="select-none rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-[13px] font-bold text-green-700 shadow-sm transition hover:bg-green-500/20 dark:text-green-300"
                          onClick={() => {
                            navigator.clipboard.writeText(ncCommand)
                            toast.success('Copied nc command')
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    ) : displayUrl ? (
                      <div className="flex items-center gap-2">
                        <a href={displayUrl} target="_blank" rel="noreferrer" className="flex-1 select-none break-all rounded-lg border border-blue-500/20 bg-blue-500/10 p-2 text-[13px] font-semibold text-blue-600 shadow-inner transition hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300 md:text-sm">
                          {displayUrl}
                        </a>
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

