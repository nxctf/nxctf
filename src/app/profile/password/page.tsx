import ResetPasswordForm from '@/features/auth/components/ResetPasswordForm'
import { AuthPageShell } from '@/features/auth/components/ui/AuthPageShell'
import { AppSidebarShell } from '@/shared/components/AppSidebarShell'
import { AppPageSidebar } from '@/shared/components/AppPageSidebar'

export default function ProfilePasswordPage() {
  return (
    <AppSidebarShell
      title="Change Password"
      subtitle="Update your account password securely."
      sidebar={
        <AppPageSidebar
          title="Account Security"
          description="Keep your credentials safe and updated."
          links={[
            { href: '/profile', label: 'Profile', description: 'Account overview.' },
            { href: '/profile/password', label: 'Password', description: 'Update credentials.' },
            { href: '/rules', label: 'Rules', description: 'Platform guidance.' },
          ]}
        />
      }
      mobileSidebarTitle="Account Security"
    >
      <AuthPageShell>
        <div className="w-full max-w-md">
          <ResetPasswordForm />
        </div>
      </AuthPageShell>
    </AppSidebarShell>
  )
}
