import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '../services/auth.service'
import { useAuth } from '@/shared/contexts/AuthContext'
import { isValidUsername } from '../lib/auth-utils'
import { CAPTCHA_ENABLED, CAPTCHA_SITE_KEY } from '@/_vars/const'
import { supabase } from '@/lib/supabase/client'

export function useRegister() {
  const router = useRouter()
  const { setUser } = useAuth()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)
  const [signupDisabled, setSignupDisabled] = useState<boolean>(false)
  const [checkingSettings, setCheckingSettings] = useState(true)
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

  useEffect(() => {
    async function checkSignupSettings() {
      try {
        const { data, error } = await supabase.rpc('get_system_setting', { p_key: 'disable_signup' })
        if (!error && data === 'true') {
          setSignupDisabled(true)
        }
      } catch (err) {
        console.error('Error checking signup settings:', err)
      } finally {
        setCheckingSettings(false)
      }
    }
    checkSignupSettings()
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (signupDisabled) {
      setError('Registration is currently disabled')
      return
    }

    if (CAPTCHA_ENABLED && !captchaToken) {
      setError('Please complete the CAPTCHA')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    const usernameTrimmed = formData.username.trim()
    const usernameError = isValidUsername(usernameTrimmed)
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
        usernameTrimmed,
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
      } else if (user) {
        setUser(user)
        router.push('/challenges')
      }
    } catch {
      setError('Registration failed')
    } finally {
      setCaptchaToken(null)
      setTurnstileKey((k) => k + 1)
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
    turnstileKey,
    captchaEnabled: CAPTCHA_ENABLED,
    captchaSiteKey: CAPTCHA_SITE_KEY,
    signupDisabled,
    checkingSettings
  }
}
