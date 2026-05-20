import React from 'react'
import Link from 'next/link'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui'
import { ADMIN_CARD_TITLE_CLASS, ADMIN_STAT_TILE_CLASS } from '@/features/admin/ui/card-styles'
import { Challenge, SiteInfo } from '../types'
import { motion } from 'framer-motion'

interface ChallengeOverviewCardProps {
  challenges: Challenge[]
  showViewAll?: boolean
  info?: SiteInfo
}

const ChallengeOverviewCard: React.FC<ChallengeOverviewCardProps> = ({ challenges, info, showViewAll = true }) => {
  return (
    // <Card className="shrink-0 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
    <Card className="shrink-0 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className={ADMIN_CARD_TITLE_CLASS}>Overview</CardTitle>
        {showViewAll && (
          <Link href="/admin/overview">
            <Button variant="default" size="sm">View All</Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {info && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={ADMIN_STAT_TILE_CLASS}>
              <div className="text-xs text-muted-foreground dark:text-gray-300 truncate">Users</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">{info.total_users}</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={ADMIN_STAT_TILE_CLASS}>
              <div className="text-xs text-muted-foreground dark:text-gray-300 truncate">Admins</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">{info.total_admins ?? 0}</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={ADMIN_STAT_TILE_CLASS}>
              <div className="text-xs text-muted-foreground dark:text-gray-300 truncate">Uniq Solvers</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">{info.unique_solvers ?? 0}</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={ADMIN_STAT_TILE_CLASS}>
              <div className="text-xs text-muted-foreground dark:text-gray-300 truncate">Solves</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">{info.total_solves}</div>
            </motion.div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={ADMIN_STAT_TILE_CLASS}>
            <div className="text-xs text-muted-foreground dark:text-gray-300">Challenges</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">{challenges.length}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={ADMIN_STAT_TILE_CLASS}>
            <div className="text-xs text-muted-foreground dark:text-gray-300">Active</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">{challenges.filter(c => c.is_active).length}</div>
          </motion.div>
        </div>
        <div className="mb-6">
          <details className="group">
            <summary className="cursor-pointer list-none flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">By Difficulty</div>
              <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>

            <div className="pt-1 max-h-40 overflow-auto space-y-2 pr-2">
              {["Easy", "Medium", "Hard"].map(diff => {
                const count = challenges.filter(c => c.difficulty === diff).length
                return (
                  <button
                    key={diff}
                    type="button"
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`Filter difficulty ${diff}`}>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">{diff}</span>
                    <Badge className={diff === "Easy" ? "bg-green-100 text-green-800 dark:bg-green-600 dark:text-white" : diff === "Medium" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-white" : "bg-red-100 text-red-800 dark:bg-red-600 dark:text-white"}>
                      <span className="inline-block min-w-9 text-center text-sm font-semibold">{count}</span>
                    </Badge>
                  </button>
                )
              })}
            </div>
          </details>
        </div>
        <div className="mb-6">
          <details className="group">
            <summary className="cursor-pointer list-none flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">By Category</div>
              <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="pt-1 max-h-48 overflow-auto space-y-2 pr-2 scroll-hidden">
              {Array.from(new Set(challenges.map(c => c.category))).map(cat => {
                const count = challenges.filter(c => c.category === cat).length
                return (
                  <button
                    key={cat}
                    type="button"
                    className="w-full text-left flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`Filter by ${cat}`}>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">{cat}</span>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-600 dark:text-white">
                      <span className="inline-block min-w-9 text-center text-sm font-semibold">{count}</span>
                    </Badge>
                  </button>
                )
              })}
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  )
}

export default ChallengeOverviewCard
