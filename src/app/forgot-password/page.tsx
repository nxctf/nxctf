import { AuthPageShell } from '@/features/auth/components/ui/AuthPageShell'
import ForgotPasswordForm from '@/features/auth/components/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell>
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </AuthPageShell>
  )
}
