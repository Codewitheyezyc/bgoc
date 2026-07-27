'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react'

export default function RegisterEntry() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Check if user is already logged in or if email was confirmed via callback
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('confirmed=true')) {
      setSuccessMsg('✓ Email verified successfully! Please log in with your credentials below.')
      setIsSignUp(false)
    }

    async function checkUser() {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error || !data?.user) return

        // Check if they have a store
        const { data: stores } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_user_id', data.user.id)
          .limit(1)

        if (stores && stores.length > 0) {
          router.push('/dashboard')
        } else {
          router.push('/register/details')
        }
      } catch (err) {
        console.warn('Auth check error ignored:', err)
      }
    }
    checkUser()
  }, [supabase, router])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/register`
      })

      if (error) throw error

      setSuccessMsg('Password reset instructions have been sent to your email address!')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send reset link. Please check your email address.')
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    if (isSignUp) {
      // Validate inputs
      if (!fullName.trim() || !phone.trim()) {
        setErrorMsg('Please fill in your name and phone number.')
        setLoading(false)
        return
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/register`,
          data: {
            full_name: fullName,
            phone: phone,
            role: 'store_manager',
          },
        },
      })

      if (error) {
        setErrorMsg(error.message)
      } else if (data.user && !data.session) {
        setSuccessMsg('✓ Account registered! A confirmation link has been sent to your email. Please check your inbox and click the verification link to log in.')
      } else {
        setSuccessMsg('Account created successfully! Redirecting...')
        setTimeout(() => {
          router.push('/register/details')
        }, 1500)
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message)
      } else if (data.user) {
        // Check if they have a store
        const { data: stores } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_user_id', data.user.id)
          .limit(1)

        if (stores && stores.length > 0) {
          router.push('/dashboard')
        } else {
          router.push('/register/details')
        }
      }
    }
    setLoading(false)
  }

  return (
    <>
      <header className="platform-header" style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1.5px solid var(--border)', padding: '14px 0', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Image 
              src="/logo.png" 
              alt="BGOC Logo" 
              width={38} 
              height={38} 
              style={{ objectFit: 'contain' }}
              priority
            />
            <span className="platform-title font-sans" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--primary-red)', letterSpacing: '-0.2px' }}>Beverly Group</span>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)' }}>Merchant Portal</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="main-content">
        <div className="container" style={{ maxWidth: '480px', marginTop: '20px', paddingBottom: '40px' }}>
          <div className="card">
            {isForgotPassword ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEF2F2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <KeyRound size={24} color="var(--primary-red)" />
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px' }}>Reset Password</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', lineHeight: 1.4 }}>
                    Enter your merchant email address and we'll send you a password reset link.
                  </p>
                </div>

                {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                {successMsg && <div className="alert alert-success">{successMsg}</div>}

                <form onSubmit={handleResetPassword}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="resetEmail">Email Address</label>
                    <input
                      id="resetEmail"
                      type="email"
                      className="form-control"
                      placeholder="manager@beverly.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '12px' }}
                    disabled={loading}
                  >
                    {loading ? 'Sending link...' : 'Send Reset Link'}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onClick={() => { setIsForgotPassword(false); setErrorMsg(''); setSuccessMsg(''); }}
                  >
                    <ArrowLeft size={16} /> Back to Log In
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="card-title text-center" style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.3px' }}>
                  {isSignUp ? 'Register as Store Manager' : 'Store Manager Portal'}
                </h2>
                <p className="text-center" style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px', lineHeight: 1.4 }}>
                  {isSignUp 
                    ? 'Set up your manager account to register your store on the Beverly Group platform.' 
                    : 'Log in to manage your products, update orders, or check review status.'}
                </p>

                {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                {successMsg && <div className="alert alert-success">{successMsg}</div>}

                <form onSubmit={handleAuth}>
                  {isSignUp && (
                    <>
                      <div className="form-group">
                        <label className="form-label" htmlFor="fullName">Full Name</label>
                        <input
                          id="fullName"
                          type="text"
                          className="form-control"
                          placeholder="e.g. Isaac Johnson"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="phone">Phone Number</label>
                        <input
                          id="phone"
                          type="tel"
                          className="form-control"
                          placeholder="e.g. +234 803 123 4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      className="form-control"
                      placeholder="manager@beverly.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={() => { setIsForgotPassword(true); setErrorMsg(''); setSuccessMsg(''); }}
                          style={{ background: 'none', border: 'none', color: 'var(--primary-red)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        className="form-control"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ paddingRight: '44px' }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px'
                        }}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '12px' }}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : isSignUp ? 'Create Manager Account' : 'Log In'}
                  </button>
                </form>

                <div className="text-center mt-24" style={{ fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {isSignUp ? 'Already have an account? ' : "New store manager? "}
                  </span>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-red)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                    onClick={() => {
                      setIsSignUp(!isSignUp)
                      setErrorMsg('')
                    }}
                  >
                    {isSignUp ? 'Log In here' : 'Register here'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
