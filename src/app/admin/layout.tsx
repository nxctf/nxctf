import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'

const AdminRouteShell = dynamic(() => import('@/features/admin/ui/AdminRouteShell'), {
  ssr: false,
})

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminRouteShell>{children}</AdminRouteShell>
}
