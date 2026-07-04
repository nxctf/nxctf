'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import PageBackground from '@/shared/components/PageBackground'
import { THEME_PRIMARY_SELECTION_CLASS } from '@/shared/styles'
import AdminContent from './AdminContent'
import AdminHeader from './AdminHeader'
import AdminSidebar from './AdminSidebar'
import { useAuth } from '@/shared/contexts/AuthContext'
import AdminContentLoading from './AdminContentLoading'
import { AuthService } from '@/features/auth'
import { getVisibleAdminNavItems, isAdminNavItemActive, type AdminNavScope } from './admin-navigation'

type AdminRouteShellProps = {
  children: ReactNode
}

export default function AdminRouteShell({ children }: AdminRouteShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Initialize scope from sessionStorage synchronously (safe since SSR is disabled for this layout)
  const [adminScope, setAdminScope] = useState<AdminNavScope | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('admin_scope')
        return cached ? JSON.parse(cached) : null
      } catch (e) {
        return null
      }
    }
    return null
  })

  const [scopeLoading, setScopeLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('admin_scope')
    }
    return true
  })

  // Background revalidation from Supabase (Stale-While-Revalidate)
  useEffect(() => {
    let active = true

    const loadScope = async () => {
      if (authLoading) return
      if (!user) {
        setAdminScope(null)
        setScopeLoading(false)
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('admin_scope')
        }
        return
      }

      // If we don't have a cached value, set scopeLoading to true
      const cached = typeof window !== 'undefined' ? sessionStorage.getItem('admin_scope') : null
      if (!cached) {
        setScopeLoading(true)
      }

      try {
        const scope = await AuthService.getAdminScope()
        if (!active) return

        setAdminScope(scope)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('admin_scope', JSON.stringify(scope))
        }
      } catch (err) {
        console.error('Failed to load admin scope:', err)
      } finally {
        if (active) {
          setScopeLoading(false)
        }
      }
    }

    void loadScope()

    return () => {
      active = false
    }
  }, [authLoading, user])

  const navItems = useMemo(() => getVisibleAdminNavItems(adminScope), [adminScope])

  useEffect(() => {
    if (authLoading || scopeLoading || !adminScope || adminScope.is_global_admin || adminScope.event_ids.length === 0) {
      return
    }

    const canViewCurrentPath = navItems.some((item) => isAdminNavItemActive(pathname, item))
    if (!canViewCurrentPath) {
      router.replace('/admin/challenges')
    }
  }, [adminScope, authLoading, navItems, pathname, router, scopeLoading])

  // We render the navbar shell (Sidebar and Header) instantly from the cache,
  // and only render the loading spinner inside the content panel if the scope is not loaded.
  // Note: authLoading is handled by nested subpages themselves, so we do not block rendering children
  // when authLoading is true to prevent duplicate/stacked loaders.
  return (
    <PageBackground
      selectionClassName={THEME_PRIMARY_SELECTION_CLASS}
      contentClassName="relative z-10 min-h-[calc(100lvh-3.5rem)] w-full"
    >
      <AdminSidebar pathname={pathname} items={navItems} />

      <div className="min-w-0 lg:pl-60">
        <div className="flex min-h-[calc(100lvh-3.5rem)] min-w-0 flex-col">
          <AdminHeader pathname={pathname} items={navItems} />
          <AdminContent>
            {scopeLoading ? (
              <AdminContentLoading />
            ) : (
              children
            )}
          </AdminContent>
        </div>
      </div>
    </PageBackground>
  )
}
