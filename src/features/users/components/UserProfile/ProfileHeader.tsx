'use client'

import { CalendarDays, Clock3 } from 'lucide-react'

import EventSelect, { type EventSelectItem } from '@/features/events/components/EventSelect'
import ImageWithFallback from '@/shared/components/ImageWithFallback'
import { cn, formatRelativeDate } from '@/shared/lib/utils'
import SocialIcon from '../ui/SocialIcon'
import { UserDetail, Badge } from '../../types'

type ProfileHeaderProps = {
  userDetail: UserDetail
  avatarSrc: string | null
  badges: Badge[]
  effectiveSelectedEvent: string
  setSelectedEvent: (eventId: string) => void
  profileEvents: EventSelectItem[]
  showMainOption: boolean
}

export default function ProfileHeader({
  userDetail,
  avatarSrc,
  effectiveSelectedEvent,
  setSelectedEvent,
  profileEvents,
  showMainOption,
}: ProfileHeaderProps) {
  return (
    <section
      className={cn("mx-auto flex w-full max-w-7xl flex-col gap-6 p-5 md:flex-row md:items-start md:justify-between", 'bg-card border border-border rounded-xl')}
    >
      <div className="flex w-full flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative mx-auto flex h-24 w-24 shrink-0 overflow-hidden rounded-full border border-gray-200/50 shadow-sm dark:border-white/10 sm:mx-0 sm:h-28 sm:w-28 aspect-square">
          <ImageWithFallback
            src={avatarSrc}
            alt={userDetail.username}
            size={128}
            className="!h-full !w-full object-cover"
            fallbackBg="bg-blue-500/10"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 text-center sm:text-left">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
            <h1 className={cn('text-xl font-black tracking-tight text-foreground sm:text-2xl', "max-w-full truncate")}
              title={userDetail.username}
            >
              {userDetail.username}
            </h1>
            <EventSelect
              value={effectiveSelectedEvent}
              onChange={setSelectedEvent}
              events={profileEvents}
              showMain={showMainOption}
              className="w-full sm:min-w-[180px] md:w-[220px]"
              getEventLabel={(event) => String(event.name ?? event.title ?? 'Untitled')}
            />
          </div>

          <p className="max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400 font-medium">
            {userDetail.bio?.trim() || 'CTF player on NXCTF'}
          </p>

          <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex flex-wrap justify-center items-center gap-2 sm:justify-start">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-gray-200/50 bg-white/40 px-3 py-1 backdrop-blur-sm dark:border-white/5 dark:bg-white/5", 'text-xs font-medium text-muted-foreground')}>
                <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
                Joined {userDetail.created_at ? formatRelativeDate(userDetail.created_at) : '-'}
              </span>
              <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-gray-200/50 bg-white/40 px-3 py-1 backdrop-blur-sm dark:border-white/5 dark:bg-white/5", 'text-xs font-medium text-muted-foreground')}>
                <Clock3 className="h-3.5 w-3.5 text-blue-500" />
                Last login {userDetail.last_login_at ? formatRelativeDate(userDetail.last_login_at) : 'Never'}
              </span>
            </div>

            {userDetail.sosmed && (
              <div className="flex items-center gap-2">
                {userDetail.sosmed.linkedin?.trim() && (
                  <SocialIcon
                    type="linkedin"
                    href={userDetail.sosmed.linkedin.startsWith('http')
                      ? userDetail.sosmed.linkedin
                      : `https://linkedin.com/in/${userDetail.sosmed.linkedin}`}
                    label="LinkedIn"
                    hideLabelOnMobile
                  />
                )}
                {userDetail.sosmed.instagram?.trim() && (
                  <SocialIcon
                    type="instagram"
                    href={userDetail.sosmed.instagram.startsWith('http')
                      ? userDetail.sosmed.instagram
                      : `https://instagram.com/${userDetail.sosmed.instagram}`}
                    label="Instagram"
                    hideLabelOnMobile
                  />
                )}
                {userDetail.sosmed.web?.trim() && (
                  <SocialIcon
                    type="web"
                    href={userDetail.sosmed.web.startsWith('http')
                      ? userDetail.sosmed.web
                      : `https://${userDetail.sosmed.web}`}
                    label="Website"
                    hideLabelOnMobile
                  />
                )}
                {userDetail.sosmed.discord?.trim() && (
                  <SocialIcon
                    type="discord"
                    label={userDetail.sosmed.discord}
                    alwaysShowLabel
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
