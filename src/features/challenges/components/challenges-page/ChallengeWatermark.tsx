'use client'

import APP from '@/config'
import { ImageWithFallback } from '@/shared/components'

export default function ChallengeWatermark() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center opacity-[0.015] dark:opacity-[0.01]">
      <ImageWithFallback
        src={APP.image_logo}
        alt={`${APP.shortName} watermark`}
        size={760}
        rounded={false}
      />
    </div>
  )
}
