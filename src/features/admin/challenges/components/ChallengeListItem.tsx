import React from 'react'
import DifficultyBadge from '@/features/challenges/components/DifficultyBadge'
import { Badge, Button } from '@/shared/ui'
import { Pencil, Trash2, Flag, CheckCircle2, CircleOff, Wrench } from 'lucide-react'
import { Challenge } from '../types'

interface ChallengeListItemProps {
  challenge: Challenge
  onEdit: (challenge: Challenge) => void
  onDelete: (id: string) => void
  onViewFlag: (id: string) => void
  onToggleActive: (id: string, checked: boolean) => Promise<unknown>
  onToggleMaintenance: (id: string, checked: boolean) => Promise<unknown>
}

const ChallengeListItem: React.FC<ChallengeListItemProps> = ({
  challenge,
  onEdit,
  onDelete,
  onViewFlag,
  onToggleActive,
  onToggleMaintenance,
}) => {
  return (
    <div className="w-full px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 order-2 sm:order-1">
          <DifficultyBadge difficulty={challenge.difficulty} className="min-w-23" />

          <div className="min-w-0">
            <div className="font-medium truncate text-gray-900 dark:text-white">{challenge.title}</div>
            <div className="text-xs text-muted-foreground dark:text-gray-300 truncate flex items-center gap-2">
              <span className="truncate">{challenge.category} • {challenge.points} pts</span>
              {challenge.is_dynamic && (
                <>
                  <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-600 dark:text-white px-1 py-0.5">
                    <span className="inline-block min-w-3.5 text-center text-[10px] leading-4 font-semibold">D</span>
                  </Badge>
                  <span className="ml-1 text-[10px] text-gray-700 dark:text-gray-300 font-mono align-middle">
                    {`${challenge.max_points ?? '-'}-${challenge.min_points ?? '-'}-${challenge.decay_per_solve ?? '-'}`}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 justify-start sm:justify-end order-1 sm:order-2">
          <Button
            variant="ghost"
            size="icon"
            className={`${challenge.is_maintenance ? 'text-amber-500 dark:text-amber-400' : 'text-gray-400 dark:text-gray-600'}`}
            onClick={async () => onToggleMaintenance(challenge.id, !challenge.is_maintenance)}
            aria-label={challenge.is_maintenance ? "Disable Maintenance" : "Enable Maintenance"}
            title={challenge.is_maintenance ? "Disable Maintenance" : "Enable Maintenance"}
          >
            <Wrench size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`${challenge.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'}`}
            onClick={async () => onToggleActive(challenge.id, !challenge.is_active)}
            aria-label={challenge.is_active ? "Deactivate Challenge" : "Activate Challenge"}
            title={challenge.is_active ? "Deactivate Challenge" : "Activate Challenge"}
          >
            {challenge.is_active ? <CheckCircle2 size={16} /> : <CircleOff size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(challenge)}
            aria-label="Edit Challenge"
            title="Edit Challenge"
            className="text-blue-600 dark:text-blue-400"
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(challenge.id)}
            aria-label="Delete Challenge"
            title="Delete Challenge"
            className="text-red-600 dark:text-red-400"
          >
            <Trash2 size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewFlag(challenge.id)}
            aria-label="View Flag"
            title="View Flag"
            className="text-gray-600 dark:text-gray-300"
          >
            <Flag size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChallengeListItem
