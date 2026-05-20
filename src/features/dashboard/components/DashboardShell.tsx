'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { BarChart3, Calendar, Flag, LayoutDashboard, Menu, ShieldCheck } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Separator } from '@/shared/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/challenges', label: 'Challenges', icon: Flag, exact: false },
  { href: '/admin/event', label: 'Events', icon: Calendar, exact: false },
  { href: '/admin/solvers', label: 'Solvers', icon: BarChart3, exact: false },
  { href: '/admin/admins', label: 'Admins', icon: ShieldCheck, exact: false },
] as const

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: typeof Flag
  exact?: boolean
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-primary text-primary-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  )
}

function SidebarBrand() {
  return (
    <div className="flex h-12 items-center gap-2 px-4">
      <div className="flex h-5 w-5 items-center justify-center rounded bg-primary">
        <ShieldCheck className="h-3 w-3 text-primary-foreground" />
      </div>
      <span className="text-sm font-semibold">Admin</span>
      <Badge variant="outline" className="ml-auto px-1.5 py-0 text-[10px]">
        Dashboard
      </Badge>
    </div>
  )
}

export function DashboardShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode
  title: string
  subtitle?: string
}) {
  const pathname = usePathname()

  const activeItems = navItems.map((item) => ({
    ...item,
    active: item.exact ? pathname === item.href : pathname.startsWith(item.href),
  }))

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-card md:flex">
        <div className="border-b">
          <SidebarBrand />
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {activeItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="p-2">
          <Separator className="mb-2" />
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Back to site
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-12 items-center gap-3 border-b bg-background px-4 sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="md:hidden">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-56 p-0">
              <SheetHeader className="border-b px-0 py-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarBrand />
              </SheetHeader>
              <nav className="space-y-0.5 p-2">
                {activeItems.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="flex-1">
            <p className="text-sm font-semibold leading-none">{title}</p>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
