'use client'

import React from 'react'
import { Copy, Edit2, Eye, EyeOff, KeyRound, LogOut, RefreshCw, Settings2, Trash2 } from 'lucide-react'

import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui'
import EditTeamModal from './EditTeamModal'
import { TeamInfo } from '../types'

interface TeamManageSectionProps {
  team: TeamInfo
  canManage?: boolean
  onRenameTeam?: (newName: string) => Promise<{ success: boolean; error?: string }>
  onCopyInvite?: () => void
  onRegenerateInvite?: () => void
  onLeaveTeam?: () => void
  onDeleteTeam?: () => void
  busy?: boolean
}

export default function TeamManageSection({
  team,
  canManage = false,
  onRenameTeam,
  onCopyInvite,
  onRegenerateInvite,
  onLeaveTeam,
  onDeleteTeam,
  busy,
}: TeamManageSectionProps) {
  const [showToken, setShowToken] = React.useState(false)
  const token = team.invite_code || ''

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {canManage && (
        <ManageCard
          title="Team Settings"
          icon={<Settings2 size={18} className="text-blue-500" />}
        >
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Display Name
            </label>
            <div className={`flex items-center justify-between gap-3 p-3 ${'bg-card border border-border rounded-xl'}`}>
              <span className="min-w-0 truncate text-lg font-bold text-gray-900 dark:text-white">
                {team.name}
              </span>
              {onRenameTeam && (
                <EditTeamModal
                  currentName={team.name}
                  onSave={onRenameTeam}
                  disabled={busy}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={busy}
                      className="h-9 w-9 shrink-0 rounded-xl shadow-sm transition-all hover:bg-white dark:hover:bg-gray-800"
                    >
                      <Edit2 size={16} className="text-blue-500" />
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </ManageCard>
      )}

      <ManageCard
        title="Token"
        icon={<KeyRound size={18} className="text-emerald-500" />}
      >
        <div className="space-y-3">
          <div className={`flex items-center gap-2 p-3 font-mono text-xs ${'bg-card border border-border rounded-xl'}`}>
            <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-200">
              {showToken ? token || '-' : token ? '********' : '-'}
            </span>
            <button
              type="button"
              onClick={() => setShowToken((value) => !value)}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:text-blue-500"
              title={showToken ? 'Hide token' : 'Show token'}
            >
              {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              type="button"
              onClick={onCopyInvite}
              disabled={busy || !token}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:text-blue-500 disabled:opacity-50"
              title="Copy token"
            >
              <Copy size={14} />
            </button>
          </div>
          {canManage && (
            <Button
              variant="outline"
              onClick={onRegenerateInvite}
              disabled={busy}
              className="w-full border-emerald-500/30 bg-emerald-500/10 text-xs font-bold uppercase tracking-wider text-emerald-600 hover:bg-emerald-600 hover:text-white dark:text-emerald-400"
            >
              <RefreshCw size={14} /> Regenerate Token
            </Button>
          )}
        </div>
      </ManageCard>

      <ManageCard
        title="Exit Team"
        icon={<LogOut size={18} className="text-red-500" />}
      >
        <div className="space-y-3">
          <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            Leave this team. If you are the captain, transfer ownership before exiting.
          </p>
          <Button
            variant="outline"
            onClick={onLeaveTeam}
            disabled={busy}
            className="w-full border-red-200 text-xs font-bold uppercase tracking-wider text-red-600 transition-all hover:bg-red-600 hover:text-white dark:border-red-900/30 dark:text-red-400"
          >
            <LogOut size={14} /> Leave Team
          </Button>
        </div>
      </ManageCard>

      {canManage && (
        <ManageCard
          title="Delete Team"
          icon={<Trash2 size={18} className="text-red-600" />}
        >
          <div className="space-y-3">
            <p className="text-xs leading-relaxed text-red-600/70 dark:text-red-400/70">
              Permanently remove the team and its associated data. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              onClick={onDeleteTeam}
              disabled={busy}
              className="w-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-500/20"
            >
              <Trash2 size={14} /> Delete Team
            </Button>
          </div>
        </ManageCard>
      )}
    </div>
  )
}

function ManageCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className={'bg-card border border-border rounded-2xl'}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
