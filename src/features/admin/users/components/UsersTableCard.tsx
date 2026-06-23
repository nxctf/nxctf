"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight, Copy, ExternalLink, KeyRound, Ban, Unlock } from 'lucide-react'
import { ImageWithFallback } from '@/shared/components'
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
} from '@/shared/ui'
import {
  ADMIN_ROW_CLASS,
  AdminDataSurface,
  AdminEmptyState,
  AdminFilterInput,
  AdminFilterSelect,
  AdminFilterToolbar,
  AdminStatusBadge,
  AdminTableSurface,
} from '@/features/admin/ui'
import { DIALOG_GLASS_CONTENT_MD_CLASS } from '@/shared/styles'
import {
  ADMIN_INPUT_CLASS,
  ADMIN_TEXTAREA_CLASS,
  ADMIN_NATIVE_SELECT_CLASS,
  ADMIN_FORM_FIELD_CLASS,
} from '../../ui/form-field-styles'
import type { AdminUserRow, UserSocialLinks } from '../types'
import { adminChangePassword, adminBanUser, adminUnbanUser } from '../services/admin-users.service'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/shared/components/ConfirmDialog'

type UsersTableCardProps = {
  users: AdminUserRow[]
  totalCount: number
  isDataLoading: boolean
  query: string
  setQuery: (q: string) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  roleFilter: 'all' | 'admin' | 'user'
  setRoleFilter: (role: 'all' | 'admin' | 'user') => void
  sortMode: 'newest' | 'oldest' | 'username_asc' | 'updated_desc' | 'role'
  setSortMode: (sort: 'newest' | 'oldest' | 'username_asc' | 'updated_desc' | 'role') => void
  pageSize: number
  setPageSize: (size: number) => void
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  onRefresh?: () => void
}

type RoleFilter = 'all' | 'admin' | 'user'
type SortMode = 'newest' | 'oldest' | 'username_asc' | 'updated_desc' | 'role'

type SocialItem = {
  key: string
  label: string
  value: string
  href: string | null
}

const PAGE_SIZE_OPTIONS = [100, 500, 1000]

function formatDate(value?: string) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function truncateUserId(id: string) {
  if (id.length <= 16) return id
  return `${id.slice(0, 8)}...${id.slice(-6)}`
}

function isHttpUrl(value: string) {
  return value.startsWith('http://') || value.startsWith('https://')
}

function getSocialItems(sosmed: UserSocialLinks): SocialItem[] {
  if (!sosmed) return []

  return Object.entries(sosmed)
    .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
    .map(([key, rawValue]) => {
      const value = String(rawValue).trim()
      const label = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase())

      return {
        key,
        label,
        value,
        href: isHttpUrl(value) ? value : null,
      }
    })
}

export default function UsersTableCard({
  users,
  totalCount,
  isDataLoading,
  query,
  setQuery,
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  sortMode,
  setSortMode,
  pageSize,
  setPageSize,
  page,
  setPage,
  onRefresh,
}: UsersTableCardProps) {
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null)

  // Administrative Dialog & Form States
  const [changePasswordUser, setChangePasswordUser] = useState<AdminUserRow | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const [banUser, setBanUser] = useState<AdminUserRow | null>(null)
  const [banDuration, setBanDuration] = useState('5')
  const [banReason, setBanReason] = useState('')
  const [unbanUserObj, setUnbanUserObj] = useState<{ id: string; username: string } | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!changePasswordUser) return

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsSubmitting(true)
    const result = await adminChangePassword(changePasswordUser.id, newPassword)
    setIsSubmitting(false)

    if (result.success) {
      toast.success(`Password for ${changePasswordUser.username} updated successfully!`)
      setChangePasswordUser(null)
      setNewPassword('')
    } else {
      toast.error(result.error || 'Failed to update password')
    }
  }

  const handleBanUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!banUser) return

    const durationVal = banDuration === 'indefinite' ? null : Number(banDuration)
    const reasonVal = banReason.trim() || 'Banned by administrator'

    setIsSubmitting(true)
    const result = await adminBanUser(banUser.id, durationVal, reasonVal)
    setIsSubmitting(false)

    if (result.success) {
      toast.success(`User ${banUser.username} suspended successfully!`)
      setBanUser(null)
      onRefresh?.()
    } else {
      toast.error(result.error || 'Failed to suspend user')
    }
  }

  const handleGeneratePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let generated = ''
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(generated)
  }

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(page, pageCount)
  const firstResult = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1
  const lastResult = Math.min(safePage * pageSize, totalCount)

  const handleCopyUserId = async (id: string) => {
    if (!navigator.clipboard) return

    await navigator.clipboard.writeText(id)
    setCopiedUserId(id)
    window.setTimeout(() => {
      setCopiedUserId((currentId) => (currentId === id ? null : currentId))
    }, 1200)
  }

  return (
    <AdminDataSurface
      empty={users.length === 0 ? (
        <AdminEmptyState
          title="No users match the current filters"
          description="Try adjusting your search, role filter, or sort."
        />
      ) : null}
    >
            <AdminTableSurface>
              <Table>
                <TableHeader className="border-b border-gray-200/70 dark:border-gray-800/70">
                  <TableRow>
                    <TableHead className="pl-6 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">User</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Role</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</TableHead>
                    <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Created</TableHead>
                    <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Updated</TableHead>
                    <TableHead className="pr-6 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((listedUser) => {
                    const profileHref = listedUser.username
                      ? `/user/${encodeURIComponent(listedUser.username)}`
                      : null

                    return (
                      <TableRow
                        key={listedUser.id}
                        className={ADMIN_ROW_CLASS}
                      >
                        <TableCell className="pl-6">
                          {(() => {
                            const isCurrentlyBanned = listedUser.banned_until && new Date(listedUser.banned_until) > new Date()
                            return (
                              <div className="flex min-w-[180px] items-center gap-3">
                                <ImageWithFallback
                                  src={listedUser.profile_picture_url}
                                  alt={listedUser.username}
                                  size={38}
                                  className={`shrink-0 rounded-full ring-1 ${
                                    isCurrentlyBanned ? 'ring-red-500/30 grayscale-[30%]' : 'ring-blue-500/15'
                                  }`}
                                  fallbackBg="bg-blue-500/10 dark:bg-blue-500/15"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {profileHref ? (
                                      <Link
                                        href={profileHref}
                                        className={`block truncate font-semibold hover:text-blue-600 dark:hover:text-blue-300 ${
                                          isCurrentlyBanned
                                            ? 'text-red-500 line-through'
                                            : 'text-gray-900 dark:text-gray-100'
                                        }`}
                                      >
                                        {listedUser.username}
                                      </Link>
                                    ) : (
                                      <span className={`block truncate font-semibold ${
                                        isCurrentlyBanned ? 'text-red-500 line-through' : 'text-gray-900 dark:text-gray-100'
                                      }`}>
                                        Unknown user
                                      </span>
                                    )}
                                    {isCurrentlyBanned && (
                                      <span className="shrink-0 inline-flex items-center text-[9px] font-black text-red-500 bg-red-500/10 border border-red-500/20 px-1 py-0.5 rounded uppercase tracking-wider">
                                        Banned
                                      </span>
                                    )}
                                  </div>
                                  <span className={`block truncate text-xs ${
                                    isCurrentlyBanned ? 'text-red-400 font-semibold' : 'text-muted-foreground'
                                  }`}>
                                    {isCurrentlyBanned
                                      ? `Suspended until ${new Date(listedUser.banned_until!).toLocaleString()}`
                                      : 'Profile record'}
                                  </span>
                                </div>
                              </div>
                            )
                          })()}
                        </TableCell>
                        <TableCell>
                          <AdminStatusBadge tone={listedUser.is_admin ? 'info' : 'neutral'}>
                            {listedUser.is_admin ? 'Admin' : 'User'}
                          </AdminStatusBadge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {listedUser.email || '-'}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatDate(listedUser.created_at)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatDate(listedUser.updated_at)}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          {(() => {
                            const isCurrentlyBanned = listedUser.banned_until && new Date(listedUser.banned_until) > new Date()
                            return (
                              <div className="flex justify-end items-center gap-2">
                                {listedUser.username && (
                                  <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl h-8 w-24 flex items-center justify-center px-3"
                                  >
                                    <Link href={profileHref!}>
                                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                      View
                                    </Link>
                                  </Button>
                                )}

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl h-8 w-24 flex items-center justify-center px-3 text-blue-500 border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-600 dark:text-blue-400 dark:border-blue-400/20 dark:hover:bg-blue-500/15"
                                  onClick={() => {
                                    setChangePasswordUser(listedUser)
                                    setNewPassword('')
                                  }}
                                >
                                  <KeyRound className="h-3.5 w-3.5 mr-1" />
                                  Password
                                </Button>

                                {listedUser.is_admin ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl h-8 w-24 flex items-center justify-center px-3 text-gray-400 border-gray-200 dark:text-gray-600 dark:border-gray-800/80 cursor-not-allowed opacity-50"
                                    disabled
                                  >
                                    <Ban className="h-3.5 w-3.5 mr-1" />
                                    Ban
                                  </Button>
                                ) : isCurrentlyBanned ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl h-8 w-24 flex items-center justify-center px-3 text-green-500 border-green-500/20 hover:bg-green-500/10 hover:text-green-600 dark:text-green-400 dark:border-green-400/20 dark:hover:bg-green-500/15"
                                    onClick={() => setUnbanUserObj({ id: listedUser.id, username: listedUser.username })}
                                    disabled={isSubmitting}
                                  >
                                    <Unlock className="h-3.5 w-3.5 mr-1" />
                                    Unban
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl h-8 w-24 flex items-center justify-center px-3 text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:border-red-400/20 dark:hover:bg-red-500/15"
                                    onClick={() => {
                                      setBanUser(listedUser)
                                      setBanDuration('5')
                                      setBanReason('')
                                    }}
                                    disabled={isSubmitting}
                                  >
                                    <Ban className="h-3.5 w-3.5 mr-1" />
                                    Ban
                                  </Button>
                                )}
                              </div>
                            )
                          })()}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </AdminTableSurface>

            <div className="mx-6 my-4 flex flex-col gap-3 border-t border-gray-200/80 pt-4 text-sm text-muted-foreground dark:border-gray-800/80 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {firstResult}-{lastResult} of {totalCount}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={safePage <= 1}
                  aria-label="Previous page"
                  className="rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="min-w-20 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {safePage} / {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((currentPage) => Math.min(pageCount, currentPage + 1))}
                  disabled={safePage >= pageCount}
                  aria-label="Next page"
                  className="rounded-xl"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

      {/* Change Password Dialog */}
      <Dialog
        open={changePasswordUser !== null}
        onOpenChange={(open) => {
          if (!open) setChangePasswordUser(null)
        }}
      >
        <DialogContent className={DIALOG_GLASS_CONTENT_MD_CLASS}>
          <DialogHeader className="border-b pb-3 dark:border-gray-800">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <KeyRound className="h-5 w-5 text-blue-500" />
              Reset Password for <span className="font-semibold">{changePasswordUser?.username}</span>
            </DialogTitle>
          </DialogHeader>

          {changePasswordUser && (
            <form onSubmit={handleResetPassword} className="space-y-2">
              <div className={ADMIN_FORM_FIELD_CLASS}>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className={ADMIN_INPUT_CLASS}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGeneratePassword}
                    className="rounded-xl h-10 px-4"
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setChangePasswordUser(null)}
                  className="rounded-xl"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold px-5"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog
        open={banUser !== null}
        onOpenChange={(open) => {
          if (!open) setBanUser(null)
        }}
      >
        <DialogContent className={DIALOG_GLASS_CONTENT_MD_CLASS}>
          <DialogHeader className="border-b pb-3 dark:border-gray-800">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-red-500">
              <Ban className="h-5 w-5" />
              Suspend User Account
            </DialogTitle>
          </DialogHeader>

          {banUser && (
            <form onSubmit={handleBanUserSubmit} className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Temporarily or indefinitely suspend <span className="font-semibold text-gray-900 dark:text-gray-100">{banUser.username}</span> from accessing the platform.
              </p>

              <div className={ADMIN_FORM_FIELD_CLASS}>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Suspension Duration
                </label>
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  className={ADMIN_NATIVE_SELECT_CLASS}
                >
                  <option value="5">5 Minutes (testing/minor warning)</option>
                  <option value="60">1 Hour</option>
                  <option value="180">3 Hour</option>
                  <option value="1440">1 Day</option>
                  <option value="10080">7 Days</option>
                  <option value="indefinite">Indefinite / Permanent</option>
                </select>
              </div>

              <div className={ADMIN_FORM_FIELD_CLASS}>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Reason for Suspension
                </label>
                <Textarea
                  placeholder="e.g. Flag sharing / Cheating / Malicious behavior"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className={`${ADMIN_TEXTAREA_CLASS} min-h-[80px]`}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBanUser(null)}
                  className="rounded-xl"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold px-5 border border-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Suspend User'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Unban Dialog */}
      <ConfirmDialog
        open={unbanUserObj !== null}
        onOpenChange={(open) => {
          if (!open) setUnbanUserObj(null)
        }}
        title="Unban User Account"
        description={`Are you sure you want to unsuspend ${unbanUserObj?.username}? This will restore their access to challenges and container actions.`}
        confirmLabel="Unban"
        cancelLabel="Cancel"
        onConfirm={async () => {
          if (!unbanUserObj) return
          setIsSubmitting(true)
          const result = await adminUnbanUser(unbanUserObj.id)
          setIsSubmitting(false)
          if (result.success) {
            toast.success(`User ${unbanUserObj.username} unsuspended successfully!`)
            setUnbanUserObj(null)
            onRefresh?.()
          } else {
            toast.error(result.error || 'Failed to unsuspend user')
          }
        }}
      />
    </AdminDataSurface>
  )
}
