'use client'

import { useState } from 'react'

import { TeamMember, TeamInfo, TeamSummary, TeamChallenge } from '../types'
import TeamProfileHeader from '@/features/teams/components/TeamProfileHeader'
import TeamSolves from '@/features/teams/components/TeamSolves'
import TeamTabs from '@/features/teams/components/TeamTabs'
import TeamManageSection from '@/features/teams/components/TeamManageSection'
import TeamMembersSection from '@/features/teams/components/TeamMembersSection'

interface TeamPageContentProps {
  team: TeamInfo
  members: TeamMember[]
  summary: TeamSummary | null
  challenges: TeamChallenge[]
  currentUserId?: string
  canManage?: boolean
  busy?: boolean
  showManageActions?: boolean
  onRenameTeam?: (newName: string) => Promise<{ success: boolean; error?: string }>
  onCopyInvite?: () => void
  onRegenerateInvite?: () => void
  onLeaveTeam?: () => void
  onDeleteTeam?: () => void
  onKickMember?: (member: TeamMember) => void
  onTransferCaptain?: (member: TeamMember) => void

  // New props for the updated design
  effectiveSelectedEvent: string | 'all'
  setSelectedEvent: (eventId: string | 'all') => void
  teamEvents: any[]
  showMainOption: boolean
  onBack?: () => void
}

export default function TeamPageContent({
  team,
  members,
  summary,
  challenges,
  currentUserId,
  canManage = false,
  busy = false,
  onRenameTeam,
  onCopyInvite,
  onRegenerateInvite,
  onLeaveTeam,
  onDeleteTeam,
  onKickMember,
  onTransferCaptain,

  effectiveSelectedEvent,
  setSelectedEvent,
  teamEvents,
  showMainOption,
  onBack
}: TeamPageContentProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'manage'>('overview')

  // Determine if the current user is a member of this team
  const isMember = members.some(m => m.user_id === currentUserId)

  return (
    <div className="space-y-4">
      <TeamTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onBack={onBack}
        canManage={canManage}
        isMember={isMember}
      />

      <TeamProfileHeader
        team={team}
        summary={summary}
        effectiveSelectedEvent={effectiveSelectedEvent}
        setSelectedEvent={setSelectedEvent}
        teamEvents={teamEvents}
        showMainOption={showMainOption}
        canManage={canManage}
        onCopyInvite={onCopyInvite}
        onRegenerateInvite={onRegenerateInvite}
        onLeaveTeam={onLeaveTeam}
        busy={busy}
        isMember={isMember}
      />

      <div key={activeTab}>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-4">
            <TeamMembersSection
              members={members}
              canManage={canManage}
              currentUserId={currentUserId}
              onKickMember={onKickMember}
              onTransferCaptain={onTransferCaptain}
              busy={busy}
              isOverview
            />
            <TeamSolves challenges={challenges} />
          </div>
        )}

        {activeTab === 'manage' && isMember && (
          <TeamManageSection
            team={team}
            canManage={canManage}
            onRenameTeam={onRenameTeam}
            onCopyInvite={onCopyInvite}
            onRegenerateInvite={onRegenerateInvite}
            onLeaveTeam={onLeaveTeam}
            onDeleteTeam={onDeleteTeam}
            busy={busy}
          />
        )}
      </div>
    </div>
  )
}
