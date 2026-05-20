import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '../services/auth.service'
import { useAuth } from '@/shared/contexts/AuthContext'
import Config from '@/config'

export function useLogin() {
  const router = useRouter()
  const { setUser } = useAuth()
  const [formData, setFormData] = useState({ identifier: '', password: '' })
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (Config.captchaEnabled && !captchaToken) {
      setError('Please complete the CAPTCHA')
      return
    }

    setLoading(true)
    setError('')
    try {
      const { user, error } = await AuthService.signIn(
        formData.identifier,
        formData.password,
        captchaToken ?? undefined
      )

      if (error) {
        setError(error)
      } else if (user) {
        setUser(user)
        router.push('/challenges')
      }
    } catch {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    setLoading(true)
    const { error } = await AuthService.loginWithGoogle()
    if (error) {
      setError(error)
      setLoading(false)
    }
    // Success redirect is handled by Supabase OAuth
  }

  return {
    formData,
    handleChange,
    handleLogin,
    loginWithGoogle,
    loading,
    error,
    setCaptchaToken,
    captchaEnabled: Config.captchaEnabled,
    captchaSiteKey: Config.captchaSiteKey
  }
}
