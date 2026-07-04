"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Database, Settings, ShieldAlert, MessageCircle, RefreshCw, Key, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui'
import { SUPABASE_URL, SUPABASE_ANON_KEY, MAINTENANCE_MODE, LINKS } from '@/_vars/const'
import { APP } from '@/config'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/shared/lib/utils'
import dynamic from 'next/dynamic'

// Dynamically import DevConfigDialog
const DevConfigDialog = dynamic(() => import('@/widgets/dev-config/components/DevConfigDialog'), { ssr: false })

function getCookie(name: string) {
  if (typeof document === 'undefined') return ''
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || ''
  return ''
}

export default function MaintenancePage() {
  const [mounted, setMounted] = useState(false)
  const [devConfigOpen, setDevConfigOpen] = useState(false)
  const [cookieError, setCookieError] = useState('')
  const [healthStatus, setHealthStatus] = useState<'checking' | 'online' | 'offline' | 'idle'>('idle')
  const [discordLink, setDiscordLink] = useState('https://discord.gg/5etKks6aQQ')
  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    setMounted(true)
    const rawError = getCookie('maintenance-error')
    if (rawError) {
      try {
        let decoded = decodeURIComponent(rawError)
        if (decoded.includes('%')) decoded = decodeURIComponent(decoded)
        setCookieError(decoded)
      } catch {
        setCookieError(rawError)
      }
    }

    const fetchDiscordLink = async () => {
      try {
        const { data } = await supabase.from('system_settings').select('value').eq('key', 'discord_link').single()
        if (data?.value) {
          setDiscordLink(data.value)
        }
      } catch (err) {
        // Fallback
      }
    }
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      fetchDiscordLink()
    }
  }, [])

  // Live Connectivity Check
  useEffect(() => {
    if (!mounted || !isDev || !SUPABASE_URL) return

    const checkHealth = async () => {
      setHealthStatus('checking')
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        // Ping the health check endpoint or just the base URL
        const res = await fetch(SUPABASE_URL, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        setHealthStatus('online')
      } catch (err) {
        setHealthStatus('offline')
      }
    }

    checkHealth()
  }, [mounted, isDev])

  if (!mounted) return null

  // Error Detection Logic
  const isManual = MAINTENANCE_MODE === 'yes'
  const isConfigMissing = !SUPABASE_URL || !SUPABASE_ANON_KEY

  let errorType: 'maintenance' | 'config' | 'database' | 'unknown' = 'unknown'
  if (isManual) errorType = 'maintenance'
  else if (isConfigMissing) errorType = 'config'
  else errorType = 'database'

  const messageMap = {
    maintenance: "The platform is currently under scheduled maintenance. We'll be back shortly.",
    config: "System configuration is incomplete. Supabase environment variables are missing.",
    database: cookieError || "Failed to establish a secure connection to the database engine.",
    unknown: "An unexpected system interruption has occurred."
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 font-sans antialiased relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-orange-600/[0.025] blur-2xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className={cn(
            "h-1.5 w-full",
            errorType === 'maintenance' ? "bg-orange-500" : "bg-red-500"
          )} />

          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                errorType === 'maintenance' ? "bg-orange-500/20 text-orange-500" : "bg-red-500/20 text-red-500"
              )}>
                {errorType === 'maintenance' ? <ShieldAlert size={24} /> :
                  errorType === 'config' ? <Settings size={24} /> : <Database size={24} />}
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">
                  {errorType === 'maintenance' ? 'System Maintenance' : 'System Unavailable'}
                </h1>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                  ID: {errorType.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                <p className="text-sm text-gray-300 leading-relaxed font-medium">
                  {messageMap[errorType]}
                </p>
              </div>

              {/* Diagnostic Panel (Dev Only) */}
              {isDev && (
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3 font-mono text-[11px]">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest flex items-center justify-between">
                    Dev Diagnostics
                    <span className="flex items-center gap-1.5">
                      {healthStatus === 'checking' && <Loader2 size={10} className="animate-spin" />}
                      {healthStatus === 'online' && <Wifi size={10} className="text-emerald-500" />}
                      {healthStatus === 'offline' && <WifiOff size={10} className="text-red-500" />}
                      <span className={cn(
                        "text-[8px]",
                        healthStatus === 'online' ? "text-emerald-500" :
                          healthStatus === 'offline' ? "text-red-500" : "text-gray-500"
                      )}>
                        {healthStatus.toUpperCase()}
                      </span>
                    </span>
                  </p>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-gray-400">
                      <span>SUPABASE_URL</span>
                      <span className={cn("font-bold", SUPABASE_URL ? "text-emerald-500" : "text-red-500")}>
                        {SUPABASE_URL ? (healthStatus === 'offline' ? 'UNREACHABLE' : 'CONNECTED') : 'MISSING'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-400">
                      <span>ANON_KEY</span>
                      <span className={cn("font-bold", SUPABASE_ANON_KEY ? "text-emerald-500" : "text-red-500")}>
                        {SUPABASE_ANON_KEY ? 'LOADED' : 'MISSING'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={() => window.location.reload()}
                size="sm"
                className="bg-white hover:bg-gray-200 text-black font-black uppercase tracking-widest h-10 px-4 rounded-xl flex-1 transition-all active:scale-95"
              >
                <RefreshCw size={14} className="mr-2" /> Retry
              </Button>

              {isDev && (
                <Button
                  onClick={() => setDevConfigOpen(true)}
                  size="sm"
                  className="bg-transparent hover:bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest h-10 px-4 rounded-xl transition-all active:scale-95"
                >
                  <Key size={14} className="mr-2" /> Fix
                </Button>
              )}

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-white font-black h-10 px-3 rounded-xl transition-all"
              >
                <a href={discordLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={16} />
                </a>
              </Button>
            </div>
          </div>

          <div className="px-6 py-4 bg-white/5 border-t border-white/5 text-center">
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">
              &copy; {new Date().getFullYear()} SOC &bull; Automated Failover System
            </p>
          </div>
        </div>
      </motion.div>

      {isDev && (
        <DevConfigDialog
          open={devConfigOpen}
          onOpenChange={setDevConfigOpen}
        />
      )}
    </div>
  )
}
