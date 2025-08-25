'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasscodeInput } from '@/components/passcode-input'
import { authService, LoginInput } from '@/lib/auth'
import { Loader2, Phone, Lock, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginInput>({
    phone: '',
    passcode: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPasscode, setShowPasscode] = useState(false)
  const router = useRouter()

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setFormData(prev => ({ ...prev, phone: value }))
    if (error) setError(null)
  }

  const handlePasscodeChange = (value: string) => {
    setFormData(prev => ({ ...prev, passcode: value }))
    if (error) setError(null)
  }

  const formatPhoneDisplay = (phone: string) => {
    if (phone.length <= 3) return phone
    if (phone.length <= 6) return `${phone.slice(0, 3)}-${phone.slice(3)}`
    return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`
  }

  const isFormValid = formData.phone.length === 10 && formData.passcode.length === 4

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      setError('Please enter a valid 10-digit phone number and 4-digit passcode')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await authService.login(formData)
      
      // Store authentication data
      authService.setToken(response.login.access_token)
      authService.setUser(response.login.user)
      
      // Redirect to dashboard or home
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-4">
            <div className="w-8 h-8 bg-primary-foreground rounded-lg" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <Card className="shadow-lg border border-border bg-card">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl text-center text-card-foreground">Login</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Enter your phone number and passcode to continue
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phone Number Input */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formatPhoneDisplay(formData.phone)}
                    onChange={handlePhoneChange}
                    className={cn(
                      'pl-10 text-lg tracking-wider bg-background border-input',
                      error && 'border-destructive focus:ring-destructive'
                    )}
                    disabled={loading}
                    autoComplete="tel"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Format: XXX-XXX-XXXX
                </p>
              </div>

              {/* Passcode Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    4-Digit Passcode
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showPasscode ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Show
                      </>
                    )}
                  </Button>
                </div>
                
                {showPasscode ? (
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Enter 4-digit passcode"
                      value={formData.passcode}
                      onChange={(e) => handlePasscodeChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className={cn(
                        'pl-10 text-center text-lg tracking-[0.5em] bg-background border-input',
                        error && 'border-destructive focus:ring-destructive'
                      )}
                      maxLength={4}
                      disabled={loading}
                    />
                  </div>
                ) : (
                  <PasscodeInput
                    value={formData.passcode}
                    onChange={handlePasscodeChange}
                    disabled={loading}
                    error={!!error}
                  />
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm text-destructive text-center">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={!isFormValid || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              {/* Form Status */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {formData.phone.length > 0 && (
                    <span className={formData.phone.length === 10 ? 'text-accent' : 'text-muted-foreground'}>
                      Phone: {formData.phone.length}/10 digits
                    </span>
                  )}
                  {formData.phone.length > 0 && formData.passcode.length > 0 && ' • '}
                  {formData.passcode.length > 0 && (
                    <span className={formData.passcode.length === 4 ? 'text-accent' : 'text-muted-foreground'}>
                      Passcode: {formData.passcode.length}/4 digits
                    </span>
                  )}
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            Secure login powered by GraphQL
          </p>
        </div>
      </div>
    </div>
  )
}
