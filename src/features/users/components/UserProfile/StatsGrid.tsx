'use client'

import { CheckCircle2, Crown, Droplet, Trophy, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import APP from '@/config'
import { UserDetail, TeamInfo } from '../../types'
import { UserStat } from '../ui'

type StatsGridProps = {
  userDetail: UserDetail
  solvedChallengesCount: number
  firstBloodCount: number
  teamInfo: TeamInfo | null
}

export default function StatsGrid({
  userDetail,
  solvedChallengesCount,
  firstBloodCount,
  teamInfo
}: StatsGridProps) {
  const router = useRouter()
  const showTeam = APP.teams.enabled && !!teamInfo

  return (
    <section className={`grid grid-cols-2 gap-3 sm:grid-cols-2 ${showTeam ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
      <UserStat
        icon={Crown}
        label="Rank"
        value={(!userDetail.rank || solvedChallengesCount === 0) ? '-' : `#${userDetail.rank}`}
      />
      <UserStat
        icon={Trophy}
        label="Score"
        value={userDetail.score ?? 0}
      />
      <UserStat
        icon={CheckCircle2}
        label="Solved Challenges"
        value={solvedChallengesCount}
      />
      <UserStat
        icon={Droplet}
        label="First Bloods"
        value={firstBloodCount}
      />
      {showTeam && teamInfo ? (
        <UserStat
          icon={Users}
          label="Team"
          value={
            <span className="block max-w-[12rem] truncate text-xl" title={teamInfo.team.name}>
              {teamInfo.team.name}
            </span>
          }
          detail={`${teamInfo.members.length} member${teamInfo.members.length !== 1 ? 's' : ''}`}
          onClick={() => router.push(`/teams/${encodeURIComponent(teamInfo.team.name)}`)}
          className="col-span-2 sm:col-span-1"
        />
      ) : null}
    </section>
  )
}
