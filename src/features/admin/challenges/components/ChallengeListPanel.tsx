import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShieldAlert } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui'
import { EmptyState } from '@/shared/components'
import ChallengeFilterBar from '@/features/challenges/components/ChallengeFilterBar'
import ChallengeListItem from './ChallengeListItem'
import type { AdminChallengeEventId, AdminChallengeFilterState, Challenge, Event } from '../types'

interface ChallengeListPanelProps {
  challenges: Challenge[]
  filteredChallenges: Challenge[]
  events: Event[]
  filters: AdminChallengeFilterState
  selectedEventId: AdminChallengeEventId
  isRefreshing: boolean
  isGlobalAdmin: boolean
  onFiltersChange: React.Dispatch<React.SetStateAction<AdminChallengeFilterState>>
  onEventChange: (eventId: AdminChallengeEventId) => void
  onAdd: () => void
  onEdit: (challenge: Challenge) => void
  onDelete: (id: string) => void
  onViewFlag: (id: string) => void
  onToggleActive: (id: string, checked: boolean) => Promise<unknown>
  onToggleMaintenance: (id: string, checked: boolean) => Promise<unknown>
}

const ChallengeListPanel: React.FC<ChallengeListPanelProps> = ({
  challenges,
  filteredChallenges,
  events,
  filters,
  selectedEventId,
  isRefreshing,
  isGlobalAdmin,
  onFiltersChange,
  onEventChange,
  onAdd,
  onEdit,
  onDelete,
  onViewFlag,
  onToggleActive,
  onToggleMaintenance,
}) => {
  return (
    <motion.div className="lg:col-span-3 order-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Challenge List</span>
              {isRefreshing && (
                <div className="flex items-center gap-2 text-[10px] font-medium text-orange-500 animate-pulse">
                  <div className="w-1 h-1 rounded-full bg-orange-500 animate-bounce" />
                  SYNCING...
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isGlobalAdmin && (
                <>
                  <Link href="/admin/event"><Button variant="outline" size="sm">Events</Button></Link>
                  <Link href="/admin/admins"><Button variant="outline" size="sm">Roles</Button></Link>
                </>
              )}
              <Button onClick={onAdd} size="sm">+ Add Challenge</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChallengeFilterBar
            filters={filters}
            categories={Array.from(new Set(challenges.map(c => c.category))).filter(Boolean).sort()}
            difficulties={Array.from(new Set(challenges.map(c => c.difficulty)))}
            onFilterChange={v => onFiltersChange({ ...filters, ...v })}
            onClear={() => onFiltersChange({ category: "all", difficulty: "all", search: "", feature: "N" })}
            events={events.map(e => ({ id: e.id, name: e.name, start_time: e.start_time, end_time: e.end_time }))}
            selectedEventId={selectedEventId}
            onEventChange={onEventChange}
            hideAllEventOption={!isGlobalAdmin}
            hideMainEventOption={!isGlobalAdmin}
          />

          <div className="mt-4 space-y-2">
            {filteredChallenges.length === 0 ? (
              <EmptyState
                icon={<ShieldAlert className="w-full h-full" />}
                title="No challenges found"
                description="Try adjusting your filters or add a new challenge."
                containerHeight="py-8"
              />
            ) : (
              <div className="divide-y border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                {filteredChallenges.map(challenge => (
                  <ChallengeListItem
                    key={challenge.id}
                    challenge={challenge}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onViewFlag={onViewFlag}
                    onToggleMaintenance={onToggleMaintenance}
                    onToggleActive={onToggleActive}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default ChallengeListPanel
