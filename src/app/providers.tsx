"use client"

import { QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/query/client'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </JotaiProvider>
  )
}

