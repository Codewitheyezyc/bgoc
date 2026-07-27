'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { Store, ArrowRight, CheckCircle2, PlusCircle } from 'lucide-react'

interface UnclaimedStore {
  id: string
  name: string
  logo_url: string
  slug: string
}

type FlowMode = 'pick' | 'claim-details' | 'new-store'

export default function RegisterDetails() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [flowMode, setFlowMode] = useState<FlowMode>('pick')

  // Unclaimed stores list
  const [unclaimedStores, setUnclaimedStores] = useState<UnclaimedStore[]>([])
  const [storesLoading, setStoresLoading] = useState(true)

  // Claim flow state
  const [selectedStore, setSelectedStore] = useState<UnclaimedStore | null>(null)
  const [category, setCategory] = useState('food')
  const [description, setDescription] = useState('')
  const [fulfillmentType, setFulfillmentType] = useState('instant')

  // Food specific state
  const [openTime, setOpenTime] = useState('08:00')
  const [closeTime, setCloseTime] = useState('22:00')
  const [prepTime, setPrepTime] = useState(20)
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(['Pizza', 'Fast Food'])

  // New-store flow state (Phase 4 / outside vendors)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('food')
  const [newDescription, setNewDescription] = useState('')
  const [newFulfillmentType, setNewFulfillmentType] = useState('instant')
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Verify auth & load unclaimed stores
  useEffect(() => {
    async function init() {
      try {
        const { data, error: userErr } = await supabase.auth.getUser()
        if (userErr || !data?.user) {
          router.push('/register')
          return
        }
        setUserId(data.user.id)

        // Redirect away if they already own a store
        const { data: owned } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_user_id', data.user.id)
          .limit(1)

        if (owned && owned.length > 0) {
          router.push('/dashboard')
          return
        }

        // Load unclaimed shells
        const { data: shells, error } = await supabase
          .from('stores')
          .select('id, name, logo_url, slug')
          .eq('approval_status', 'unclaimed')
          .order('name', { ascending: true })

        if (!error && shells) {
          setUnclaimedStores(shells)
        }
      } catch (err) {
        console.warn('Init auth fetch error:', err)
      } finally {
        setStoresLoading(false)
      }
    }
    init()
  }, [supabase, router])

  // ── Claim a pre-loaded store ──────────────────────────────────────────────
  const handleClaimStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !selectedStore) return

    if (!description.trim()) {
      setErrorMsg('Please write a short description for your store.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const updatePayload: any = {
        owner_user_id: userId,
        category,
        description,
        fulfillment_type: fulfillmentType,
        approval_status: 'pending',
      }

      if (category === 'food') {
        updatePayload.opening_hours = { open: openTime, close: closeTime, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }
        updatePayload.avg_prep_time = Number(prepTime) || 20
        updatePayload.cuisine_types = selectedCuisines
      }

      const { data: updatedData, error } = await supabase
        .from('stores')
        .update(updatePayload)
        .eq('id', selectedStore.id)
        .eq('approval_status', 'unclaimed') // safety guard
        .select()

      if (error) throw new Error(error.message)

      if (!updatedData || updatedData.length === 0) {
        throw new Error('This store has already been claimed by another manager.')
      }

      router.push('/dashboard')
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Register a brand-new store (Phase 4 / outside vendors) ───────────────
  const handleNewStoreLogoUpload = async (file: File): Promise<string> => {
    const timestamp = Math.round(new Date().getTime() / 1000)
    const paramsToSign = { timestamp }

    try {
      const signRes = await fetch('/api/cloudinary-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paramsToSign })
      })

      if (!signRes.ok) throw new Error('Cloudinary credentials not configured on server')

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
    } catch (err) {
      // Fallback to initials SVG
      const initials = newName ? newName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST'
      const colors = ['#E9271A', '#FBC02D', '#1A1A1A', '#3B82F6', '#10B981', '#8B5CF6']
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="${encodeURIComponent(randomColor)}"/><text x="50%" y="55%" font-family="sans-serif" font-size="32" font-weight="bold" fill="white" dominant-baseline="middle" text-anchor="middle">${initials}</text></svg>`
    }
  }

  const handleNewStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    if (!newName.trim()) {
      setErrorMsg('Store name is required.')
      return
    }
    if (!logoFile) {
      setErrorMsg('Please upload a logo for your store.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const logoUrl = await handleNewStoreLogoUpload(logoFile)
      const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000)

      const insertPayload: any = {
        owner_user_id: userId,
        name: newName,
        slug,
        category: newCategory,
        description: newDescription,
        logo_url: logoUrl,
        fulfillment_type: newFulfillmentType,
        approval_status: 'pending'
      }

      if (newCategory === 'food') {
        insertPayload.opening_hours = { open: openTime, close: closeTime, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }
        insertPayload.avg_prep_time = Number(prepTime) || 20
        insertPayload.cuisine_types = selectedCuisines
      }

      const { error } = await supabase.from('stores').insert(insertPayload)

      if (error) throw new Error(error.message)

      router.push('/dashboard')
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during store registration.')
    } finally {
      setLoading(false)
    }
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
        <div className="container" style={{ maxWidth: '640px', marginTop: '24px', paddingBottom: '48px' }}>

          {/* ── Step 1: Pick your path ───────────────────────────────── */}
          {flowMode === 'pick' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.3px', marginBottom: '8px' }}>
                Get your store on BGOC
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '32px', lineHeight: 1.5 }}>
                Beverly Group stores are already listed here. Find yours and claim it — your logo and name are ready. You just fill in the rest.
              </p>

              {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

              {/* Find your store (primary path) */}
              <div className="card" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--primary-red)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Store size={20} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Find your store</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                      Your store is already listed. Select it, fill in the description and delivery type, and submit for review.
                    </p>

                    {storesLoading ? (
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>
                        Loading store list...
                      </div>
                    ) : unclaimedStores.length === 0 ? (
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0', lineHeight: 1.5 }}>
                        All founding stores have already been claimed. If you're a new vendor, use the option below.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {unclaimedStores.map(store => (
                          <button
                            key={store.id}
                            type="button"
                            onClick={() => {
                              setSelectedStore(store)
                              setFlowMode('claim-details')
                              setErrorMsg('')
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '14px',
                              padding: '12px 16px',
                              border: '1.5px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              background: 'white',
                              cursor: 'pointer',
                              textAlign: 'left',
                              width: '100%',
                              transition: 'border-color 0.15s, box-shadow 0.15s'
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary-red)'
                              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(233,39,26,0.08)'
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                              ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                            }}
                          >
                            {store.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={store.logo_url}
                                alt={store.name}
                                style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }}
                              />
                            ) : (
                              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#9CA3AF', fontSize: '13px', flexShrink: 0 }}>
                                {store.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '14px' }}>{store.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Click to claim this store</div>
                            </div>
                            <ArrowRight size={16} color="var(--text-muted)" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Register a new store (secondary, Phase 4 path) */}
              <div
                style={{
                  border: '1.5px dashed var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '20px 24px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                  backgroundColor: '#FAFAFA'
                }}
              >
                <PlusCircle size={20} color="var(--text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Register a new store
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
                    For stores not yet listed above — mainly for outside vendors joining later. You'll upload your own logo and fill in all the details.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '13px', padding: '8px 16px' }}
                    onClick={() => { setFlowMode('new-store'); setErrorMsg('') }}
                  >
                    Register a new store →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2a: Claim flow — fill in details ────────────────── */}
          {flowMode === 'claim-details' && selectedStore && (
            <div>
              {/* Selected store header */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '28px' }}>
                {selectedStore.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedStore.logo_url}
                    alt={selectedStore.name}
                    style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1.5px solid var(--border)' }}
                  />
                ) : (
                  <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-sm)', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#9CA3AF', fontSize: '16px' }}>
                    {selectedStore.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <CheckCircle2 size={16} color="var(--success)" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>You're claiming this store</span>
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px' }}>{selectedStore.name}</h2>
                </div>
              </div>

              <div className="card">
                <h3 className="card-title" style={{ marginBottom: '4px' }}>Fill in the remaining details</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
                  Your store name and logo are already set. Add a description, pick your category and delivery type, then submit for review.
                </p>

                {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

                <form onSubmit={handleClaimStore}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="storeDescription">Short description</label>
                    <input
                      id="storeDescription"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Fresh bread, pastries, and custom cakes — baked daily."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      maxLength={120}
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      One line. Shown on the store grid. Keep it specific — describe what you actually sell.
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="storeCategory">Category</label>
                    <select
                      id="storeCategory"
                      className="form-control form-select"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                    >
                      <option value="food">Food &amp; Restaurant (Pizza, Drinks, Meals)</option>
                      <option value="fashion">Fashion &amp; Clothing</option>
                      <option value="toys">Toys &amp; Candies</option>
                      <option value="home">Home &amp; Kitchen Goods</option>
                    </select>
                  </div>

                  {category === 'food' && (
                    <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-red)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        🍔 Restaurant &amp; Food Vendor Setup
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label className="form-label" htmlFor="openTime" style={{ fontSize: '12px' }}>Opening Time</label>
                          <input
                            id="openTime"
                            type="time"
                            className="form-control"
                            value={openTime}
                            onChange={e => setOpenTime(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="form-label" htmlFor="closeTime" style={{ fontSize: '12px' }}>Closing Time</label>
                          <input
                            id="closeTime"
                            type="time"
                            className="form-control"
                            value={closeTime}
                            onChange={e => setCloseTime(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label" htmlFor="prepTime" style={{ fontSize: '12px' }}>Average Preparation Time (minutes)</label>
                        <input
                          id="prepTime"
                          type="number"
                          min={5}
                          max={180}
                          className="form-control"
                          value={prepTime}
                          onChange={e => setPrepTime(Number(e.target.value))}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Cuisine Specialties</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                          {['Pizza', 'Fast Food', 'Beverages & Drinks', 'Bakery & Desserts', 'African Dish', 'Continental'].map(cuisine => {
                            const isSelected = selectedCuisines.includes(cuisine)
                            return (
                              <button
                                key={cuisine}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedCuisines(selectedCuisines.filter(c => c !== cuisine))
                                  } else {
                                    setSelectedCuisines([...selectedCuisines, cuisine])
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

                  <div className="form-group">
                    <label className="form-label" htmlFor="storeFulfillment">Delivery model</label>
                    <select
                      id="storeFulfillment"
                      className="form-control form-select"
                      value={fulfillmentType}
                      onChange={e => setFulfillmentType(e.target.value)}
                    >
                      <option value="instant">Instant / Same-day (ready fast — food, bakery)</option>
                      <option value="shippable">Scheduled / Shippable (longer lead time — fashion, home goods)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      disabled={loading}
                    >
                      {loading ? 'Claiming store...' : 'Claim store and submit for review'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => { setFlowMode('pick'); setSelectedStore(null); setErrorMsg('') }}
                      disabled={loading}
                    >
                      Back
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Step 2b: New store (outside vendor / full self-service) ─ */}
          {flowMode === 'new-store' && (
            <div className="card">
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px', marginBottom: '6px' }}>
                  Register a new store
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Your store isn't pre-listed, so you'll set up everything from scratch — name, logo, and all the details. Once submitted, it goes into the review queue.
                </p>
              </div>

              {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

              <form onSubmit={handleNewStoreSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="newStoreName">Store Name</label>
                  <input
                    id="newStoreName"
                    type="text"
                    className="form-control"
                    placeholder="e.g. My Store Name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="newStoreDescription">Short description</label>
                  <input
                    id="newStoreDescription"
                    type="text"
                    className="form-control"
                    placeholder="One line — what you sell and what makes it worth buying"
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    maxLength={120}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="newStoreCategory">Category</label>
                  <select
                    id="newStoreCategory"
                    className="form-control form-select"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                  >
                    <option value="food">Food &amp; Restaurant (Pizza, Drinks, Meals)</option>
                    <option value="fashion">Fashion &amp; Clothing</option>
                    <option value="toys">Toys &amp; Candies</option>
                    <option value="home">Home &amp; Kitchen Goods</option>
                  </select>
                </div>

                {newCategory === 'food' && (
                  <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-red)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🍔 Restaurant &amp; Food Vendor Setup
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label className="form-label" htmlFor="newOpenTime" style={{ fontSize: '12px' }}>Opening Time</label>
                        <input
                          id="newOpenTime"
                          type="time"
                          className="form-control"
                          value={openTime}
                          onChange={e => setOpenTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label" htmlFor="newCloseTime" style={{ fontSize: '12px' }}>Closing Time</label>
                        <input
                          id="newCloseTime"
                          type="time"
                          className="form-control"
                          value={closeTime}
                          onChange={e => setCloseTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label" htmlFor="newPrepTime" style={{ fontSize: '12px' }}>Average Preparation Time (minutes)</label>
                      <input
                        id="newPrepTime"
                        type="number"
                        min={5}
                        max={180}
                        className="form-control"
                        value={prepTime}
                        onChange={e => setPrepTime(Number(e.target.value))}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Cuisine Specialties</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                        {['Pizza', 'Fast Food', 'Beverages & Drinks', 'Bakery & Desserts', 'African Dish', 'Continental'].map(cuisine => {
                          const isSelected = selectedCuisines.includes(cuisine)
                          return (
                            <button
                              key={cuisine}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedCuisines(selectedCuisines.filter(c => c !== cuisine))
                                } else {
                                  setSelectedCuisines([...selectedCuisines, cuisine])
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

                <div className="form-group">
                  <label className="form-label" htmlFor="newStoreFulfillment">Delivery model</label>
                  <select
                    id="newStoreFulfillment"
                    className="form-control form-select"
                    value={newFulfillmentType}
                    onChange={e => setNewFulfillmentType(e.target.value)}
                  >
                    <option value="instant">Instant / Same-day</option>
                    <option value="shippable">Scheduled / Shippable</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="newStoreLogo">Store Logo</label>
                  <input
                    id="newStoreLogo"
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        setLogoFile(e.target.files[0])
                      }
                    }}
                    required
                  />
                  <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '6px', fontSize: '11px' }}>
                    Upload a clear PNG or SVG with a transparent or solid background.
                  </small>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit store for review'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setFlowMode('pick'); setErrorMsg('') }}
                    disabled={loading}
                  >
                    Back
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
