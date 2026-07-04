import React from 'react'
import APP from '@/config'
import { NXCTF } from '@/_vars/const'
import { THEME_PRIMARY_PILL_CLASS } from '@/shared/styles'

interface AuthHeaderProps {
  badge?: string
  title: string
  subtitle?: string
}

export function AuthHeader({ badge, title, subtitle }: AuthHeaderProps) {
  const logoUrl = NXCTF.nxctf_logo || APP.image_logo

  return (
    <div className="mb-5 flex flex-col items-start text-left w-full">
      {/* Top Row: Logo (left) & Badge (right) */}
      <div className="mb-0.5 flex w-full items-center justify-between">
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Logo"
            className="h-16 w-16 object-contain select-none"
          />
        )}
        {badge ? (
          <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${THEME_PRIMARY_PILL_CLASS}`}>
            {badge}
          </div>
        ) : null}
      </div>

      <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white sm:text-2xl">
        {title}
      </h1>

      {subtitle && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      )}
    </div>
  )
}
