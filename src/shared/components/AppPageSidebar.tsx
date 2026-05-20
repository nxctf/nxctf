"use client"

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { ArrowRight, Info, ScrollText, UserCircle2 } from 'lucide-react'

import { SidebarItem, SidebarSection } from '@/shared/components/sidebar'

type SidebarLink = {
  href: string
  label: string
  description?: string
  icon?: ReactNode
}

type AppPageSidebarProps = {
  title: string
  description?: string
  links?: SidebarLink[]
  footer?: ReactNode
}

const fallbackLinks: SidebarLink[] = [
  {
    href: '/profile',
    label: 'Profile',
    description: 'Account and progress.',
    icon: <UserCircle2 className="h-4 w-4" />,
  },
  {
    href: '/info',
    label: 'Info',
    description: 'Platform details.',
    icon: <Info className="h-4 w-4" />,
  },
  {
    href: '/rules',
    label: 'Rules',
    description: 'Fair-play guide.',
    icon: <ScrollText className="h-4 w-4" />,
  },
]

export function AppPageSidebar({
  title,
  description,
  links = fallbackLinks,
  footer,
}: AppPageSidebarProps) {
  const pathname = usePathname()

  return (
    <div className="space-y-4 p-3">
      <SidebarSection title={title} description={description}>
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
          return (
            <SidebarItem
              key={link.href}
              href={link.href}
              active={active}
              iconNode={link.icon}
              label={link.label}
              description={link.description}
              trailing={<ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5" />}
            />
          )
        })}
      </SidebarSection>
      {footer}
    </div>
  )
}
