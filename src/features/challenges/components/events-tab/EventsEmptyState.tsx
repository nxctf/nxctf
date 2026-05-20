import { Inbox } from 'lucide-react'
import { EmptyState } from '@/shared/components'

export default function EventsEmptyState() {
  return (
    <EmptyState
      icon={<Inbox className="w-full h-full" />}
      title="No events scheduled yet"
      containerHeight="py-12"
    />
  )
}
