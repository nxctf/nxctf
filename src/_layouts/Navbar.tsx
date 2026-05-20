'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Compass, BookOpen, Flag, Trophy, Shield, Users, Gavel,
  User, ChevronDown, Menu, LogOut, LayoutDashboard,
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

import APP from '@/config'
import ImageWithFallback from '@/shared/components/ImageWithFallback'
import { useAuth } from '@/shared/contexts/AuthContext'
import { useTheme } from '@/shared/contexts/ThemeContext'
import { Button } from '@/shared/ui/button'
import { Separator } from '@/shared/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/shared/ui/sheet'
import { ThemeToggle } from '@/shared/ui/theme-toggle'
import { cn } from '@/shared/lib/utils'

const NavbarLogsButton = dynamic(() => import('./components/NavbarLogsButton'), { ssr: false })
const NavbarNotifications = dynamic(() => import('@/widgets/notifications/NavbarNotifications'), { ssr: false })
const DevConfig = dynamic(() => import('@/widgets/dev-config'), { ssr: false })

const NAV_LINK_BASE = 'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium caret-transparent transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0'
const NAV_LINK_IDLE = 'text-foreground/70 hover:bg-muted hover:text-foreground'
const NAV_LINK_ACTIVE = 'bg-primary/10 text-primary ring-1 ring-primary/20'
const NAV_DROPDOWN = 'absolute left-0 z-50 mt-2 min-w-50 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground'
const NAV_DROPDOWN_ITEM = 'block px-3 py-2 text-sm transition-colors hover:bg-muted hover:text-foreground'

export default function Navbar() {
  const router = useRouter()
  const { user, setUser, loading } = useAuth()
  const pathname = usePathname()

  const [adminStatus, setAdminStatus] = useState(false)
  const [globalAdminStatus, setGlobalAdminStatus] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scoreboardOpen, setScoreboardOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const scoreboardMenuRef = useRef<HTMLDivElement>(null)
  const docsMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const { theme } = useTheme()
  const avatarSrc = user?.profile_picture_url || user?.picture || null

  useEffect(() => {
    if (!user) {
      setAdminStatus(false)
      setGlobalAdminStatus(false)
      return
    }
    let active = true
    import('@/features/admin/services/admin.service')
      .then(async ({ AdminService }) => {
        const [admin, globalAdmin] = await Promise.all([
          AdminService.isAdmin(),
          AdminService.isGlobalAdmin(),
        ])
        if (!active) return
        setAdminStatus(admin)
        setGlobalAdminStatus(globalAdmin)
      })
      .catch(() => {
        if (!active) return
        setAdminStatus(false)
        setGlobalAdminStatus(false)
      })
    return () => { active = false }
  }, [user])

  const handleLogout = async () => {
    setMobileOpen(false)
    setUserMenuOpen(false)
    const { AuthService } = await import('@/features/auth/services/auth.service')
    await AuthService.signOut()
    setUser(null)
    setAdminStatus(false)
    setGlobalAdminStatus(false)
    router.push('/login')
  }

  const showTeamScoreboard = APP.teams.enabled
  const showUserScoreboard = !showTeamScoreboard || !APP.teams.hideScoreboardIndividual
  const scoreboardOptionCount = Number(showUserScoreboard) + Number(showTeamScoreboard)
  const routeActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const scoreboardActive = routeActive('/scoreboard') || routeActive('/teams/scoreboard')
  const infoActive = routeActive('/info') || routeActive('/rules')
  const navLink = (active = false) => cn(NAV_LINK_BASE, active ? NAV_LINK_ACTIVE : NAV_LINK_IDLE)

  useEffect(() => {
    if (!scoreboardOpen) return
    const handler = (e: MouseEvent) => {
      if (!scoreboardMenuRef.current?.contains(e.target as Node)) setScoreboardOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [scoreboardOpen])

  useEffect(() => {
    if (!docsOpen) return
    const handler = (e: MouseEvent) => {
      if (!docsMenuRef.current?.contains(e.target as Node)) setDocsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [docsOpen])

  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

  if (loading) return null

  const MobileNavLink = ({
    href,
    icon: Icon,
    children,
    target,
  }: {
    href: string
    icon: React.ElementType
    children: React.ReactNode
    target?: string
  }) => (
    <Link
      href={href}
      target={target}
      onClick={() => setMobileOpen(false)}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-foreground/70 hover:bg-muted hover:text-foreground"
    >
      <Icon size={16} className="shrink-0 text-muted-foreground" />
      {children}
    </Link>
  )

  return (
    <>
      <nav className="fixed top-0 left-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">

          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="group flex items-center gap-2.5 rounded-lg caret-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              data-tour="navbar-logo"
            >
              <ImageWithFallback
                src={APP.image_logo}
                alt={`${APP.shortName} logo`}
                size={32}
                className="rounded-full"
              />
              <span className="text-base font-bold tracking-tight transition-colors group-hover:text-primary">
                {APP.shortName}
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden items-center gap-0.5 md:flex">
              {user && (
                <Link href="/challenges" className={navLink(routeActive('/challenges'))} data-tour="navbar-challenges">
                  <Flag size={15} /> Challenges
                </Link>
              )}

              {user && scoreboardOptionCount > 0 && (
                scoreboardOptionCount === 1 ? (
                  <Link
                    href={showTeamScoreboard ? '/teams/scoreboard' : '/scoreboard'}
                    className={navLink(scoreboardActive)}
                    data-tour="navbar-scoreboard"
                  >
                    <Trophy size={15} /> Scoreboard
                  </Link>
                ) : (
                  <div ref={scoreboardMenuRef} className="relative">
                    <button
                      type="button"
                      data-tour="navbar-scoreboard"
                      onClick={() => setScoreboardOpen(v => !v)}
                      className={navLink(scoreboardActive)}
                    >
                      <Trophy size={15} /> Scoreboard
                      <ChevronDown className={cn('h-3 w-3 opacity-60 transition-transform duration-200', scoreboardOpen && 'rotate-180')} />
                    </button>
                    {scoreboardOpen && (
                      <div className={NAV_DROPDOWN}>
                        {showUserScoreboard && (
                          <Link href="/scoreboard" onClick={() => setScoreboardOpen(false)} className={NAV_DROPDOWN_ITEM}>
                            <User size={14} className="mr-2 inline-block opacity-60" /> User Scoreboard
                          </Link>
                        )}
                        {showTeamScoreboard && (
                          <Link href="/teams/scoreboard" onClick={() => setScoreboardOpen(false)} className={NAV_DROPDOWN_ITEM}>
                            <Users size={14} className="mr-2 inline-block opacity-60" /> Team Scoreboard
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )
              )}

              {user && APP.teams.enabled && (
                <Link
                  href="/teams"
                  className={navLink(routeActive('/teams') && !routeActive('/teams/scoreboard'))}
                >
                  <Users size={15} /> Teams
                </Link>
              )}

              <div ref={docsMenuRef} className="relative">
                <button
                  type="button"
                  data-tour="navbar-docs"
                  onClick={() => setDocsOpen(v => !v)}
                  className={navLink(infoActive)}
                >
                  <Compass size={15} /> Info
                  <ChevronDown className={cn('h-3 w-3 opacity-60 transition-transform duration-200', docsOpen && 'rotate-180')} />
                </button>
                {docsOpen && (
                  <div className={NAV_DROPDOWN}>
                    <Link href="/info" onClick={() => setDocsOpen(false)} className={NAV_DROPDOWN_ITEM} data-tour="navbar-info">
                      <Compass size={14} className="mr-2 inline-block opacity-60" /> Info
                    </Link>
                    <Link href="/rules" onClick={() => setDocsOpen(false)} className={NAV_DROPDOWN_ITEM} data-tour="navbar-rules">
                      <Gavel size={14} className="mr-2 inline-block opacity-60" /> Rules
                    </Link>
                    <Link href={APP.nxctf.nxctf_docs} target="_blank" onClick={() => setDocsOpen(false)} className={NAV_DROPDOWN_ITEM} data-tour="navbar-docs">
                      <BookOpen size={14} className="mr-2 inline-block opacity-60" /> Docs
                    </Link>
                  </div>
                )}
              </div>

              {adminStatus && user && (
                <Link href="/admin" className={navLink(routeActive('/admin'))}>
                  <Shield size={15} /> Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right: Actions + User */}
          <div className="flex items-center gap-1.5">
            {user && (
              <>
                <NavbarNotifications globalAdminStatus={globalAdminStatus} />
                <NavbarLogsButton theme={theme} pathname={pathname} />
              </>
            )}

            <DevConfig />
            <ThemeToggle />

            {/* Desktop: User dropdown or auth buttons */}
            <div className="hidden md:flex items-center gap-2 ml-1">
              {user ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    type="button"
                    data-tour="navbar-profile"
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 caret-transparent"
                  >
                    <ImageWithFallback src={avatarSrc} alt={user.username} size={28} className="rounded-full ring-2 ring-border" />
                    <span className="max-w-30 truncate text-sm font-semibold">
                      {user.username}
                    </span>
                    <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-200', userMenuOpen && 'rotate-180')} />
                  </button>

                  {userMenuOpen && (
                    <div className={cn(NAV_DROPDOWN, 'right-0 left-auto w-56')}>
                      <div className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <ImageWithFallback src={avatarSrc} alt={user.username} size={36} className="rounded-full ring-2 ring-border shrink-0" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{user.username}</p>
                            {user.score !== undefined && (
                              <p className="text-xs text-muted-foreground">{user.score.toLocaleString()} pts</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Separator className="my-1" />
                      <Link href="/profile" onClick={() => setUserMenuOpen(false)} className={NAV_DROPDOWN_ITEM}>
                        <User size={14} className="mr-2 inline-block opacity-60" /> Profile
                      </Link>
                      {adminStatus && (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)} className={NAV_DROPDOWN_ITEM}>
                          <LayoutDashboard size={14} className="mr-2 inline-block opacity-60" /> Admin Panel
                        </Link>
                      )}
                      <Separator className="my-1" />
                      <button
                        onClick={handleLogout}
                        className={cn(NAV_DROPDOWN_ITEM, 'w-full text-left text-destructive hover:bg-destructive/10 hover:text-destructive')}
                      >
                        <LogOut size={14} className="mr-2 inline-block opacity-70" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">Register</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile hamburger via Sheet */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="ml-1 flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                showCloseButton={false}
                className="w-70 border-l border-border bg-background p-0"
              >
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ImageWithFallback src={APP.image_logo} alt={APP.shortName} size={24} className="rounded-full" />
                      <span className="text-sm font-bold">{APP.shortName}</span>
                    </div>
                  </div>

                  {user && (
                    <div className="border-b border-border px-4 py-3">
                      <Link
                        href="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                      >
                        <ImageWithFallback src={avatarSrc} alt={user.username} size={40} className="rounded-full ring-2 ring-border shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{user.username}</p>
                          {user.score !== undefined && (
                            <p className="text-xs text-muted-foreground">{user.score.toLocaleString()} pts</p>
                          )}
                        </div>
                      </Link>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
                    {user && (
                      <MobileNavLink href="/challenges" icon={Flag}>Challenges</MobileNavLink>
                    )}

                    {user && scoreboardOptionCount > 0 && (
                      scoreboardOptionCount === 1 ? (
                        <MobileNavLink href={showTeamScoreboard ? '/teams/scoreboard' : '/scoreboard'} icon={Trophy}>
                          Scoreboard
                        </MobileNavLink>
                      ) : (
                        <>
                          {showUserScoreboard && (
                            <MobileNavLink href="/scoreboard" icon={User}>User Scoreboard</MobileNavLink>
                          )}
                          {showTeamScoreboard && (
                            <MobileNavLink href="/teams/scoreboard" icon={Users}>Team Scoreboard</MobileNavLink>
                          )}
                        </>
                      )
                    )}

                    {user && APP.teams.enabled && (
                      <MobileNavLink href="/teams" icon={Users}>Teams</MobileNavLink>
                    )}

                    <div className="py-1">
                      <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Info</p>
                      <MobileNavLink href="/info" icon={Compass}>Info</MobileNavLink>
                      <MobileNavLink href="/rules" icon={Gavel}>Rules</MobileNavLink>
                      <MobileNavLink href={APP.nxctf.nxctf_docs} icon={BookOpen} target="_blank">Docs</MobileNavLink>
                    </div>

                    {user && adminStatus && (
                      <>
                        <Separator className="my-2" />
                        <MobileNavLink href="/admin" icon={Shield}>Admin Panel</MobileNavLink>
                      </>
                    )}
                  </div>

                  <div className="border-t border-border px-3 py-3">
                    <div className="mb-2 flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <span className="text-sm font-medium">Theme</span>
                      <ThemeToggle />
                    </div>
                    {user ? (
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <LogOut size={16} className="shrink-0" />
                        Sign out
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button asChild className="w-full">
                          <Link href="/login" onClick={() => setMobileOpen(false)}>Sign in</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                          <Link href="/register" onClick={() => setMobileOpen(false)}>Register</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </>
  )
}
