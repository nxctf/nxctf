import React from 'react'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/shared/ui'
import { AdminFilterInput, AdminFilterSelect, AdminFilterToolbar } from '@/features/admin/ui'
import type { AdminChallengeFilterState } from '../types'

interface AdminChallengeFiltersProps {
  filters: AdminChallengeFilterState
  onFiltersChange: React.Dispatch<React.SetStateAction<AdminChallengeFilterState>>
  categories: string[]
  difficulties: string[]
  onClear: () => void
}

export default function AdminChallengeFilters({
  filters,
  onFiltersChange,
  categories,
  difficulties,
  onClear,
}: AdminChallengeFiltersProps) {
  const isDirty =
    filters.search ||
    filters.category !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.visibility !== 'all' ||
    filters.service !== 'all' ||
    filters.sortBy !== 'points_desc'

  return (
    <AdminFilterToolbar
      actions={
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">

          <AdminFilterSelect
            value={filters.category}
            onValueChange={(val) => onFiltersChange((prev) => ({ ...prev, category: val }))}
            placeholder="Category"
            className="w-full sm:w-[150px]"
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map((cat) => ({ value: cat, label: cat })),
            ]}
          />

          <AdminFilterSelect
            value={filters.difficulty}
            onValueChange={(val) => onFiltersChange((prev) => ({ ...prev, difficulty: val }))}
            placeholder="Difficulty"
            className="w-full sm:w-[145px]"
            options={[
              { value: 'all', label: 'All Difficulties' },
              ...difficulties.map((diff) => ({ value: diff, label: diff, className: 'capitalize' })),
            ]}
          />

          <AdminFilterSelect
            value={filters.visibility}
            onValueChange={(val) => onFiltersChange((prev) => ({ ...prev, visibility: val as AdminChallengeFilterState['visibility'] }))}
            placeholder="Visibility"
            className="w-full sm:w-[140px]"
            options={[
              { value: 'all', label: 'All Visibility' },
              { value: 'active', label: 'Active / Visible' },
              { value: 'inactive', label: 'Inactive / Hidden' },
              { value: 'maintenance', label: 'Maintenance' },
            ]}
          />

          <AdminFilterSelect
            value={filters.service}
            onValueChange={(val) => onFiltersChange((prev) => ({ ...prev, service: val as AdminChallengeFilterState['service'] }))}
            placeholder="Services"
            className="w-full sm:w-[130px]"
            options={[
              { value: 'all', label: 'All Services' },
              { value: 'services', label: 'Services' },
              { value: 'placeholder', label: 'Placeholder' },
              { value: 'tasks', label: 'Tasks' },
              { value: 'geo', label: 'Location' },
            ]}
          />

          <AdminFilterSelect
            value={filters.sortBy || 'points_desc'}
            defaultValue="points_desc"
            onValueChange={(val) => onFiltersChange((prev) => ({ ...prev, sortBy: val }))}
            placeholder="Sort by"
            className="w-full sm:w-[150px]"
            icon={<ArrowUpDown className="h-3.5 w-3.5 shrink-0" />}
            options={[
              { value: 'points_desc', label: 'Points desc' },
              { value: 'points_asc', label: 'Points asc' },
              { value: 'difficulty_asc', label: 'Difficulty asc' },
              { value: 'difficulty_desc', label: 'Difficulty desc' },
              { value: 'title_asc', label: 'Name A-Z' },
              { value: 'title_desc', label: 'Name Z-A' },
              { value: 'created_at_desc', label: 'Newest first' },
              { value: 'created_at_asc', label: 'Oldest first' },
            ]}
          />
        </div>
      }
    >
      <div className="flex items-center gap-2 flex-1 max-w-[320px]">
        <AdminFilterInput
          type="text"
          value={filters.search}
          defaultValue=""
          onChange={(value) => onFiltersChange((prev) => ({ ...prev, search: value }))}
          placeholder="Search challenge by name or description..."
          wrapperClassName="w-full"
        />

        {isDirty && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="h-9 shrink-0 rounded-xl border-blue-600 bg-blue-600 px-3.5 text-xs font-bold text-white hover:border-blue-500 hover:bg-blue-500 dark:border-blue-600 dark:bg-blue-600 dark:text-white"
          >
            Clear
          </Button>
        )}
      </div>
    </AdminFilterToolbar>
  )
}
