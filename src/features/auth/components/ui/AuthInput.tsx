import { forwardRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Input } from '@/shared/ui/input'

interface AuthInputProps extends React.ComponentProps<typeof Input> {
  icon: LucideIcon
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ icon: Icon, rightElement, error, className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        icon={Icon}
        rightElement={rightElement}
        error={error}
        className={className}
        {...props}
      />
    )
  }
)

AuthInput.displayName = 'AuthInput'
