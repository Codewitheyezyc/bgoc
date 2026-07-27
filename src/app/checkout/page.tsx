'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import CustomerHeader from '@/components/CustomerHeader'
import CustomerFooter from '@/components/CustomerFooter'
import { Card, CardContent } from '@/components/ui/card'
import { getCart, getCartSubtotal, clearCart, CartItem } from '@/lib/cart'
import { ShoppingBag, CreditCard, Loader2, CheckCircle2, Lock, Smartphone, MapPin, ArrowLeft, ShieldCheck, Clock, Box } from 'lucide-react'

function ItemThumbnail({ src, name }: { src?: string; name: string }) {
  const [error, setError] = useState(false)
  const initials = name.split(' ').map(n => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || 'P'

  if (!src || error) {
    return (
      <div style={{
        width: '54px',
        height: '54px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: '#F1F5F9',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '13px',
        color: 'var(--primary-red)',
        flexShrink: 0
      }}>
        {initials}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={src} 
      alt={name} 
      style={{ width: '54px', height: '54px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }}
      onError={() => setError(true)}
    />
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [subtotal, setSubtotal] = useState(0)

  // Auth & Profile State
  const [phone, setPhone] = useState('')
  const [checkingPhone, setCheckingPhone] = useState(false)
  const [isReturningCustomer, setIsReturningCustomer] = useState(false)
  
  // Returning Customer Verification
  const [password, setPassword] = useState('')
  const [useOtp, setUseOtp] = useState(false)
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [enteredOtp, setEnteredOtp] = useState('')
  const [otpSentMsg, setOtpSentMsg] = useState('')
  const [verifyingUser, setVerifyingUser] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  // Form Fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [newPassword, setNewPassword] = useState('') // For new customer account creation

  const [processingOrder, setProcessingOrder] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  // Load cart on mount
  useEffect(() => {
    const items = getCart()
    if (items.length === 0) {
      router.push('/')
      return
    }
    setCartItems(items)
    setSubtotal(getCartSubtotal())
  }, [router])

  // Load Paystack Inline JS script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      const existing = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]')
      if (existing) {
        document.body.removeChild(existing)
      }
    }
  }, [])

  // Auto-verify if already logged in
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, default_address')
          .eq('id', user.id)
          .single()

        if (profile) {
          setFullName(profile.full_name || '')
          setPhone(profile.phone || '')
          setEmail(user.email || '')
          setAddress(profile.default_address || '')
          setIsVerified(true)
        }
      }
    }
    checkUser()
  }, [supabase])

  // Lookup phone number when typed
  const handlePhoneBlur = async () => {
    const cleanPhone = phone.trim()
    if (cleanPhone.length < 8 || isVerified) return

    setCheckingPhone(true)
    setCheckoutError('')

    try {
      // Query profiles for existing phone number
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name, default_address')
        .eq('phone', cleanPhone)
        .maybeSingle()

      if (error) throw error

      if (profile) {
        setIsReturningCustomer(true)
        setFullName(profile.full_name || '')
        setAddress(profile.default_address || '')
      } else {
        setIsReturningCustomer(false)
        setIsVerified(false)
      }
    } catch (err) {
      console.warn('Phone check query error:', err)
    } finally {
      setCheckingPhone(false)
    }
  }

  // Generate Mock OTP
  const triggerSendOtp = () => {
    setCheckoutError('')
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(code)
    setOtpSentMsg(`[DEMO ONLY] Mock SMS sent! Enter OTP code: ${code}`)
  }

  // Handle Returning Customer Login
  const handleVerifyReturning = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifyingUser(true)
    setCheckoutError('')

    try {
      if (useOtp) {
        if (enteredOtp.trim() !== generatedOtp) {
          setCheckoutError('Incorrect OTP code. Please try again.')
          setVerifyingUser(false)
          return
        }
        
        if (!email) {
          setCheckoutError('Please enter your email address to authenticate.')
          setVerifyingUser(false)
          return
        }

        setIsVerified(true)
        setOtpSentMsg('')
      } else {
        // Authenticate with password
        if (!email) {
          setCheckoutError('Please enter the email associated with your account.')
          setVerifyingUser(false)
          return
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          throw new Error(error.message)
        }

        setIsVerified(true)
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'Verification failed.')
    } finally {
      setVerifyingUser(false)
    }
  }

  // Insert Order into Database
  const completeOrder = async (paystackRef: string) => {
    setProcessingOrder(true)
    setCheckoutError('')

    try {
      let activeUserId = ''

      // 1. If new customer, sign up to create auth session
      if (!isVerified) {
        if (!email.trim() || !newPassword.trim()) {
          throw new Error('Please create a password to secure your account.')
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: newPassword,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              role: 'customer'
            }
          }
        })

        if (authError) throw authError
        if (!authData.user) throw new Error('Failed to create account session.')
        
        activeUserId = authData.user.id
      } else {
        // Logged in user
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password: 'defaultPassword123',
            options: {
              data: {
                full_name: fullName,
                phone: phone,
                role: 'customer'
              }
            }
          })
          if (authError && !authError.message.includes('already registered')) {
            throw authError
          }
          const { data: loginData } = await supabase.auth.signInWithPassword({
            email,
            password: 'defaultPassword123'
          })
          activeUserId = loginData.user?.id || ''
        } else {
          activeUserId = currentUser.id
        }
      }

      // Update profile with current address as default
      await supabase
        .from('profiles')
        .update({ default_address: address })
        .eq('id', activeUserId)

      // 2. Insert Order row
      const storeId = cartItems[0].store_id
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: activeUserId,
          store_id: storeId,
          status: 'pending',
          total_amount: subtotal,
          delivery_address: address,
          paystack_reference: paystackRef
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 3. Insert Order Items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        size_selected: item.size_selected || null,
        unit_price: item.price
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // 4. Clear local cart
      clearCart()

      // 5. Redirect to Tracking page
      router.push(`/order/${order.id}`)
    } catch (err: any) {
      setCheckoutError(err.message || 'Error processing checkout. Verify credentials.')
    } finally {
      setProcessingOrder(false)
    }
  }

  // Paystack Popup Trigger
  const handlePaystackCheckout = (e: React.FormEvent) => {
    e.preventDefault()
    setCheckoutError('')

    if (!fullName.trim() || !phone.trim() || !email.trim() || !address.trim()) {
      setCheckoutError('Please fill in all checkout fields.')
      return
    }

    if (!isVerified && !isReturningCustomer && !newPassword.trim()) {
      setCheckoutError('Please create a password for your account registration.')
      return
    }

    if (!(window as any).PaystackPop) {
      setCheckoutError('Paystack SDK failed to load. Please use the simulated checkout button.')
      return
    }

    try {
      const handler = (window as any).PaystackPop.setup({
        key: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxx',
        email: email,
        amount: Math.round(subtotal * 100),
        currency: 'NGN',
        callback: function(response: any) {
          completeOrder(response.reference)
        },
        onClose: function() {
          alert('Payment popup closed.')
        }
      })
      handler.openIframe()
    } catch (err) {
      setCheckoutError('Paystack launch failed. Use the simulated test payment bypass.')
    }
  }

  // Bypass option for testing
  const handleSimulatedPayment = () => {
    if (!fullName.trim() || !phone.trim() || !email.trim() || !address.trim()) {
      setCheckoutError('Please fill in all checkout fields.')
      return
    }

    if (!isVerified && !isReturningCustomer && !newPassword.trim()) {
      setCheckoutError('Please create a password for your account registration.')
      return
    }

    const mockRef = 'MOCK_PAYSTACK_REF_' + Math.random().toString(36).substring(7).toUpperCase()
    completeOrder(mockRef)
  }

  return (
    <>
      <CustomerHeader />

      <main className="main-content" style={{ backgroundColor: '#F8FAFC', minHeight: 'calc(100vh - 64px)', paddingBottom: '60px' }}>
        <div className="container" style={{ paddingTop: '32px' }}>
          
          {/* Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <button 
                onClick={() => router.back()}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-secondary)', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '8px'
                }}
              >
                <ArrowLeft size={15} /> Back to Store
              </button>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.3px' }}>
                Secure Checkout
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', fontSize: '13px', color: '#047857', fontWeight: 600 }}>
              <ShieldCheck size={18} />
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>

          {checkoutError && (
            <div className="alert alert-danger" style={{ marginBottom: '24px', padding: '14px 18px', fontSize: '14px', borderRadius: 'var(--radius-md)' }}>
              {checkoutError}
            </div>
          )}

          {/* 2-Column Responsive Layout */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'minmax(0, 1fr)', 
            gap: '32px',
            alignItems: 'start'
          }}
          className="checkout-responsive-grid"
          >
            <style jsx>{`
              @media (min-width: 1024px) {
                .checkout-responsive-grid {
                  grid-template-columns: 1fr 380px !important;
                }
              }
            `}</style>

            {/* Left Column: Form Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Step 1: Customer Phone Check */}
              <Card style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <CardContent style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--primary-red)', 
                      color: '#FFFFFF', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 800, 
                      fontSize: '14px',
                      boxShadow: '0 2px 8px rgba(233, 39, 26, 0.3)'
                    }}>
                      1
                    </div>
                    <div>
                      <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>Contact Information</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Enter phone number to identify or create your account</p>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label" htmlFor="chkPhone">Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="chkPhone"
                        type="tel"
                        className="form-control font-mono"
                        placeholder="e.g. +2348031234567"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        onBlur={handlePhoneBlur}
                        disabled={isVerified}
                        required
                        style={{ paddingLeft: '40px' }}
                      />
                      <Smartphone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                    <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '6px', fontSize: '11px' }}>
                      Press Tab or click outside to auto-check saved accounts.
                    </small>
                  </div>

                  {checkingPhone && (
                    <div style={{ fontSize: '12px', color: 'var(--primary-red)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <Loader2 className="animate-spin" size={14} /> Checking phone records...
                    </div>
                  )}

                  {/* Returning Customer Sub-Form */}
                  {isReturningCustomer && !isVerified && (
                    <div style={{ marginTop: '16px', padding: '18px', backgroundColor: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '14px', fontWeight: 600 }}>
                        Welcome back! We found an account linked to this phone. Authenticate to proceed:
                      </p>

                      <div className="form-group" style={{ marginBottom: '14px' }}>
                        <label className="form-label" htmlFor="chkEmail">Email Address</label>
                        <input
                          id="chkEmail"
                          type="email"
                          className="form-control"
                          placeholder="e.g. customer@email.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      {useOtp ? (
                        <>
                          <div className="form-group" style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '14px' }}>
                            <div style={{ flex: 1 }}>
                              <label className="form-label" htmlFor="chkOtp">Enter 6-Digit OTP</label>
                              <input
                                id="chkOtp"
                                type="text"
                                className="form-control font-mono"
                                placeholder="123456"
                                value={enteredOtp}
                                onChange={e => setEnteredOtp(e.target.value)}
                              />
                            </div>
                            <button type="button" className="btn btn-secondary" onClick={triggerSendOtp}>Send OTP</button>
                          </div>
                          {otpSentMsg && (
                            <div className="alert alert-success" style={{ padding: '8px 12px', fontSize: '11px', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '14px' }}>
                              <CheckCircle2 size={14} /> {otpSentMsg}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="form-group" style={{ marginBottom: '14px' }}>
                          <label className="form-label" htmlFor="chkPass">Password</label>
                          <input
                            id="chkPass"
                            type="password"
                            className="form-control"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                          />
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                        <button type="button" className="btn btn-primary" onClick={handleVerifyReturning} disabled={verifyingUser} style={{ padding: '8px 18px', fontSize: '13px' }}>
                          {verifyingUser ? 'Verifying...' : 'Verify & Log In'}
                        </button>
                        <button type="button" style={{ background: 'none', border: 'none', color: 'var(--primary-red)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setUseOtp(!useOtp); setCheckoutError(''); }}>
                          {useOtp ? 'Use password instead' : 'Log in with mock SMS OTP'}
                        </button>
                      </div>
                    </div>
                  )}

                  {isVerified && (
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginTop: '8px', 
                      color: '#047857', 
                      backgroundColor: '#ECFDF5', 
                      border: '1px solid #A7F3D0',
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '12px', 
                      fontWeight: 700 
                    }}>
                      <CheckCircle2 size={16} /> Verified Account Session Active
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 2: Shipping/Delivery Info */}
              <Card style={{ opacity: (isReturningCustomer && !isVerified) ? 0.6 : 1, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <CardContent style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--primary-red)', 
                      color: '#FFFFFF', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 800, 
                      fontSize: '14px',
                      boxShadow: '0 2px 8px rgba(233, 39, 26, 0.3)'
                    }}>
                      2
                    </div>
                    <div>
                      <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>Delivery Address & Recipient</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Where should we send your order?</p>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label" htmlFor="chkName">Full Name</label>
                    <input
                      id="chkName"
                      type="text"
                      className="form-control"
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      disabled={isVerified || (isReturningCustomer && !isVerified)}
                      required
                    />
                  </div>

                  {!isReturningCustomer && !isVerified && (
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label className="form-label" htmlFor="newEmail">Email Address</label>
                      <input
                        id="newEmail"
                        type="email"
                        className="form-control"
                        placeholder="e.g. johndoe@gmail.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label" htmlFor="chkAddr">Delivery Address</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="chkAddr"
                        type="text"
                        className="form-control"
                        placeholder="e.g. Room 204, Pinnacle Mall Residence, Victoria Island, Lagos"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        disabled={isReturningCustomer && !isVerified}
                        required
                        style={{ paddingLeft: '40px' }}
                      />
                      <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  {/* Password field for new customers */}
                  {!isReturningCustomer && !isVerified && (
                    <div className="form-group" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px', marginBottom: '0' }}>
                      <label className="form-label" htmlFor="chkNewPass" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Lock size={14} style={{ color: 'var(--primary-red)' }} /> Create Password (for tracking your order later)
                      </label>
                      <input
                        id="chkNewPass"
                        type="password"
                        className="form-control"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 3: Payment Buttons */}
              <Card style={{ opacity: (isReturningCustomer && !isVerified) ? 0.6 : 1, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <CardContent style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--primary-red)', 
                      color: '#FFFFFF', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 800, 
                      fontSize: '14px',
                      boxShadow: '0 2px 8px rgba(233, 39, 26, 0.3)'
                    }}>
                      3
                    </div>
                    <div>
                      <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>Payment Option</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Choose your preferred payment method</p>
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.4 }}>
                    Orders are processed securely. Pay instantly with your debit card, transfer, or USSD via Paystack, or choose simulated bypass for local testing.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Paystack Payment Option */}
                    <button
                      type="button"
                      className="btn"
                      style={{ 
                        padding: '16px', 
                        width: '100%', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px', 
                        backgroundColor: '#059669', 
                        color: '#FFFFFF',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '15px',
                        fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onClick={handlePaystackCheckout}
                      disabled={processingOrder || (isReturningCustomer && !isVerified)}
                    >
                      {processingOrder ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />} 
                      <span>Pay with Paystack (₦{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
                    </button>

                    {/* Simulated Bypass Option */}
                    <button
                      type="button"
                      className="btn"
                      style={{ 
                        padding: '14px', 
                        width: '100%', 
                        backgroundColor: '#FFFFFF',
                        border: '1.5px dashed var(--primary-red)', 
                        color: 'var(--primary-red)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      onClick={handleSimulatedPayment}
                      disabled={processingOrder || (isReturningCustomer && !isVerified)}
                    >
                      {processingOrder ? <Loader2 className="animate-spin" size={16} /> : 'Simulate Test Payment (Bypass)'}
                    </button>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Right Column: Sticky Order Summary Sidebar */}
            <div style={{ position: 'sticky', top: '90px' }}>
              <Card style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', backgroundColor: '#FFFFFF' }}>
                <CardContent style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '18px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShoppingBag size={18} style={{ color: 'var(--primary-red)' }} /> Order Summary
                    </h3>
                    <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#FEF2F2', color: 'var(--primary-red)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      {cartItems.reduce((acc, item) => acc + item.quantity, 0)} Items
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    Merchant Store:<br />
                    <strong style={{ color: 'var(--ink)', fontSize: '13px' }}>{cartItems[0]?.store_name}</strong>
                  </div>

                  {/* Cart Items List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px', maxHeight: '280px', overflowY: 'auto' }}>
                    {cartItems.map(item => (
                      <div key={`${item.id}-${item.size_selected}`} style={{ display: 'flex', gap: '12px', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                        <ItemThumbnail src={item.image_url} name={item.name} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                          {item.size_selected && (
                            <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)', backgroundColor: '#F1F5F9', padding: '1px 6px', borderRadius: '2px', display: 'inline-block', marginTop: '2px' }}>
                              Size: {item.size_selected}
                            </span>
                          )}
                          <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                            Qty: {item.quantity} × ₦{item.price.toLocaleString()}
                          </div>
                        </div>
                        <span className="font-mono" style={{ fontWeight: 800, fontSize: '13px', color: 'var(--ink)' }}>
                          ₦{(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total Line */}
                  <div style={{ borderTop: '2px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ink)' }}>Total Payable</span>
                    <span className="font-mono" style={{ fontSize: '22px', fontWeight: 900, color: 'var(--primary-red)' }}>
                      ₦{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Delivery Estimate Pill */}
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    {cartItems[0]?.fulfillment_type === 'instant' ? (
                      <>
                        <Clock size={16} style={{ color: '#B45309', flexShrink: 0 }} />
                        <div>
                          <span style={{ display: 'block', fontWeight: 700, color: '#B45309' }}>Instant Dispatch</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Est. prep & delivery: 25-45 mins</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Box size={16} style={{ color: '#047857', flexShrink: 0 }} />
                        <div>
                          <span style={{ display: 'block', fontWeight: 700, color: '#047857' }}>Standard Shipping</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Est. delivery: 1-3 business days</span>
                        </div>
                      </>
                    )}
                  </div>

                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </main>

      <CustomerFooter />
    </>
  )
}
