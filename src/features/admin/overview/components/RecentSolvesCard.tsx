import Link from 'next/link'
import { ArrowRight, Flag } from 'lucide-react'
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import { AdminPanel } from '@/features/admin/ui'
import { formatRelativeDate } from '@/features/admin/solvers/lib'
import type { SolverRow } from '@/features/admin/solvers/types'

type RecentSolvesCardProps = {
  solves: SolverRow[]
}

export default function RecentSolvesCard({ solves }: RecentSolvesCardProps) {
  return (
    <AdminPanel
      title="Recent Solves"
      icon={Flag}
      headerClassName="!h-14 !px-4 !py-0"
      contentClassName="h-[320px] overflow-y-auto !p-0 scroll-hidden"
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/solvers">
            View All
            <ArrowRight />
          </Link>
        </Button>
      }
    >
      {solves.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm font-medium text-muted-foreground">
          No solves recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200/80 hover:bg-transparent dark:border-gray-800">
                <TableHead className="px-4">User</TableHead>
                <TableHead>Challenge</TableHead>
                <TableHead className="px-4 text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solves.slice(0, 10).map((solve) => (
                <TableRow key={solve.solve_id} className="border-b border-gray-100/80 transition-colors duration-150 ease-in-out last:border-b-0 hover:bg-blue-50/40 dark:border-gray-800/70 dark:hover:bg-blue-900/10">
                  <TableCell className="px-4 py-2.5 font-medium">
                    <Link
                      href={`/user/${encodeURIComponent(solve.username)}`}
                      className="text-blue-600 hover:underline dark:text-blue-300"
                    >
                      {solve.username}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate py-2.5 text-muted-foreground">
                    {solve.challenge_title}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                    {formatRelativeDate(solve.solved_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPanel>
  )
}
