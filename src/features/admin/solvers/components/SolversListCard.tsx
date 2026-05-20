import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trash2, Search } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui'
import { EmptyState } from '@/shared/components'
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
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <CardTitle>All Solvers</CardTitle>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by username or challenge..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch()
            }}
            className="px-3 py-1 text-sm rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <Button id="search-btn" variant="outline" size="sm" onClick={onSearch}>
            {searching ? 'Searching...' : 'Search'}
          </Button>

          <Button variant="outline" size="sm" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {solvers.length === 0 ? (
          <EmptyState
            icon={<Search className="w-full h-full" />}
            title="No solvers found"
            description="No one has solved this challenge yet or matches your search."
            containerHeight="py-8"
          />
        ) : (
          <motion.div
            className="divide-y border dark:border-gray-700 rounded-md overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {solvers.map((s) => (
              <div
                key={s.solve_id}
                className="flex items-center justify-between px-4 py-3 transition-colors border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="truncate">
                  <Link
                    href={`/user/${encodeURIComponent(s.username)}`}
                    className="font-medium text-blue-600 dark:text-blue-300 hover:underline"
                    title={s.username}
                  >
                    {s.username.length > 20 ? `${s.username.slice(0, 30)}...` : s.username}
                  </Link>
                  <span className="text-xs text-gray-500 dark:text-gray-300"> solved </span>
                  <span className="text-xs text-gray-700 dark:text-gray-200 font-semibold">{s.challenge_title}</span>
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-300">
                    {formatRelativeDate(s.solved_at)}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onAskDelete(s.solve_id)}
                  aria-label="Delete Solver"
                  title="Delete Solver"
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </motion.div>
        )}

        {hasMore && (
          <div className="flex justify-center mt-4">
            <Button onClick={() => onLoadMore(offset)} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SolversListCard
