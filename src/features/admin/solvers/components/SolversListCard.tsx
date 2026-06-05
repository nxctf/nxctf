import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui'
import {
  AdminDataSurface,
  AdminEmptyState,
  AdminFilterInput,
  AdminFilterToolbar,
  AdminListSurface,
  AdminStickyToolbar,
} from '../../ui'
import { formatRelativeDate } from '../lib'
import type { SolverRow } from '../types'

interface SolversListCardProps {
  solvers: SolverRow[]
  searchQuery: string
  searching: boolean
  loadingMore: boolean
  hasMore: boolean
  offset: number
  onSearchQueryChange: (value: string) => void
  onSearch: () => void
  onReset: () => void
  onAskDelete: (id: string) => void
  onLoadMore: (offset: number) => void
}

const SolversListCard: React.FC<SolversListCardProps> = ({
  solvers,
  searchQuery,
  searching,
  loadingMore,
  hasMore,
  offset,
  onSearchQueryChange,
  onSearch,
  onReset,
  onAskDelete,
  onLoadMore,
}) => {
  return (
    <AdminDataSurface
      toolbar={(
        <AdminStickyToolbar
          filters={(
            <AdminFilterToolbar
              actions={(
                <>
                  <Button id="search-btn" variant="outline" size="sm" onClick={onSearch} className="h-9 shrink-0 rounded-xl border-gray-200/50 px-4 text-xs font-semibold text-gray-700 hover:border-blue-500/40 dark:border-gray-800/50 dark:text-gray-200">
                    {searching ? 'Searching...' : 'Search'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onReset}
                    className={searchQuery.trim().length > 0
                      ? "h-9 shrink-0 rounded-xl border-blue-600 bg-blue-600 px-4 text-xs font-semibold text-white hover:border-blue-500 hover:bg-blue-500 dark:border-blue-600 dark:bg-blue-600 dark:text-white"
                      : "h-9 shrink-0 rounded-xl border-gray-200/50 px-4 text-xs font-semibold text-gray-700 hover:border-blue-500/40 dark:border-gray-800/50 dark:text-gray-200"
                    }
                  >
                    Reset
                  </Button>
                </>
              )}
            >
            <AdminFilterInput
              type="text"
              placeholder="Search by user or challenge..."
              value={searchQuery}
              defaultValue=""
              onChange={onSearchQueryChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSearch()
              }}
            />
            </AdminFilterToolbar>
          )}
        />
      )}
      empty={solvers.length === 0 ? (
            <AdminEmptyState
              title="No solves found"
              description="No one has solved this challenge yet or matches your search."
            />
      ) : null}
    >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AdminListSurface>
              {solvers.map((s) => (
                <div
                  key={s.solve_id}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-900/10"
                >
                  <div className="truncate text-sm font-medium">
                    <Link
                      href={`/user/${encodeURIComponent(s.username)}`}
                      className="text-blue-600 dark:text-blue-300 hover:underline"
                      title={s.username}
                    >
                      {s.username}
                    </Link>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal"> solved </span>
                    <span className="text-xs text-gray-800 dark:text-gray-200 font-semibold">{s.challenge_title}</span>
                    <span className="ml-2.5 font-mono text-xs font-normal text-gray-500/80 dark:text-gray-500">
                      {formatRelativeDate(s.solved_at)}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAskDelete(s.solve_id)}
                    aria-label="Delete Solve"
                    title="Delete Solve"
                    className="text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-700 h-8 w-8 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </AdminListSurface>
          </motion.div>

        {hasMore && (
          <div className="flex justify-center p-4 border-t border-gray-100 dark:border-gray-800">
            <Button onClick={() => onLoadMore(offset)} disabled={loadingMore} className="rounded-xl">
              {loadingMore ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </AdminDataSurface>
  )
}

export default SolversListCard
