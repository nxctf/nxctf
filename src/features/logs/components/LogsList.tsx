"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flag,
  Flame,
  Clock,
  ExternalLink,
  Shield,
} from "lucide-react";
import * as LucideIcons from 'lucide-react';
import { ElementType } from 'react'
import { useCategories } from '@/shared/contexts/CategoriesContext'
import { getCategoryIcon, getCategoryDetails } from '@/features/challenges/lib/challenge-utils'

import { PageLoader, EmptyState } from '@/shared/components';
import { formatRelativeDate } from '@/shared/lib'
import { useLogs } from '@/features/logs/contexts/LogsContext';
import {
  SURFACE_GLASS_CARD_COMPACT_CLASS,
  SURFACE_INTERACTIVE_HOVER_CLASS,
} from "@/shared/styles";

export type LogEntry = {
  log_type: "new_challenge" | "first_blood" | "solve";
  log_challenge_id: string;
  log_challenge_title: string;
  log_category: string;
  log_user_id?: string;
  log_username?: string;
  log_created_at: string;
};

export default function LogsList({
  tabType = 'challenges',
  eventId
}: {
  tabType?: 'challenges' | 'solves',
  eventId?: string | null | 'all'
}) {
  const [notifications, setNotifications] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { getFeed } = useLogs()

  const eventKey = eventId === undefined ? 'any' : (eventId === null ? 'main' : String(eventId))
  const cacheKey = `${tabType}:${eventKey}`

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const merged = await getFeed(tabType, eventId)
        setNotifications(merged);
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [cacheKey, getFeed, tabType, eventId]);

  if (loading) return <PageLoader />;

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<Clock size={24} className="text-gray-400" />}
        title="Silence in the Wire"
        description="No activities recorded for this period. Stay tuned for incoming signals."
        className={SURFACE_GLASS_CARD_COMPACT_CLASS}
      />
    );
  }

  return (
    <div className="grid gap-1.5">
      {notifications.map((notif, index) => (
        <LogItem key={`${notif.log_challenge_id}-${notif.log_created_at}-${index}`} notif={notif} />
      ))}
    </div>
  );
}

import { persistSelectedChallenge } from '@/features/challenges/lib/challenge-persistence'

function LogItem({ notif }: { notif: LogEntry }) {
  const { categories: dbCategories } = useCategories()
  const parentCategory = notif.log_category ? notif.log_category.split('/')[0] : '';
  const dbCat = dbCategories.find(c => c.name.toLowerCase() === parentCategory.toLowerCase());

  const CategoryIcon = dbCat ? ((LucideIcons as any)[dbCat.icon] || Shield) : getCategoryIcon(notif.log_category) as ElementType
  const catColor = dbCat ? `text-${dbCat.color}-500` : getCategoryDetails(notif.log_category).color

  return (
    <div
      className={`group flex items-center gap-2.5 p-2.5 ${SURFACE_GLASS_CARD_COMPACT_CLASS} ${SURFACE_INTERACTIVE_HOVER_CLASS}`}
    >
      <CategoryIcon size={14} className={`shrink-0 ${catColor}`} />

      <p className="flex-1 min-w-0 text-sm text-gray-900 dark:text-gray-100 truncate">
        {notif.log_type === 'new_challenge' ? (
          <span className="text-gray-500 dark:text-gray-400">
            <span className={`${catColor} font-medium`}>{notif.log_category}</span> challenge
            &nbsp;<span className="font-semibold text-gray-900 dark:text-gray-100">&quot;{notif.log_challenge_title}&quot;</span>
            &nbsp;has been deployed.
          </span>
        ) : notif.log_type === 'first_blood' ? (
          <span>
            <Link
              href={`/user/${encodeURIComponent(notif.log_username || '')}`}
              className="font-semibold hover:underline"
            >
              {notif.log_username}
            </Link>
            <span className="text-gray-500 dark:text-gray-400">
              &nbsp;solved&nbsp;
            </span>
            <span className="font-semibold">&quot;{notif.log_challenge_title}&quot;</span>
            <Flame size={12} className="inline-block ml-1 -mt-0.5 text-red-500 fill-red-500" />
          </span>
        ) : (
          <span>
            <Link
              href={`/user/${encodeURIComponent(notif.log_username || '')}`}
              className="font-semibold hover:underline"
            >
              {notif.log_username}
            </Link>
            <span className="text-gray-500 dark:text-gray-400">
              &nbsp;solved&nbsp;
            </span>
            <span className="font-semibold">&quot;{notif.log_challenge_title}&quot;</span>
            <Flag size={12} className="inline-block ml-1 -mt-0.5 text-emerald-500" />
          </span>
        )}
      </p>

      <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
        {formatRelativeDate(notif.log_created_at)}
      </span>

      <Link
        href="/challenges"
        onClick={() => persistSelectedChallenge(notif.log_challenge_id)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
      >
        <ExternalLink size={12} />
      </Link>
    </div>
  );
}
