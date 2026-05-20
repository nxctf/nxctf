import Link from 'next/link'
import { Trophy, Users } from 'lucide-react'
import {
  BaseScoreboardCard,
  BaseScoreboardColumn,
  BaseScoreboardRankBadge,
  BaseScoreboardTable,
} from '@/features/scoreboard/components/base'
import { TeamScoreboardEntry } from '../types'

type TeamScoreboardTableProps = {
  entries: TeamScoreboardEntry[]
  showTotalScore: boolean
  currentTeamName?: string | null
}

export default function TeamScoreboardTable({
  entries,
  showTotalScore,
  currentTeamName,
}: TeamScoreboardTableProps) {
  const scoreLabel = showTotalScore ? 'Total Score' : 'Unique Score'
  const currentTeamIndex = currentTeamName
    ? entries.findIndex((entry) => entry.team_name === currentTeamName)
    : -1
  const currentTeamEntry = currentTeamIndex >= 0 ? entries[currentTeamIndex] : null
  const currentTeamRank = currentTeamEntry ? currentTeamIndex + 1 : null
  const currentTeamScore = currentTeamEntry
    ? showTotalScore
      ? currentTeamEntry.total_score
      : currentTeamEntry.unique_score
    : undefined

  const columns: BaseScoreboardColumn<TeamScoreboardEntry>[] = [
    {
      key: 'rank',
      header: 'Rank',
      headerClassName: 'w-16 text-center',
      cellClassName: 'w-16 text-center font-mono text-gray-500 dark:text-gray-300',
      render: (_entry, index) => index + 1,
    },
    {
      key: 'team',
      header: 'Team',
      render: (entry) => (
        <div className="flex min-w-[180px] items-center gap-2">
          <Link
            href={`/teams/${encodeURIComponent(entry.team_name)}`}
            className="block max-w-30 truncate whitespace-nowrap font-medium transition-colors hover:text-blue-600 hover:underline dark:hover:text-blue-400 md:max-w-xs"
            title={entry.team_name}
          >
            {entry.team_name}
          </Link>
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <Users size={11} />
            {entry.member_count}
          </span>
        </div>
      ),
    },
    {
      key: 'score',
      header: scoreLabel,
      headerClassName: 'w-24 text-center',
      cellClassName: 'w-24 text-center font-semibold text-gray-900 dark:text-white',
      render: (entry) => (
        <span>{showTotalScore ? entry.total_score : entry.unique_score}</span>
      ),
    },
  ]

  return (
    <BaseScoreboardCard
      title="Ranking"
      icon={Trophy}
      action={
        currentTeamName ? (
          <BaseScoreboardRankBadge
            label="Team Rank"
            rank={currentTeamRank}
            score={currentTeamScore}
            scoreLabel={scoreLabel}
            rowHref={currentTeamRank ? `#scoreboard-row-${currentTeamRank}` : null}
            missingLabel="Team not ranked yet"
          />
        ) : null
      }
      contentClassName="p-0"
    >
      <BaseScoreboardTable
        entries={entries}
        columns={columns}
        getRowKey={(entry) => entry.team_id}
        getRowId={(_entry, index) => `scoreboard-row-${index + 1}`}
        getRowClassName={(entry) =>
          currentTeamName && entry.team_name === currentTeamName
            ? 'bg-blue-50/60 font-semibold dark:bg-blue-900/20'
            : undefined
        }
      />
    </BaseScoreboardCard>
  )
}
