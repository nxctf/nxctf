import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { cn } from '@/shared/lib/utils'

export type BaseScoreboardColumn<TEntry> = {
  key: string
  header: React.ReactNode
  render: (entry: TEntry, index: number) => React.ReactNode
  headerClassName?: string
  cellClassName?: string | ((entry: TEntry, index: number) => string | undefined)
}

type BaseScoreboardTableProps<TEntry> = {
  entries: TEntry[]
  columns: BaseScoreboardColumn<TEntry>[]
  getRowKey: (entry: TEntry, index: number) => React.Key
  getRowId?: (entry: TEntry, index: number) => string | undefined
  getRowClassName?: (entry: TEntry, index: number) => string | undefined
}

const headerTextClass =
  'text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300'

const rowClass =
  'border-b border-gray-100/80 transition-colors duration-150 ease-in-out last:border-b-0 hover:bg-blue-50/40 dark:border-gray-800/70 dark:hover:bg-blue-900/10'

export default function BaseScoreboardTable<TEntry>({
  entries,
  columns,
  getRowKey,
  getRowId,
  getRowClassName,
}: BaseScoreboardTableProps<TEntry>) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-200/80 hover:bg-transparent dark:border-gray-800">
            {columns.map((column) => (
              <TableHead key={column.key} className={cn(headerTextClass, column.headerClassName)}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => (
            <TableRow
              key={getRowKey(entry, index)}
              id={getRowId?.(entry, index)}
              className={cn('scroll-mt-24', rowClass, getRowClassName?.(entry, index))}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(
                    'py-3 text-sm text-gray-700 dark:text-gray-200',
                    typeof column.cellClassName === 'function'
                      ? column.cellClassName(entry, index)
                      : column.cellClassName
                  )}
                >
                  {column.render(entry, index)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
