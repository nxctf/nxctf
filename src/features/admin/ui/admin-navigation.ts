import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CalendarDays,
  Flag,
  LayoutDashboard,
  Server,
  Users,
  User,
  ShieldCheck,
  Settings,
  FolderOpen,
} from 'lucide-react'

export type AdminNavItem = {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  aliases?: string[]
}

export type AdminNavScope = {
  is_global_admin: boolean
  event_ids: string[]
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: '/admin/overview',
    label: 'Overview',
    icon: LayoutDashboard,
    aliases: ['/admin'],
  },
  {
    href: '/admin/event',
    label: 'Events',
    icon: CalendarDays,
  },
  {
    href: '/admin/challenges',
    label: 'Challenges',
    icon: Flag,
  },
  {
    href: '/admin/categories',
    label: 'Categories',
    icon: FolderOpen,
  },
  {
    href: '/admin/services',
    label: 'Services',
    icon: Server,
  },
  {
    href: '/admin/solvers',
    label: 'Solves',
    icon: BarChart3,
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: User,
  },
  {
    href: '/admin/teams',
    label: 'Teams',
    icon: Users,
  },
  {
    href: '/admin/audit-logs',
    label: 'Audit Logs',
    icon: ShieldCheck,
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: Settings,
  },
]

const EVENT_ADMIN_NAV_HREFS = new Set(['/admin/challenges', '/admin/solvers'])

export function getVisibleAdminNavItems(scope: AdminNavScope | null | undefined) {
  if (!scope || scope.is_global_admin) return ADMIN_NAV_ITEMS
  if (scope.event_ids.length === 0) return []
  return ADMIN_NAV_ITEMS.filter((item) => EVENT_ADMIN_NAV_HREFS.has(item.href))
}

export function getAdminNavItem(pathname: string) {
  return ADMIN_NAV_ITEMS.find((item) => isAdminNavItemActive(pathname, item)) ?? ADMIN_NAV_ITEMS[0]
}

export function isAdminNavItemActive(pathname: string, item: AdminNavItem) {
  if (item.aliases?.some((alias) => pathname === alias)) {
    return true
  }
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
