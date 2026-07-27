'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'
import { 
  Check, X, ShieldAlert, LogOut, MessageSquare, AlertCircle, Menu, Bell,
  BarChart3, UserCheck, LayoutGrid, ClipboardList, Users, DollarSign, Settings,
  ChevronLeft, ChevronRight, Ban, Eye, EyeOff, PlusCircle, Upload, PanelLeft, KeyRound, ArrowLeft
} from 'lucide-react'

interface Store {
  id: string
  name: string
  category: string
  description: string
  logo_url: string
  fulfillment_type: string
  approval_status: string
  rejection_reason?: string
  profiles?: {
    full_name: string
    phone: string
  }
}

type Tab = 'overview' | 'approvals' | 'all-stores' | 'preload' | 'all-orders' | 'users' | 'payouts' | 'settings'

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()

  // Layout State
  const [currentTab, setCurrentTab] = useState<Tab>('approvals')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  // Admin Login State
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showAdminPass, setShowAdminPass] = useState(false)
  const [isAdminForgotPass, setIsAdminForgotPass] = useState(false)
  const [adminResetMsg, setAdminResetMsg] = useState('')
  const [adminAuthLoading, setAdminAuthLoading] = useState(false)
  const [adminAuthError, setAdminAuthError] = useState('')

  // Auto-collapse sidebar on mobile/tablet viewports on mount and resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setIsSidebarCollapsed(true)
      } else {
        setIsSidebarCollapsed(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Rejection Form State
  const [rejectingStoreId, setRejectingStoreId] = useState<string | null>(null)
  const [rejectionNote, setRejectionNote] = useState('')
  const [rejectError, setRejectError] = useState('')

  // Pre-load Shell Form State
  const [shellName, setShellName] = useState('')
  const [shellLogoFile, setShellLogoFile] = useState<File | null>(null)
  const [shellLoading, setShellLoading] = useState(false)
  const [shellError, setShellError] = useState('')
  const [shellSuccess, setShellSuccess] = useState('')

  const fetchStores = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          profiles:owner_user_id (
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setStores(data || [])
    } catch (err) {
      console.error('Error fetching admin stores:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const checkUserAndRole = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data?.user) {
        setUser(null)
        setRole(null)
        setLoading(false)
        return
      }

      setUser(data.user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      setRole(profile?.role || 'customer')

      if (profile?.role === 'group_admin') {
        fetchStores()
      } else {
        setLoading(false)
      }
    } catch (err) {
      console.warn('Admin check error:', err)
      setUser(null)
      setRole(null)
      setLoading(false)
    }
  }, [supabase, fetchStores])

  useEffect(() => {
    checkUserAndRole()
  }, [checkUserAndRole])

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdminAuthLoading(true)
    setAdminAuthError('')

    try {
      let targetUser: any = null

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      })

      if (signInError || !signInData.user) {
        // Fallback to signUp if user is not registered in GoTrue yet
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: adminEmail,
          password: adminPassword,
          options: {
            data: { full_name: 'Beverly Group Admin', role: 'group_admin' }
          }
        })

        if (signUpError) {
          const rawErrMsg = signInError?.message || signUpError.message
          throw new Error(rawErrMsg && rawErrMsg !== '0' ? rawErrMsg : 'Invalid login credentials. Please check your email and password.')
        }

        targetUser = signUpData.user
      } else {
        targetUser = signInData.user
      }

      if (targetUser) {
        // Ensure profile has group_admin role in DB
        await supabase
          .from('profiles')
          .upsert({ id: targetUser.id, full_name: 'Beverly Group Admin', role: 'group_admin' })

        await checkUserAndRole()
      }
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message
      setAdminAuthError(!msg || msg === '0' ? 'Invalid admin login credentials. Please check your password.' : msg)
    } finally {
      setAdminAuthLoading(false)
    }
  }

  const handleResetAllStoreClaims = async () => {
    if (!confirm('Are you sure you want to reset ALL 7 store claims to unclaimed? This will clear all existing store claims so vendors can register afresh.')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          owner_user_id: null,
          approval_status: 'unclaimed',
          rejection_reason: null
        })
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (error) throw error

      alert('✓ All store claims have been successfully reset to unclaimed!')
      fetchStores()
    } catch (err: any) {
      alert('Error resetting stores: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/register')
  }

  const handleApprove = async (storeId: string) => {
    setActionLoadingId(storeId)
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          approval_status: 'approved',
          rejection_reason: null
        })
        .eq('id', storeId)

      if (error) throw error
      
      setStores(prev =>
        prev.map(s => s.id === storeId ? { ...s, approval_status: 'approved', rejection_reason: undefined } : s)
      )
    } catch (err: any) {
      alert(err.message || 'Error approving store')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleSuspend = async (storeId: string) => {
    setActionLoadingId(storeId)
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          approval_status: 'suspended',
          rejection_reason: 'Suspended by system administrator.'
        })
        .eq('id', storeId)

      if (error) throw error

      setStores(prev =>
        prev.map(s => s.id === storeId ? { ...s, approval_status: 'suspended', rejection_reason: 'Suspended by system administrator.' } : s)
      )
    } catch (err: any) {
      alert(err.message || 'Error suspending store')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingStoreId) return

    setRejectError('')
    if (!rejectionNote.trim()) {
      setRejectError('Please enter a reason for rejecting the store.')
      return
    }

    setActionLoadingId(rejectingStoreId)
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          approval_status: 'suspended',
          rejection_reason: rejectionNote
        })
        .eq('id', rejectingStoreId)

      if (error) throw error

      setStores(prev =>
        prev.map(s => s.id === rejectingStoreId ? { ...s, approval_status: 'suspended', rejection_reason: rejectionNote } : s)
      )

      setRejectingStoreId(null)
      setRejectionNote('')
    } catch (err: any) {
      setRejectError(err.message || 'Error rejecting store')
    } finally {
      setActionLoadingId(null)
    }
  }

  const getPageTitle = () => {
    switch (currentTab) {
      case 'overview': return 'Overview Insights'
      case 'approvals': return 'Store Approvals Queue'
      case 'all-stores': return 'All Registered Stores'
      case 'preload': return 'Pre-load Store Shells'
      case 'all-orders': return 'Global Orders'
      case 'users': return 'Platform Users'
      case 'payouts': return 'Payout Settlements'
      case 'settings': return 'System Settings'
    }
  }

  const handleShellLogoUpload = async (file: File): Promise<string> => {
    const timestamp = Math.round(new Date().getTime() / 1000)
    const paramsToSign = { timestamp }

    const signRes = await fetch('/api/cloudinary-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paramsToSign })
    })

    if (!signRes.ok) throw new Error('Cloudinary credentials not configured')

    const { signature, apiKey, cloudName } = await signRes.json()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', apiKey)
    formData.append('timestamp', timestamp.toString())
    formData.append('signature', signature)

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    })

    if (!uploadRes.ok) throw new Error('Upload to Cloudinary failed')
    const uploadData = await uploadRes.json()
    return uploadData.secure_url
  }

  const handleCreateShell = async (e: React.FormEvent) => {
    e.preventDefault()
    setShellError('')
    setShellSuccess('')

    if (!shellName.trim()) {
      setShellError('Store name is required.')
      return
    }
    if (!shellLogoFile) {
      setShellError('A logo file is required.')
      return
    }

    setShellLoading(true)
    try {
      const logoUrl = await handleShellLogoUpload(shellLogoFile)
      const slug = shellName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000)

      const { error } = await supabase.from('stores').insert({
        name: shellName,
        slug,
        logo_url: logoUrl,
        approval_status: 'unclaimed',
        owner_user_id: null,
        category: 'food',        // placeholder — manager fills this in on claim
        fulfillment_type: 'instant', // placeholder — manager fills this in on claim
        description: ''
      })

      if (error) throw new Error(error.message)

      setShellSuccess(`"${shellName}" has been added as an unclaimed store shell. Managers can now claim it from the registration page.`)
      setShellName('')
      setShellLogoFile(null)
      // Reset file input
      const fileInput = document.getElementById('shellLogoInput') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      fetchStores()
    } catch (err: any) {
      setShellError(err.message || 'Failed to create store shell.')
    } finally {
      setShellLoading(false)
    }
  }

  const getInitials = (emailStr: string) => {
    return emailStr.split('@')[0].substring(0, 2).toUpperCase()
  }

  // Unauthenticated State: Show Admin Access Portal directly on /admin
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
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
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-gold)' }}>Admin Portal</span>
              </span>
            </Link>
          </div>
        </header>

        <main className="main-content">
          <div className="container" style={{ maxWidth: '440px', marginTop: '36px', paddingBottom: '48px' }}>
            <div className="card" style={{ padding: '32px', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#FEF2F2', border: '1.5px solid rgba(233,39,26,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <ShieldAlert size={28} style={{ color: 'var(--primary-red)' }} />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)' }}>Admin Access Portal</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                  Log in to manage store approvals, platform configuration, and system oversight.
                </p>
              </div>

              {adminAuthError && (
                <div className="alert alert-danger" style={{ marginBottom: '16px', fontSize: '13px', padding: '10px 14px' }}>
                  {adminAuthError}
                </div>
              )}
              {adminResetMsg && (
                <div className="alert alert-success" style={{ marginBottom: '16px', fontSize: '13px', padding: '10px 14px' }}>
                  {adminResetMsg}
                </div>
              )}

              {isAdminForgotPass ? (
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  if (!adminEmail.trim()) { setAdminAuthError('Please enter your admin email.'); return }
                  setAdminAuthLoading(true)
                  setAdminAuthError('')
                  setAdminResetMsg('')
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(adminEmail, {
                      redirectTo: `${window.location.origin}/admin`
                    })
                    if (error) throw error
                    setAdminResetMsg('Password reset instructions sent to your email!')
                  } catch (err: any) {
                    setAdminAuthError(err.message || 'Failed to send reset link.')
                  } finally {
                    setAdminAuthLoading(false)
                  }
                }}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label" htmlFor="admResetEmail">Admin Email</label>
                    <input
                      id="admResetEmail"
                      type="email"
                      className="form-control"
                      placeholder="admin@beverly.com"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}
                    disabled={adminAuthLoading}
                  >
                    {adminAuthLoading ? 'Sending link...' : 'Send Reset Link'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ width: '100%', padding: '10px', fontSize: '12px' }}
                    onClick={() => { setIsAdminForgotPass(false); setAdminAuthError(''); setAdminResetMsg(''); }}
                  >
                    Back to Admin Log In
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAdminLogin}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label" htmlFor="admEmail">Admin Email</label>
                    <input
                      id="admEmail"
                      type="email"
                      className="form-control"
                      placeholder="e.g. admin@beverly.com"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" htmlFor="admPass" style={{ marginBottom: 0 }}>Password</label>
                      <button
                        type="button"
                        onClick={() => { setIsAdminForgotPass(true); setAdminAuthError(''); setAdminResetMsg(''); }}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-red)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        id="admPass"
                        type={showAdminPass ? 'text' : 'password'}
                        className="form-control"
                        placeholder="••••••••"
                        value={adminPassword}
                        onChange={e => setAdminPassword(e.target.value)}
                        style={{ paddingRight: '44px' }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPass(!showAdminPass)}
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
                        title={showAdminPass ? 'Hide password' : 'Show password'}
                      >
                        {showAdminPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: 'var(--radius-sm)' }}
                    disabled={adminAuthLoading}
                  >
                    {adminAuthLoading ? 'Authenticating...' : 'Log In as Administrator'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Access Denied State (Logged in as customer or store manager)
  if (role !== 'group_admin') {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto 0' }}>
        <div className="card text-center" style={{ border: '1.5px solid var(--pending)' }}>
          <ShieldAlert size={48} style={{ color: 'var(--pending)', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            Only users with the role <strong>group_admin</strong> can access the approval dashboard. Your current profile role is <strong>{role || 'unknown'}</strong>.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Log Out / Switch Account
            </button>
          </div>
        </div>
      </div>
    )
  }

  const pendingStoresCount = stores.filter(s => s.approval_status === 'pending').length
  const userInitials = user?.email ? getInitials(user.email) : 'A'

  return (
    <div className={`dashboard-wrapper ${isSidebarCollapsed ? 'collapsed-sidebar' : ''}`}>
      
      {/* Dimmed mobile overlay */}
      <div 
        className={`sidebar-overlay ${!isSidebarCollapsed ? 'active' : ''}`} 
        onClick={() => setIsSidebarCollapsed(true)}
      />

      {/* Fixed Sidebar */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Image 
            src="/logo.png" 
            alt="BGOC Logo" 
            width={36} 
            height={36} 
            style={{ objectFit: 'contain', flexShrink: 0 }} 
          />
          {!isSidebarCollapsed && (
            <span className="platform-title font-sans" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--primary-red)', letterSpacing: '-0.2px' }}>Beverly Group</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent-gold)' }}>Admin Panel</span>
            </span>
          )}
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-title">Monitor</span>

          <button 
            className={`sidebar-item ${currentTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setCurrentTab('overview'); if (window.innerWidth <= 1024) setIsSidebarCollapsed(true); }}
          >
            <BarChart3 size={18} />
            <span>Overview</span>
          </button>

          <button 
            className={`sidebar-item ${currentTab === 'approvals' ? 'active' : ''}`}
            onClick={() => { setCurrentTab('approvals'); if (window.innerWidth <= 1024) setIsSidebarCollapsed(true); }}
          >
            <UserCheck size={18} />
            <span>Store Approvals</span>
          </button>

          <button 
            className={`sidebar-item ${currentTab === 'all-stores' ? 'active' : ''}`}
            onClick={() => { setCurrentTab('all-stores'); if (window.innerWidth <= 1024) setIsSidebarCollapsed(true); }}
          >
            <LayoutGrid size={18} />
            <span>All Stores</span>
          </button>

          <button 
            className={`sidebar-item ${currentTab === 'preload' ? 'active' : ''}`}
            onClick={() => { setCurrentTab('preload'); if (window.innerWidth <= 1024) setIsSidebarCollapsed(true); }}
          >
            <PlusCircle size={18} />
            <span>Pre-load Shells</span>
          </button>

          <button 
            className={`sidebar-item ${currentTab === 'all-orders' ? 'active' : ''} sidebar-item disabled`}
            onClick={() => {}}
            title="Coming soon in Phase 2"
          >
            <ClipboardList size={18} />
            <span>All Orders</span>
          </button>

          <button 
            className={`sidebar-item ${currentTab === 'users' ? 'active' : ''} sidebar-item disabled`}
            onClick={() => {}}
            title="Coming soon in Phase 3"
          >
            <Users size={18} />
            <span>Users</span>
          </button>

          <span className="sidebar-section-title">Finance & Config</span>

          <button 
            className={`sidebar-item ${currentTab === 'payouts' ? 'active' : ''} sidebar-item disabled`}
            onClick={() => {}}
            title="Coming soon in Phase 3"
          >
            <DollarSign size={18} />
            <span>Payouts</span>
          </button>

          <button 
            className={`sidebar-item ${currentTab === 'settings' ? 'active' : ''} sidebar-item disabled`}
            onClick={() => {}}
            title="Coming soon"
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button 
            className="sidebar-item" 
            onClick={handleLogout}
            style={{ color: 'var(--danger)', fontSize: '13px' }}
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Fixed Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button 
            className="header-toggle-menu" 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title="Toggle Sidebar"
            style={{ marginRight: '8px' }}
          >
            <PanelLeft size={20} />
          </button>
          <div className="header-title">{getPageTitle()}</div>
        </div>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--accent-gold)', color: '#B45309', backgroundColor: '#FEF3C7', fontWeight: 700 }}
            onClick={handleResetAllStoreClaims}
            title="Reset all store claims to unclaimed state"
          >
            🔄 Reset All Store Claims
          </button>

          <button className="header-notification">
            <Bell size={18} />
            {pendingStoresCount > 0 && (
              <span className="notification-badge font-mono">{pendingStoresCount}</span>
            )}
          </button>

          <div className="header-user-menu">
            <div 
              className="header-user-avatar" 
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              {userInitials}
            </div>
            
            {showUserDropdown && (
              <div className="header-user-dropdown">
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Logged in as:<br/>
                  <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>
                </div>
                <button className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="dashboard-content">
        
        {/* =========================================================================
           TAB: Overview
           ========================================================================= */}
        {currentTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div className="card">
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px' }}>Total Registered Stores</h4>
                <div className="font-mono" style={{ fontSize: '32px', fontWeight: 700 }}>{stores.length}</div>
              </div>
              <div className="card">
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px' }}>Pending Approvals</h4>
                <div className="font-mono" style={{ fontSize: '32px', fontWeight: 700, color: pendingStoresCount > 0 ? 'var(--pending)' : 'var(--text-primary)' }}>{pendingStoresCount}</div>
              </div>
              <div className="card">
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px' }}>System Revenue</h4>
                <div className="font-mono" style={{ fontSize: '32px', fontWeight: 700 }}>₦0.00</div>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Registration Activity</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                There are currently <strong className="font-mono">{pendingStoresCount}</strong> store applications waiting in the approval queue.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
           TAB: Store Approvals (The active queue)
           ========================================================================= */}
        {currentTab === 'approvals' && (
          <div>
            {/* Rejection Note Overlay form */}
            {rejectingStoreId && (
              <div className="card mb-24" style={{ border: '1.5px solid var(--danger)' }}>
                <h3 className="card-title">Reject Registration</h3>
                {rejectError && <div className="alert alert-danger">{rejectError}</div>}
                <form onSubmit={handleRejectSubmit}>
                  <div className="form-group">
                    <label className="form-label">Reason for rejection (sent back to store dashboard)</label>
                    <textarea
                      className="form-control"
                      placeholder="e.g. Logo image is blurry. Please upload a clear SVG or PNG with transparent background."
                      value={rejectionNote}
                      onChange={e => setRejectionNote(e.target.value)}
                      style={{ minHeight: '100px', resize: 'vertical' }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" className="btn btn-danger" disabled={actionLoadingId !== null}>
                      Reject & Send Feedback
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => { setRejectingStoreId(null); setRejectionNote(''); }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {stores.filter(s => s.approval_status === 'pending').length === 0 ? (
              <div className="card text-center" style={{ padding: '60px 0', color: 'var(--text-secondary)' }}>
                <Check size={36} style={{ color: 'var(--success)', marginBottom: '12px' }} />
                <div>All caught up! No store registrations are pending review.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {stores.filter(s => s.approval_status === 'pending').map(store => (
                  <div key={store.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={store.logo_url} alt={store.name} style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border)' }} />
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{store.name}</h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>
                            Category: <span style={{ textTransform: 'capitalize' }}>{store.category}</span> | {store.fulfillment_type === 'instant' ? 'Instant/Same-day' : 'Shippable'}
                          </p>
                        </div>
                      </div>
                      <span className="badge badge-pending">PENDING</span>
                    </div>

                    <div style={{ padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', fontSize: '13px', border: '1px solid var(--border)', lineHeight: 1.5 }}>
                      <div style={{ marginBottom: '6px' }}><strong>Description:</strong> {store.description || 'No description provided.'}</div>
                      <div><strong>Manager:</strong> {store.profiles?.full_name || 'N/A'} ({store.profiles?.phone || 'N/A'})</div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleApprove(store.id)}
                        disabled={actionLoadingId !== null}
                        style={{ backgroundColor: 'var(--success)' }}
                      >
                        <Check size={16} /> Approve
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => setRejectingStoreId(store.id)}
                        disabled={actionLoadingId !== null}
                      >
                        <X size={16} /> Reject with Note
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
           TAB: All Stores
           ========================================================================= */}
        {currentTab === 'all-stores' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {stores.length === 0 && (
              <div className="card text-center" style={{ padding: '48px 0', color: 'var(--text-muted)' }}>No stores registered yet.</div>
            )}
            {stores.map(store => (
              <div key={store.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {store.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={store.logo_url} alt={store.name} style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border)' }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: 'var(--text-muted)' }}>
                        {store.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 700 }}>{store.name}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>
                        {store.approval_status === 'unclaimed'
                          ? 'Not yet claimed by a manager'
                          : `Category: ${store.category} | ${store.fulfillment_type === 'instant' ? 'Instant/Same-day' : 'Shippable'}`
                        }
                      </p>
                    </div>
                  </div>
                  <span
                    className={`badge badge-${store.approval_status === 'unclaimed' ? 'pending' : store.approval_status}`}
                    style={store.approval_status === 'unclaimed' ? { backgroundColor: '#F3F4F6', color: '#6B7280', border: '1px solid #D1D5DB' } : {}}
                  >
                    {store.approval_status.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px', flexWrap: 'wrap', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {store.approval_status === 'unclaimed'
                      ? 'Awaiting a manager to claim this store'
                      : `Manager: ${store.profiles?.full_name || 'N/A'} (${store.profiles?.phone || 'N/A'})`
                    }
                  </span>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {store.approval_status === 'pending' && (
                      <button className="btn btn-primary" onClick={() => handleApprove(store.id)} style={{ backgroundColor: 'var(--success)', padding: '6px 12px', fontSize: '12px' }}>
                        Approve
                      </button>
                    )}
                    {store.approval_status === 'approved' && (
                      <button className="btn btn-danger" onClick={() => handleSuspend(store.id)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                        <Ban size={12} /> Suspend Listing
                      </button>
                    )}
                    {store.approval_status === 'suspended' && (
                      <button className="btn btn-primary" onClick={() => handleApprove(store.id)} style={{ backgroundColor: 'var(--success)', padding: '6px 12px', fontSize: '12px' }}>
                        Re-approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* =========================================================================
           TAB: Pre-load Store Shells
           ========================================================================= */}
        {currentTab === 'preload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Explainer */}
            <div className="card" style={{ borderLeft: '4px solid var(--primary-red)', padding: '20px 24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>What this does</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Pre-loading a store shell means creating a placeholder row in the database with the store's real name and logo —
                before any manager has claimed it. The manager then visits the registration page, sees their store already listed,
                clicks it, and claims it. They fill in the remaining details themselves.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '8px' }}>
                This is a one-time action per founding store. You only need to pre-load the seven Beverly Group stores.
                Future outside vendors register fully themselves.
              </p>
            </div>

            {/* Pre-load Form */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '20px' }}>Add a store shell</h3>

              {shellError && <div className="alert alert-danger">{shellError}</div>}
              {shellSuccess && <div className="alert alert-success">{shellSuccess}</div>}

              <form onSubmit={handleCreateShell}>
                <div className="form-group">
                  <label className="form-label" htmlFor="shellName">Store Name</label>
                  <input
                    id="shellName"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Beverly Bakeries and Confectionery"
                    value={shellName}
                    onChange={e => setShellName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="shellLogoInput">Store Logo</label>
                  <input
                    id="shellLogoInput"
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        setShellLogoFile(e.target.files[0])
                      }
                    }}
                    required
                  />
                  <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '6px', fontSize: '11px' }}>
                    Upload the real store logo. This will be shown to managers on the claim page and on the public storefront.
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ marginTop: '8px' }}
                  disabled={shellLoading}
                >
                  <Upload size={14} />
                  {shellLoading ? 'Uploading...' : 'Create store shell'}
                </button>
              </form>
            </div>

            {/* Existing unclaimed shells */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '16px' }}>Unclaimed store shells</h3>
              {stores.filter(s => s.approval_status === 'unclaimed').length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No unclaimed shells yet. Create one above.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {stores.filter(s => s.approval_status === 'unclaimed').map(store => (
                    <div key={store.id} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      {store.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={store.logo_url} alt={store.name} style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border)' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)' }}>
                          {store.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{store.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Waiting to be claimed by a manager</div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, backgroundColor: '#F3F4F6', color: '#6B7280', border: '1px solid #D1D5DB', padding: '2px 10px', borderRadius: 'var(--radius-full)' }}>
                        UNCLAIMED
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
