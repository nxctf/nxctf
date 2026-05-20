import type { LucideIcon } from 'lucide-react'
import { SegmentedTabs } from '@/shared/components'
import { cn } from '@/shared/lib/utils'

type UserTab<T extends string> = {
  value: T
  label: string
  icon: LucideIcon
}

type UserTabsProps<T extends string> = {
  tabs: UserTab<T>[]
  activeTab: T
  onChange: (tab: T) => void
  className?: string
}

export function UserTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className,
}: UserTabsProps<T>) {
  return (
    <SegmentedTabs
      items={tabs}
      value={activeTab}
      onChange={onChange}
      variant="panel"
      className={cn(className)}
    />
  )
}
