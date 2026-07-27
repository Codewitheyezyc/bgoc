'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'
import { 
  Plus, Edit, LogOut, Check, X, Menu, Bell, User, ChevronLeft, ChevronRight,
  BarChart3, ShoppingBag, ClipboardList, Settings, CreditCard, LifeBuoy, HelpCircle,
  Clock, CheckCircle, Truck, Eye, PanelLeft, FileText
} from 'lucide-react'

interface CustomizationOption {
  name: string
  price: number
}

interface CustomizationGroup {
  title: string
  required: boolean
  type: 'single' | 'multiple'
  options: CustomizationOption[]
}

interface FoodDetails {
  spicy_level?: string
  dietary?: string[]
  is_available?: boolean
}

interface Store {
  id: string
  name: string
  slug: string
  category: string
  description: string
  logo_url: string
  fulfillment_type: string
  approval_status: string
  rejection_reason?: string
  opening_hours?: { open: string; close: string; days: string[] }
  avg_prep_time?: number
  cuisine_types?: string[]
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  stock_quantity: number | null
  size_options: string[] | null
  menu_category?: string | null
  food_details?: FoodDetails
  customizations?: CustomizationGroup[]
}

interface Order {
  id: string
  created_at: string
  total_amount: number
  delivery_address: string
  status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
  paystack_reference: string
}

type Tab = 'overview' | 'products' | 'orders' | 'settings' | 'payouts' | 'qr'

export default function ManagerDashboard() {
  const router = useRouter()
  const supabase = createClient()

  // Layout & UI State
  const [currentTab, setCurrentTab] = useState<Tab>('products')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  // Order & Catalog Filter States
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [productSearch, setProductSearch] = useState('')

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
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null)

  // Product Add Form State
  const [showAddForm, setShowAddForm] = useState(false)
  const [prodName, setProdName] = useState('')
  const [prodDesc, setProdDesc] = useState('')
  const [prodPrice, setProdPrice] = useState('')
  const [prodImage, setProdImage] = useState<File | null>(null)
  const [prodStock, setProdStock] = useState('')
  const [prodSizes, setProdSizes] = useState('') 

  // Food-specific product fields state
  const [prodMenuCategory, setProdMenuCategory] = useState('Mains')
  const [prodSpicyLevel, setProdSpicyLevel] = useState('None')
  const [prodDietary, setProdDietary] = useState<string[]>([])
  const [prodIsAvailable, setProdIsAvailable] = useState(true)
  const [customizations, setCustomizations] = useState<CustomizationGroup[]>([])

  const [addingProduct, setAddingProduct] = useState(false)
  const [prodError, setProdError] = useState('')

  // Edit Store State
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editFulfillment, setEditFulfillment] = useState('')
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null)

  // Edit Store Food Settings State
  const [editOpenTime, setEditOpenTime] = useState('08:00')
  const [editCloseTime, setEditCloseTime] = useState('22:00')
  const [editPrepTime, setEditPrepTime] = useState(20)
  const [editCuisines, setEditCuisines] = useState<string[]>([])

  const [updatingStore, setUpdatingStore] = useState(false)
  const [editError, setEditError] = useState('')

  // Fetch Store, Products and Orders
  const fetchData = useCallback(async (userId: string) => {
    try {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_user_id', userId)
        .maybeSingle()

      if (storeError) throw storeError

      if (!storeData) {
        router.push('/register/details')
        return
      }

      setStore(storeData)
      
      // Initialize edit fields
      setEditName(storeData.name)
      setEditCategory(storeData.category)
      setEditDesc(storeData.description || '')
      setEditFulfillment(storeData.fulfillment_type)

      if (storeData.opening_hours) {
        setEditOpenTime(storeData.opening_hours.open || '08:00')
        setEditCloseTime(storeData.opening_hours.close || '22:00')
      }
      setEditPrepTime(storeData.avg_prep_time || 20)
      setEditCuisines(storeData.cuisine_types || [])

      // Fetch products
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false })

      if (prodError) throw prodError
      setProducts(prodData || [])

      // Fetch orders
      const { data: ordData, error: ordError } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false })

      if (!ordError && ordData) {
        setOrders(ordData)
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  // Verify auth session on load
  useEffect(() => {
    async function checkSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/register')
      } else {
        setUser(user)
        fetchData(user.id)
      }
    }
    checkSession()
  }, [supabase, router, fetchData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/register')
  }

  // Cloudinary Signed Upload with Mock Fallback for Product Images
  const uploadProductImage = async (file: File): Promise<string> => {
    const timestamp = Math.round(new Date().getTime() / 1000)
    const paramsToSign = { timestamp }

    try {
      const signRes = await fetch('/api/cloudinary-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paramsToSign })
      })

      if (!signRes.ok) throw new Error('Cloudinary not configured')

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

      if (!uploadRes.ok) throw new Error('Upload failed')

      const uploadData = await uploadRes.json()
      return uploadData.secure_url
    } catch (err) {
      console.warn('Falling back to product placeholder image.', err)
      const initials = prodName ? prodName.substring(0, 2).toUpperCase() : 'PR'
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 150 100"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="55%" font-family="sans-serif" font-size="16" font-weight="bold" fill="%239ca3af" dominant-baseline="middle" text-anchor="middle">${initials}</text></svg>`
    }
  }

  // Add Product Submit
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) return

    setAddingProduct(true)
    setProdError('')

    if (!prodName.trim() || !prodPrice.trim()) {
      setProdError('Name and Price are required.')
      setAddingProduct(false)
      return
    }

    if (!prodImage) {
      setProdError('Please upload a product image.')
      setAddingProduct(false)
      return
    }

    try {
      const imgUrl = await uploadProductImage(prodImage)

      const sizeOptions = prodSizes.trim() 
        ? prodSizes.split(',').map(s => s.trim()).filter(Boolean) 
        : null

      const productPayload: any = {
        store_id: store.id,
        name: prodName,
        description: prodDesc,
        price: parseFloat(prodPrice),
        image_url: imgUrl,
        stock_quantity: prodStock.trim() ? parseInt(prodStock) : null,
        size_options: sizeOptions
      }

      if (store.category === 'food') {
        productPayload.menu_category = prodMenuCategory || 'Mains'
        productPayload.food_details = {
          spicy_level: prodSpicyLevel,
          dietary: prodDietary,
          is_available: prodIsAvailable
        }
        productPayload.customizations = customizations
      }

      const { error } = await supabase
        .from('products')
        .insert(productPayload)

      if (error) throw error

      setProdName('')
      setProdDesc('')
      setProdPrice('')
      setProdStock('')
      setProdSizes('')
      setProdSpicyLevel('None')
      setProdDietary([])
      setProdIsAvailable(true)
      setCustomizations([])
      setProdImage(null)
      setShowAddForm(false)

      fetchData(user.id)
    } catch (err: any) {
      setProdError(err.message || 'Error adding product.')
    } finally {
      setAddingProduct(false)
    }
  }

  // Update Store Info
  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store || !user) return

    setUpdatingStore(true)
    setEditError('')

    try {
      let logoUrl = store.logo_url
      if (editLogoFile) {
        const timestamp = Math.round(new Date().getTime() / 1000)
        const paramsToSign = { timestamp }
        const signRes = await fetch('/api/cloudinary-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paramsToSign })
        })
        if (signRes.ok) {
          const { signature, apiKey, cloudName } = await signRes.json()
          const formData = new FormData()
          formData.append('file', editLogoFile)
          formData.append('api_key', apiKey)
          formData.append('timestamp', timestamp.toString())
          formData.append('signature', signature)
          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
          })
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            logoUrl = uploadData.secure_url
          }
        }
      }

      const newStatus = store.approval_status === 'suspended' ? 'pending' : store.approval_status

      const updatePayload: any = {
        name: editName,
        category: editCategory,
        description: editDesc,
        fulfillment_type: editFulfillment,
        logo_url: logoUrl,
        approval_status: newStatus
      }

      if (editCategory === 'food') {
        updatePayload.opening_hours = { open: editOpenTime, close: editCloseTime, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }
        updatePayload.avg_prep_time = Number(editPrepTime) || 20
        updatePayload.cuisine_types = editCuisines
      }

      const { error } = await supabase
        .from('stores')
        .update(updatePayload)
        .eq('id', store.id)

      if (error) throw error

      setEditLogoFile(null)
      fetchData(user.id)
      alert('Store details updated successfully!')
    } catch (err: any) {
      setEditError(err.message || 'Error updating store details.')
    } finally {
      setUpdatingStore(false)
    }
  }

  // Transition Order Status
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    setOrderActionLoading(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId)

      if (error) throw error

      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: nextStatus as any } : o)
      )
    } catch (err) {
      console.error('Error updating order status:', err)
      alert('Failed to update status.')
    } finally {
      setOrderActionLoading(null)
    }
  }

  const getPageTitle = () => {
    switch (currentTab) {
      case 'overview': return 'Overview Dashboard'
      case 'products': return 'Products Catalog'
      case 'orders': return 'Orders Management'
      case 'settings': return 'Store Settings'
      case 'payouts': return 'Payouts & Revenue'
    }
  }

  const getInitials = (nameStr: string) => {
    return nameStr.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  if (loading) {
    return <div className="text-center mt-24">Loading dashboard details...</div>
  }

  if (!store) {
    return null
  }

  const userInitials = user?.email ? getInitials(user.email.split('@')[0]) : 'M'

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
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)' }}>of Companies</span>
            </span>
          )}
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-title">Manage</span>
          
          <button 
            className={`sidebar-item ${currentTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setCurrentTab('overview'); if (window.innerWidth <= 1024) setIsSidebarCollapsed(true); }}
          >
            <BarChart3 size={18} />
            <span>Overview</span>
          </button>

          <button 
            className={`sidebar-item ${currentTab === 'products' ? 'active' : ''}`}
            onClick={() => { setCurrentTab('products'); if (window.innerWidth <= 1024) setIsSidebarCollapsed(true); }}
          >
            <ShoppingBag size={18} />
            <span>Products</span>
          </button>

          <button 
            className={`sidebar-item ${currentTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setCurrentTab('orders'); if (window.innerWidth <= 1024) setIsSidebarCollapsed(true); }}
          >
            <ClipboardList size={18} />
            <span>Orders</span>
          </button>

          <span className="sidebar-section-title">Configure</span>

          <button 
            className={`sidebar-item ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setCurrentTab('settings'); if (window.innerWidth <= 1024) setIsSidebarCollapsed(true); }}
          >
            <Settings size={18} />
            <span>Store Settings</span>
          </button>

          {store.category === 'food' && (
            <button 
              className={`sidebar-item ${currentTab === 'qr' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('qr'); if (window.innerWidth <= 1024) setIsSidebarCollapsed(true); }}
            >
              <FileText size={18} />
              <span>Menu &amp; QR Code</span>
            </button>
          )}

          <button 
            className={`sidebar-item ${currentTab === 'payouts' ? 'active' : ''} sidebar-item disabled`}
            onClick={() => {}}
            title="Coming soon in Phase 3"
          >
            <CreditCard size={18} />
            <span>Payouts</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button 
            className="sidebar-item disabled"
            style={{ fontSize: '13px' }}
          >
            <LifeBuoy size={16} />
            <span>Support</span>
          </button>
          
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

        <div className="header-right">
          {/* Notification Bell */}
          <button className="header-notification">
            <Bell size={18} />
            {store.approval_status !== 'approved' && (
              <span className="notification-badge font-mono">1</span>
            )}
          </button>

          {/* User Account Dropdown */}
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
                <button className="dropdown-item" onClick={() => { setCurrentTab('settings'); setShowUserDropdown(false); }}>
                  Store Settings
                </button>
                <button className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--danger)', borderTop: '1px solid var(--border)' }}>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="dashboard-content">
        
        {/* Banner Alert for Pending Approval */}
        {store.approval_status === 'pending' && (
          <div className="alert alert-warning" style={{ backgroundColor: '#FEF3C7', border: '1.5px solid #F59E0B', color: '#92400E', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 800 }}>
              <span>🕒 Store Under Review</span>
              <span className="badge badge-pending">PENDING APPROVAL</span>
            </div>
            <p style={{ marginTop: '6px', fontSize: '13px', lineHeight: 1.5, color: '#78350F' }}>
              Your claim/registration for <strong>{store.name}</strong> has been received! Beverly Group admins are currently reviewing your store details. Your store and dashboard actions will become fully active as soon as an admin approves your registration.
            </p>
          </div>
        )}

        {/* Banner Alert for Suspended/Rejected */}
        {store.approval_status === 'suspended' && (
          <div className="alert alert-danger">
            <strong>Action Required:</strong> Beverly Group admins returned your registration for corrections.
            {store.rejection_reason && (
              <div style={{ marginTop: '8px', paddingLeft: '12px', borderLeft: '3px solid #B91C1C', fontStyle: 'italic' }}>
                Note from admin: "{store.rejection_reason}"
              </div>
            )}
            <div style={{ marginTop: '8px' }}>Please update your settings in the **Store Settings** tab and resubmit.</div>
          </div>
        )}

        {/* =========================================================================
           TAB Content: Overview
           ========================================================================= */}
        {currentTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="grid-2">
              <div className="card">
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px' }}>Active Orders</h4>
                <div className="font-mono" style={{ fontSize: '32px', fontWeight: 700 }}>
                  {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}
                </div>
              </div>
              <div className="card">
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px' }}>Active Catalog Size</h4>
                <div className="font-mono" style={{ fontSize: '32px', fontWeight: 700 }}>{products.length}</div>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700 }}>Store Information</h3>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '16px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={store.logo_url} alt={store.name} style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border)' }} />
                <div>
                  <h4 style={{ fontSize: '20px' }}>{store.name}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                    Status: <span className={`badge badge-${store.approval_status}`}>{store.approval_status.toUpperCase()}</span>
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                    Fulfillment: {store.fulfillment_type === 'instant' ? 'Instant/Same-day' : 'Shippable'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
           TAB Content: Products
           ========================================================================= */}
        {currentTab === 'products' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Products Catalog</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
                  <span className="font-mono">{products.length}</span> items listed
                </p>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (store.approval_status !== 'approved') {
                    alert('Your store registration is currently pending admin approval. You will be able to add and manage products once a Group Admin approves your store.')
                    return
                  }
                  setShowAddForm(!showAddForm)
                }}
                style={{
                  opacity: store.approval_status !== 'approved' ? 0.7 : 1,
                  cursor: store.approval_status !== 'approved' ? 'not-allowed' : 'pointer'
                }}
                title={store.approval_status !== 'approved' ? 'Locked until store is approved by Group Admin' : 'Add Product'}
              >
                <Plus size={16} /> Add Product {store.approval_status !== 'approved' && '(Locked)'}
              </button>
            </div>

            {/* Add Product inline form */}
            {showAddForm && (
              <div className="card mb-24" style={{ backgroundColor: '#FBFBFB', border: '1px dashed var(--border)' }}>
                <h4 style={{ marginBottom: '16px', fontWeight: 700, fontSize: '16px' }}>New Product Details</h4>
                {prodError && <div className="alert alert-danger">{prodError}</div>}
                
                <form onSubmit={handleAddProduct}>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Product Name</label>
                      <input type="text" className="form-control" placeholder="e.g. Sourdough Bread" value={prodName} onChange={e => setProdName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Price (₦)</label>
                      <input type="number" step="0.01" className="form-control" placeholder="e.g. 2500" value={prodPrice} onChange={e => setProdPrice(e.target.value)} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Provide a brief description of the product." value={prodDesc} onChange={e => setProdDesc(e.target.value)} />
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Stock Quantity (Optional, leave blank if made-to-order)</label>
                      <input type="number" className="form-control" placeholder="e.g. 50" value={prodStock} onChange={e => setProdStock(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sizing / Variant Options (Optional, comma-separated)</label>
                      <input type="text" className="form-control" placeholder="e.g. S, M, L or 12-inch, 14-inch" value={prodSizes} onChange={e => setProdSizes(e.target.value)} />
                    </div>
                  </div>

                  {store.category === 'food' && (
                    <div style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                      <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-red)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        🍕 Food &amp; Drink Specifications
                      </h5>

                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Menu Category</label>
                        <select className="form-control form-select" value={prodMenuCategory} onChange={e => setProdMenuCategory(e.target.value)}>
                          <option value="Starters">Starters &amp; Appetizers</option>
                          <option value="Mains">Main Dishes &amp; Meals</option>
                          <option value="Pizzas">Wood-Fired Pizzas</option>
                          <option value="Pastries">Fresh Pastries &amp; Bakeries</option>
                          <option value="Drinks">Drinks &amp; Beverages</option>
                          <option value="Desserts">Desserts &amp; Sweets</option>
                          <option value="Sides">Sides &amp; Extras</option>
                          <option value="Specials">Chef Specials</option>
                        </select>
                      </div>

                      <div className="grid-2" style={{ marginBottom: '12px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '12px' }}>Spicy Level</label>
                          <select className="form-control form-select" value={prodSpicyLevel} onChange={e => setProdSpicyLevel(e.target.value)}>
                            <option value="None">None (Mild / Non-spicy)</option>
                            <option value="Mild">Mild 🌶️</option>
                            <option value="Medium">Medium 🌶️🌶️</option>
                            <option value="Hot">Hot 🌶️🌶️🌶️</option>
                            <option value="Extra Hot">Extra Hot 🌶️🌶️🌶️🌶️</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '12px' }}>Daily Availability</label>
                          <select className="form-control form-select" value={prodIsAvailable ? 'true' : 'false'} onChange={e => setProdIsAvailable(e.target.value === 'true')}>
                            <option value="true">Available Today (In Stock)</option>
                            <option value="false">Sold Out for Today</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Dietary Flags</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                          {['Vegetarian', 'Vegan', 'Quality Assured', 'Gluten-Free', 'Contains Dairy', 'Contains Nuts'].map(tag => {
                            const isSelected = prodDietary.includes(tag)
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  if (isSelected) setProdDietary(prodDietary.filter(t => t !== tag))
                                  else setProdDietary([...prodDietary, tag])
                                }}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  border: isSelected ? '1px solid var(--primary-red)' : '1px solid #D1D5DB',
                                  background: isSelected ? 'rgba(233, 39, 26, 0.1)' : 'white',
                                  color: isSelected ? 'var(--primary-red)' : 'var(--text-secondary)',
                                  cursor: 'pointer'
                                }}
                              >
                                {isSelected ? '✓ ' : '+ '}{tag}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Quick Presets for Customization Groups */}
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label className="form-label" style={{ fontSize: '12px', margin: 0 }}>Custom Options &amp; Toppings</label>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                              onClick={() => {
                                setCustomizations([
                                  ...customizations,
                                  {
                                    title: 'Pizza Crust & Size Options',
                                    required: true,
                                    type: 'single',
                                    options: [
                                      { name: 'Medium 10-inch Thin Crust', price: 0 },
                                      { name: 'Large 12-inch Deep Dish', price: 1500 },
                                      { name: 'Extra Large Stuffed Crust', price: 2500 }
                                    ]
                                  }
                                ])
                              }}
                            >
                              + Add Pizza Preset
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                              onClick={() => {
                                setCustomizations([
                                  ...customizations,
                                  {
                                    title: 'Extra Toppings',
                                    required: false,
                                    type: 'multiple',
                                    options: [
                                      { name: 'Extra Cheese', price: 500 },
                                      { name: 'Pepperoni Slices', price: 1000 },
                                      { name: 'Extra BBQ Sauce', price: 300 }
                                    ]
                                  }
                                ])
                              }}
                            >
                              + Add Toppings Preset
                            </button>
                          </div>
                        </div>

                        {customizations.length === 0 ? (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No customization groups added. Click preset buttons above to quickly add Crust or Extra Toppings options.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {customizations.map((group, gIdx) => (
                              <div key={gIdx} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <span style={{ fontWeight: 700, fontSize: '12px' }}>{group.title} ({group.type === 'single' ? 'Single Choice' : 'Multiple Checkbox'})</span>
                                  <button
                                    type="button"
                                    onClick={() => setCustomizations(customizations.filter((_, idx) => idx !== gIdx))}
                                    style={{ border: 'none', background: 'transparent', color: 'var(--primary-red)', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                                  >
                                    Remove Group
                                  </button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {group.options.map((opt, oIdx) => (
                                    <span key={oIdx} style={{ fontSize: '11px', background: '#F3F4F6', padding: '2px 8px', borderRadius: '4px' }}>
                                      {opt.name} {opt.price > 0 ? `(+₦${opt.price})` : ''}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Product Image</label>
                    <input type="file" accept="image/*" className="form-control" onChange={e => {
                      if (e.target.files && e.target.files.length > 0) setProdImage(e.target.files[0])
                    }} required />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button type="submit" className="btn btn-primary" disabled={addingProduct}>
                      {addingProduct ? 'Adding product...' : 'Add to Catalog'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* Product list */}
            {products.length === 0 ? (
              <div className="text-center" style={{ padding: '40px 0', color: 'var(--text-secondary)' }}>
                No products uploaded yet. Click "Add Product" above to populate your catalog.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
                {products.map(prod => (
                  <div key={prod.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={prod.image_url} 
                      alt={prod.name} 
                      style={{ width: '100%', height: '160px', objectFit: 'cover', backgroundColor: '#f9f9f9' }}
                    />
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h5 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{prod.name}</h5>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                          {prod.description || 'No description provided.'}
                        </p>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                          <span className="font-mono" style={{ fontWeight: 700, color: 'var(--primary-red)', fontSize: '14px' }}>
                            ₦{prod.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {prod.stock_quantity !== null ? `Stock: ${prod.stock_quantity}` : 'Made-to-order'}
                          </span>
                        </div>
                        {prod.size_options && prod.size_options.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                            {prod.size_options.map(sz => (
                              <span key={sz} className="font-mono" style={{ fontSize: '9px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: '2px' }}>
                                {sz}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
           TAB Content: Orders
           ========================================================================= */}
        {currentTab === 'orders' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Customer Orders</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Track and manage live customer orders for your store.
                </p>
              </div>

              {/* Order Search Input */}
              <div style={{ position: 'relative', width: '260px' }}>
                <input
                  type="text"
                  placeholder="Search Order ID, Ref, Address..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12.5px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              {['all', 'pending', 'preparing', 'ready', 'delivered', 'cancelled'].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOrderStatusFilter(st)}
                  style={{
                    padding: '4px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    border: orderStatusFilter === st ? '1.5px solid var(--primary-red)' : '1px solid var(--border)',
                    backgroundColor: orderStatusFilter === st ? 'var(--primary-red)' : '#ffffff',
                    color: orderStatusFilter === st ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {st === 'all' ? 'All Orders' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {orders.length === 0 ? (
              <div className="text-center" style={{ padding: '40px 0', color: 'var(--text-secondary)' }}>
                No orders placed yet.
              </div>
            ) : (() => {
              const filteredOrders = orders.filter(ord => {
                if (orderStatusFilter !== 'all' && ord.status !== orderStatusFilter) return false
                if (orderSearch.trim()) {
                  const q = orderSearch.toLowerCase().trim()
                  const matchesId = ord.id.toLowerCase().includes(q)
                  const matchesRef = ord.paystack_reference?.toLowerCase().includes(q) || false
                  const matchesAddr = ord.delivery_address?.toLowerCase().includes(q) || false
                  if (!matchesId && !matchesRef && !matchesAddr) return false
                }
                return true
              })

              if (filteredOrders.length === 0) {
                return (
                  <div className="text-center" style={{ padding: '40px 0', color: 'var(--text-secondary)' }}>
                    No orders match your search and filter criteria.
                  </div>
                )
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredOrders.map(ord => (
                  <div key={ord.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <span className="font-mono" style={{ fontWeight: 700, fontSize: '14px' }}>Order: #{ord.id.substring(0, 8).toUpperCase()}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '12px' }}>
                          Ref: <span className="font-mono">{ord.paystack_reference}</span>
                        </span>
                      </div>
                      <span className={`badge badge-${ord.status}`}>{ord.status.toUpperCase()}</span>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <div><strong>Delivery to:</strong> {ord.delivery_address}</div>
                      <div style={{ marginTop: '4px' }}>
                        <strong>Date:</strong> <span className="font-mono">{new Date(ord.created_at).toLocaleString()}</span> | 
                        <strong> Paid Total:</strong> <span className="font-mono" style={{ color: 'var(--primary-red)', fontWeight: 600 }}> ₦{ord.total_amount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Order transition buttons */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {ord.status === 'pending' && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--pending)' }}
                          onClick={() => handleUpdateOrderStatus(ord.id, 'preparing')}
                          disabled={orderActionLoading === ord.id}
                        >
                          <Clock size={14} /> Start Preparing
                        </button>
                      )}
                      
                      {ord.status === 'preparing' && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--primary-red)' }}
                          onClick={() => handleUpdateOrderStatus(ord.id, store.fulfillment_type === 'instant' ? 'out_for_delivery' : 'ready')}
                          disabled={orderActionLoading === ord.id}
                        >
                          <Truck size={14} /> {store.fulfillment_type === 'instant' ? 'Dispatch Courier' : 'Mark Assembled'}
                        </button>
                      )}

                      {(ord.status === 'out_for_delivery' || ord.status === 'ready') && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--success)' }}
                          onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                          disabled={orderActionLoading === ord.id}
                        >
                          <CheckCircle size={14} /> Confirm Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
          </div>
        )}

        {/* =========================================================================
           TAB Content: Store Settings
           ========================================================================= */}
        {currentTab === 'settings' && (
          <div className="card">
            <h3 className="card-title" style={{ fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '24px' }}>
              Store Profile Settings
            </h3>
            {editError && <div className="alert alert-danger">{editError}</div>}
            
            <form onSubmit={handleUpdateStore}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Store Name</label>
                  <input type="text" className="form-control" value={editName} onChange={e => setEditName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control form-select" value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                    <option value="food">Food & Restaurant</option>
                    <option value="fashion">Fashion & Clothing</option>
                    <option value="toys">Toys & Candies</option>
                    <option value="home">Home & Kitchen Goods</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Short Description</label>
                <input type="text" className="form-control" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Fulfillment Model</label>
                  <select className="form-control form-select" value={editFulfillment} onChange={e => setEditFulfillment(e.target.value)}>
                    <option value="instant">Instant / Same-day</option>
                    <option value="shippable">Shippable / Schedulable</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Change Logo Image (Optional)</label>
                  <input type="file" accept="image/*" className="form-control" onChange={e => {
                    if (e.target.files && e.target.files.length > 0) setEditLogoFile(e.target.files[0])
                  }} />
                </div>
              </div>

              {editCategory === 'food' && (
                <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', padding: '16px', borderRadius: 'var(--radius-sm)', marginTop: '16px', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-red)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🍔 Restaurant Operational Hours &amp; Cuisine Setup
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '12px' }}>Opening Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={editOpenTime}
                        onChange={e => setEditOpenTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '12px' }}>Closing Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={editCloseTime}
                        onChange={e => setEditCloseTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '12px' }}>Est. Prep Time (mins)</label>
                      <input
                        type="number"
                        min={5}
                        max={180}
                        className="form-control"
                        value={editPrepTime}
                        onChange={e => setEditPrepTime(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Cuisine Specialties</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                      {['Pizza', 'Fast Food', 'Beverages & Drinks', 'Bakery & Desserts', 'African Dish', 'Continental'].map(cuisine => {
                        const isSelected = editCuisines.includes(cuisine)
                        return (
                          <button
                            key={cuisine}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setEditCuisines(editCuisines.filter(c => c !== cuisine))
                              } else {
                                setEditCuisines([...editCuisines, cuisine])
                              }
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: 600,
                              border: isSelected ? '1px solid var(--primary-red)' : '1px solid var(--border)',
                              background: isSelected ? 'rgba(233, 39, 26, 0.08)' : 'white',
                              color: isSelected ? 'var(--primary-red)' : 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}
                          >
                            {isSelected ? '✓ ' : '+ '}{cuisine}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" disabled={updatingStore}>
                  {updatingStore ? 'Saving store details...' : store.approval_status === 'suspended' ? 'Save & Resubmit Store' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================================
           TAB Content: Menu & QR Code (Food Stores Only)
           ========================================================================= */}
        {currentTab === 'qr' && (
          <div className="card" style={{ maxWidth: '840px' }}>
            <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <FileText size={22} color="var(--primary-red)" />
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                  Menu &amp; QR Code Suite
                </h3>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
                Physical touchpoint QR generator &amp; auto-generated menu for <strong>{store.name}</strong>.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px', alignItems: 'center' }}>
              
              {/* QR Preview Card */}
              <div style={{ 
                backgroundColor: '#F8FAFC', 
                border: '1.5px solid var(--border)', 
                borderRadius: 'var(--radius-md)', 
                padding: '28px', 
                textAlign: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.04)' 
              }}>
                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'inline-block', marginBottom: '16px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/store/${store.slug}` : `https://bgoc.com/store/${store.slug}`)}`}
                    alt={`${store.name} QR Code`}
                    style={{ width: '180px', height: '180px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                  />
                </div>

                <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ink)', marginBottom: '4px' }}>
                  {store.name} Table QR Code
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '20px', fontFamily: 'monospace' }}>
                  /store/{store.slug}
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/store/${store.slug}` : `https://bgoc.com/store/${store.slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`${store.slug}-table-qr.png`}
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', fontSize: '12.5px', fontWeight: 700, borderRadius: 'var(--radius-full)', backgroundColor: '#E9271A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    Download QR Code (PNG)
                  </a>
                  
                  <a
                    href={`/store/${store.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '8px 18px', fontSize: '12.5px', fontWeight: 700, borderRadius: 'var(--radius-full)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    View Live Menu →
                  </a>
                </div>
              </div>

              {/* Instructions & Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ backgroundColor: '#FEF3C7', border: '1.5px solid var(--accent-gold)', borderRadius: 'var(--radius-md)', padding: '18px', color: '#B45309' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📌 Table &amp; Packaging Placement Instructions
                  </h4>
                  <p style={{ fontSize: '12.5px', lineHeight: 1.5, margin: 0 }}>
                    Print this QR code and place it on your restaurant tables, counter display, or order packaging. Scanning it takes customers straight into your live menu to browse &amp; place instant orders.
                  </p>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📄 Live Synchronized PDF Menu
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                    Your downloadable PDF menu is automatically rendered live from your online product catalog. Whenever you add or edit items in your Products tab, the printable PDF updates instantly.
                  </p>
                  <a
                    href={`/store/${store.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 14px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    Preview &amp; Print PDF Menu
                  </a>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  )
}
