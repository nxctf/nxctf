import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '../services/auth.service'
import { useAuth } from '@/shared/contexts/AuthContext'
import { isValidUsername } from '../lib/auth-utils'
import Config from '@/config'

export function useRegister() {
  const router = useRouter()
  const { setUser } = useAuth()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (Config.captchaEnabled && !captchaToken) {
      setError('Please complete the CAPTCHA')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    const usernameError = isValidUsername(formData.username)
    if (usernameError) {
      setError(usernameError)
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { user, error, message, emailConfirmationRequired } = await AuthService.signUp(
        formData.email,
        formData.password,
        formData.username,
        captchaToken ?? undefined
      )

      if (error) {
        setError(error)
      } else if (emailConfirmationRequired) {
        setSuccess(message ?? 'Registration successful. Please check your email to confirm your account before signing in.')
        setFormData((current) => ({
          ...current,
          password: '',
          confirmPassword: ''
        }))
        setCaptchaToken(null)
      } else if (user) {
        setUser(user)
        router.push('/challenges')
      }
    } catch {
      setError('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const registerWithGoogle = async () => {
    setLoading(true)
    const { error } = await AuthService.loginWithGoogle()
    if (error) {
      setError(error)
      setLoading(false)
    }
  }

  return {
    formData,
    handleChange,
    handleRegister,
    registerWithGoogle,
    loading,
    error,
    success,
    setCaptchaToken,
    captchaEnabled: Config.captchaEnabled,
    captchaSiteKey: Config.captchaSiteKey
  }
}
