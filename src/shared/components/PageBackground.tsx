import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
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
  backgroundOpacity?: number // 0–100, default 25
}

export default function PageBackground({
  children,
  className,
  contentClassName,
  showOrbs = true,
  selectionClassName,
  backgroundUrl,
  backgroundOpacity = 15,
}: PageBackgroundProps) {
  return (
    <div className={cn(PAGE_BG_BASE_CLASS, selectionClassName, className)}>
      {/* Custom background image layer */}
      {backgroundUrl && (
        <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgroundUrl}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: backgroundOpacity / 100 }}
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
