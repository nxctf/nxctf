import { User } from '@/shared/types'

export interface AuthResponse {
  user: User | null
  error: string | null
  message?: string | null
  emailConfirmationRequired?: boolean
}

export interface AuthIdentity {
  provider: string
  email: string
}
