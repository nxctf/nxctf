"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AuditUserLookupService } from '@/features/admin/overview/services/audit-user-lookup.service'

interface EmailWithUsernameTooltipProps {
  email: string
  cachedUsername: string | null | undefined
  onUsernameLoaded: (email: string, username: string | null) => void
}

export const EmailWithUsernameTooltip: React.FC<EmailWithUsernameTooltipProps> = ({ 
  email, 
  cachedUsername, 
  onUsernameLoaded 
}) => {
  const [username, setUsername] = useState<string | null | undefined>(cachedUsername)
  const [isLoading, setIsLoading] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const emailRef = useRef<HTMLElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setUsername(cachedUsername)
  }, [cachedUsername])

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(async () => {
      const rect = emailRef.current?.getBoundingClientRect()
      if (rect) {
        setTooltipPos({
          x: rect.left + rect.width / 2,
          y: rect.top
        })
      }

      if (username !== undefined || isLoading) {
        setShowTooltip(true)
        return
      }

      setIsLoading(true)
      abortControllerRef.current = new AbortController()

      try {
        const result = await AuditUserLookupService.getUsernameByEmail(email)
        if (!abortControllerRef.current?.signal.aborted) {
          setUsername(result)
          onUsernameLoaded(email, result)
          setShowTooltip(true)
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error fetching username:', err)
        }
      } finally {
        setIsLoading(false)
      }
    }, 300)
  }, [email, username, isLoading, onUsernameLoaded])

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setShowTooltip(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [])

  return (
    <div className="relative inline-block">
      {username ? (
        <Link
          ref={(node) => { emailRef.current = node }}
          href={`/user/${encodeURIComponent(username)}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="truncate text-sm text-blue-600 dark:text-blue-400 font-medium border-b border-dotted border-blue-400 hover:border-solid transition-all"
        >
          {email}
        </Link>
      ) : (
        <span
          ref={(node) => { emailRef.current = node }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="truncate text-sm text-gray-700 dark:text-gray-300 font-medium border-b border-dotted border-gray-400 hover:border-solid transition-all cursor-help"
        >
          {email}
        </span>
      )}

      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: -4 }}
          className="fixed z-50 px-3 py-2 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap pointer-events-none"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y - 40}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold">
            {isLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : username ? (
              <>
                <span className="text-gray-400">Username: </span>
                <span className="text-blue-300">{username}</span>
              </>
            ) : (
              <span className="text-gray-400">No username found</span>
            )}
          </div>
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </motion.div>
      )}
    </div>
  )
}
