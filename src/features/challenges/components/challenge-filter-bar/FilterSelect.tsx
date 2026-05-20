'use client'

type FilterSelectProps = {
  id: string
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  isDirty: boolean
  isActive: boolean
  wrapperClassName?: string
  onChange: (value: string) => void
}

export default function FilterSelect({
  id,
  label,
  value,
  options,
  isActive,
  wrapperClassName = '',
  onChange,
}: FilterSelectProps) {
  return (
    <div className={`min-w-[150px] flex-1 ${wrapperClassName}`}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-10 w-full rounded-xl border px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
          isActive
            ? "border-primary bg-primary/10 text-primary"
            : "border-input bg-background text-foreground hover:border-ring/40 hover:bg-muted/50"
        }`}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
