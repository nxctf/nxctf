'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import { cn } from '@/shared/lib/utils'
import { PAGE_BACKGROUNDS } from '@/_vars/bg'
import {
  PAGE_BG_BASE_CLASS,
  PAGE_BG_ORBS_WRAPPER_CLASS,
  PAGE_BG_ORB_BOTTOM_RIGHT_CLASS,
  PAGE_BG_ORB_TOP_LEFT_CLASS,
} from '@/shared/styles/page-background'

type PageBackgroundProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  showOrbs?: boolean
  selectionClassName?: string
  backgroundUrl?: string
  backgroundOpacity?: number // 0–100
}

export default function PageBackground({
  children,
  className,
  contentClassName,
  showOrbs = true,
  selectionClassName,
  backgroundUrl,
  backgroundOpacity,
}: PageBackgroundProps) {
  const pathname = usePathname()

  // Get background from config based on current route if not provided explicitly
  let resolvedUrl = backgroundUrl
  let resolvedOpacity = backgroundOpacity ?? 15

  if (!resolvedUrl && pathname) {
    let pageKey = 'default'
    if (pathname === '/') {
      pageKey = 'home'
    } else if (pathname.split('/').includes('scoreboard')) {
      pageKey = 'scoreboard'
    } else {
      const firstSegment = pathname.split('/').filter(Boolean)[0]
      if (firstSegment && firstSegment in PAGE_BACKGROUNDS) {
        pageKey = firstSegment
      }
    }
    const bgConfig = (PAGE_BACKGROUNDS[pageKey as keyof typeof PAGE_BACKGROUNDS] || PAGE_BACKGROUNDS.default) as { url: string; opacity: number }
    resolvedUrl = bgConfig.url
    resolvedOpacity = backgroundOpacity ?? bgConfig.opacity ?? 15
  }

  return (
    <div className={cn(PAGE_BG_BASE_CLASS, selectionClassName, className)}>
      {/* Custom background image layer */}
      {resolvedUrl && (
        <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvedUrl}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: resolvedOpacity / 100 }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#fafafa]/80 dark:to-[#0b0f19]/80" />
        </div>
      )}

      {showOrbs ? (
        <div className={PAGE_BG_ORBS_WRAPPER_CLASS}>
          <div className={PAGE_BG_ORB_TOP_LEFT_CLASS} />
          <div className={PAGE_BG_ORB_BOTTOM_RIGHT_CLASS} />
        </div>
      ) : null}

      {contentClassName ? (
        <div className={contentClassName}>
          {children}
        </div>
      ) : children}
    </div>
  )
}
