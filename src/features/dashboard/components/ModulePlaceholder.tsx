import Link from 'next/link'
import { Construction, ExternalLink } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Separator } from '@/shared/ui/separator'

export function ModulePlaceholder({
  title,
  description,
  legacyHref,
  features = [],
}: {
  title: string
  description: string
  legacyHref: string
  features?: string[]
}) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
            <Construction className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{title}</p>
            <p className="max-w-sm text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className="text-[10px]">In progress</Badge>
          <Button asChild variant="outline" size="sm">
            <Link href={legacyHref}>
              Open admin
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {features.length > 0 ? (
        <>
          <Separator />
          <div className="p-6">
            <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Planned features
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {features.map((feat) => (
                <li key={feat} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {feat}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  )
}
