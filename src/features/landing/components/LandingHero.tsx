import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import APP from '@/config'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

export function LandingHero({ authenticated }: { authenticated: boolean }) {
  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col justify-center gap-8 py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative flex flex-col gap-6 max-w-3xl">
        <Badge variant="outline" className="w-fit gap-2 font-mono text-xs">
          <span className="inline-block size-1.5 rounded-full bg-primary" />
          {APP.flagFormat}
        </Badge>

        <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl xl:text-7xl">
          {APP.fullName}
        </h1>

        <p className="max-w-lg text-base text-muted-foreground sm:text-lg leading-relaxed">
          Modern CTF platform with clean event operations, fast challenge
          workflows, and reliable team collaboration.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button asChild size="lg">
            <Link href={authenticated ? '/challenges' : '/login'}>
              {authenticated ? 'Enter Arena' : 'Get Started'}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/info">About Platform</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
