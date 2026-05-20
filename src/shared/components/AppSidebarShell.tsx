"use client"

import type { ReactNode } from 'react'
import { Menu } from 'lucide-react'

import { Button, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui'

type AppSidebarShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
  sidebar: ReactNode
  mobileSidebarTitle?: string
}

export function AppSidebarShell({
  title,
  subtitle,
  children,
  sidebar,
  mobileSidebarTitle = 'Sidebar',
}: AppSidebarShellProps) {
  return (
    <div className="flex h-[calc(100lvh-3.5rem)] overflow-hidden">
      <aside className="hidden h-full w-64 shrink-0 border-r bg-background xl:block">
        <div className="h-full overflow-y-auto overscroll-contain p-3 scroll-hidden">
          <div className="min-h-full rounded-2xl border border-border bg-card shadow-xs">
            {sidebar}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b bg-background/80 px-4 py-3 backdrop-blur-sm sm:px-6 xl:hidden">
          <div className="flex items-start gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon-sm">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open sidebar</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b px-4 py-3">
                  <SheetTitle className="text-sm">{mobileSidebarTitle}</SheetTitle>
                </SheetHeader>
                <div className="h-full overflow-y-auto overscroll-contain p-3 scroll-hidden">
                  <div className="min-h-full rounded-2xl border border-border bg-card shadow-xs">
                    {sidebar}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{title}</p>
              {subtitle ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p> : null}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
          <div className="mb-4 hidden xl:block">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
