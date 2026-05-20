import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const RULES = [
  { label: 'At least 6 characters', test: (value: string) => value.length >= 6 },
  { label: 'Includes a number', test: (value: string) => /\d/.test(value) },
  { label: 'Includes mixed case', test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
]

function getStrength(password: string) {
  if (!password) return 0
  return RULES.reduce((score, rule) => score + Number(rule.test(password)), 0)
}

export function PasswordStrength({ password }: { password: string }) {
  const strength = getStrength(password)
  const label = strength >= 3 ? 'Strong password' : strength >= 2 ? 'Good password' : 'Keep going'
  const barClass = strength >= 3 ? 'bg-emerald-500' : strength >= 2 ? 'bg-orange-500' : 'bg-red-500'

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-gray-700 dark:text-gray-300">
          Password strength
        </span>
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={cn(
              'h-1.5 rounded-full bg-gray-200 transition-colors dark:bg-gray-800',
              strength > index && barClass
            )}
          />
        ))}
      </div>
      <div className="grid gap-2 text-xs text-gray-500 dark:text-gray-400">
        {RULES.map((rule) => {
          const passed = rule.test(password)
          const Icon = passed ? CheckCircle2 : Circle

          return (
            <div
              key={rule.label}
              className={cn(
                'flex items-center gap-2 transition-colors',
                passed && 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{rule.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function PasswordMatchIndicator({
  password,
  confirmPassword,
}: {
  password: string
  confirmPassword: string
}) {
  if (!confirmPassword) return null

  const matches = password === confirmPassword

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs font-medium',
        matches ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
      )}
    >
      {matches ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
      <span>{matches ? 'Passwords match' : 'Passwords do not match yet'}</span>
    </div>
  )
}
