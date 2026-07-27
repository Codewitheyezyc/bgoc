'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import CustomerHeader from '@/components/CustomerHeader'
import CustomerFooter from '@/components/CustomerFooter'
import { addToCart } from '@/lib/cart'
import { 
  Clock, Box, ArrowLeft, Sparkles, Store as StoreIcon, ChevronRight, 
  Search, X, Flame, ShieldCheck, ShoppingBag, Utensils, CheckCircle, Zap, FileText, Printer
} from 'lucide-react'

interface Store {
  id: string
  name: string
  slug: string
  category: string
  description: string
  logo_url: string
  fulfillment_type: string
  approval_status: string
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
  food_details?: {
    spicy_level?: string
    dietary_tags?: string[]
    ingredients?: string
  }
}

interface PageProps {
  params: Promise<{ slug: string }>
}

function ProductImage({ 
  src, 
  alt, 
  title, 
  style, 
  className 
}: { 
  src?: string
  alt: string
  title: string
  style?: React.CSSProperties
  className?: string 
}) {
  const [error, setError] = useState(false)

  const getInitials = (nameStr: string) => {
    return nameStr.split(' ').map(n => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || 'P'
  }

  if (!src || error) {
    return (
      <div 
        style={{
          ...style,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
          color: 'var(--text-secondary)',
          position: 'relative',
          overflow: 'hidden'
        }}
        className={className}
      >
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: 'rgba(233, 39, 26, 0.08)',
          color: 'var(--primary-red)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '18px',
          border: '1.5px solid rgba(233, 39, 26, 0.2)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          marginBottom: '6px'
        }}>
          {getInitials(title)}
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', padding: '0 12px' }}>
          {title}
        </span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={src} 
      alt={alt} 
      style={style} 
      className={className}
      onError={() => setError(true)} 
    />
  )
}

export default function StoreCatalogPage({ params }: PageProps) {
  const router = useRouter()
  const { slug } = use(params)
  const supabase = createClient()

  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [dietaryFilter, setDietaryFilter] = useState('all')

  const loadStoreAndCatalog = useCallback(async () => {
    try {
      // Fetch store details
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (storeError) throw storeError
      
      if (!storeData || storeData.approval_status !== 'approved') {
        router.push('/')
        return
      }

      setStore(storeData)

      // Fetch products catalog
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false })

      if (prodError) throw prodError
      setProducts(prodData || [])
    } catch (err) {
      console.error('Error loading store page:', err)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [slug, supabase, router])

  useEffect(() => {
    loadStoreAndCatalog()
  }, [loadStoreAndCatalog])

  const handleProductClick = (prodId: string) => {
    router.push(`/store/${slug}/product/${prodId}`)
  }

  const handleAddToCartClick = (e: React.MouseEvent, prod: Product) => {
    e.stopPropagation()
    if (!store) return
    const result = addToCart({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      quantity: 1,
      image_url: prod.image_url,
      store_id: store.id,
      store_name: store.name,
      fulfillment_type: store.fulfillment_type
    })
    if (result.success) {
      alert(`Added "${prod.name}" to cart!`)
    } else {
      alert(result.error || 'Could not add item to cart.')
    }
  }

  // Calculate filtered products inside store catalog
  const filteredProducts = products.filter(prod => {
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase().trim()
      const matchesName = prod.name.toLowerCase().includes(q)
      const matchesDesc = prod.description?.toLowerCase().includes(q) || false
      if (!matchesName && !matchesDesc) return false
    }
    if (dietaryFilter !== 'all') {
      if (dietaryFilter === 'spicy' && !prod.food_details?.spicy_level) return false
      if (dietaryFilter === 'vegetarian' && !prod.food_details?.dietary_tags?.includes('Vegetarian')) return false
      if (dietaryFilter === 'quality' && !prod.food_details?.dietary_tags?.includes('Quality Assured')) return false
    }
    return true
  })

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
        <CustomerHeader />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          <StoreIcon className="animate-pulse" size={24} style={{ color: 'var(--primary-red)' }} /> Loading store menu and catalog...
        </div>
      </div>
    )
  }

  if (!store) {
    return null
  }

  return (
    <>
      <CustomerHeader />

      <main className="main-content" style={{ backgroundColor: '#F8FAFC', minHeight: 'calc(100vh - 64px)', paddingBottom: '80px' }}>
        
        {/* =========================================================================
           1. EXECUTIVE STORE HERO BANNER
           ========================================================================= */}
        <div style={{ 
          backgroundColor: '#FFFFFF', 
          borderBottom: '1.5px solid var(--border)', 
          padding: '32px 0 36px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
          background: 'radial-gradient(circle at top right, rgba(251, 192, 45, 0.06) 0%, rgba(233, 39, 26, 0.02) 50%, #ffffff 100%)'
        }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* Breadcrumb Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
              <ChevronRight size={14} />
              <Link href="/store" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Stores Directory</Link>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--primary-red)', fontWeight: 700 }}>{store.name}</span>
            </div>

            {/* Store Profile Card Header */}
            <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              
              {/* Store Avatar Logo */}
              <div style={{ position: 'relative' }}>
                <ProductImage 
                  src={store.logo_url} 
                  alt={store.name} 
                  title={store.name}
                  style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: 'var(--radius-md)', 
                    objectFit: 'cover', 
                    border: '2.5px solid var(--accent-gold)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                    backgroundColor: '#FFFFFF'
                  }}
                />
                <span style={{ 
                  position: 'absolute', 
                  bottom: '-6px', 
                  right: '-6px', 
                  backgroundColor: '#10B981', 
                  color: '#ffffff', 
                  width: '22px', 
                  height: '22px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px solid #ffffff',
                  fontSize: '12px'
                }} title="Verified Merchant">
                  ✓
                </span>
              </div>

              {/* Store Details Info */}
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.6px', lineHeight: 1.15 }}>
                    {store.name}
                  </h1>
                  <span style={{ 
                    backgroundColor: '#FEF3C7', 
                    color: '#B45309', 
                    border: '1.5px solid var(--accent-gold)',
                    fontSize: '11px', 
                    fontWeight: 800, 
                    padding: '3px 12px', 
                    borderRadius: 'var(--radius-full)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px'
                  }}>
                    {store.category} Store
                  </span>
                  <span style={{ 
                    backgroundColor: '#ECFDF5', 
                    color: '#047857', 
                    border: '1px solid #A7F3D0',
                    fontSize: '11px', 
                    fontWeight: 700, 
                    padding: '3px 12px', 
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <ShieldCheck size={13} /> Verified Beverly Merchant
                  </span>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', maxWidth: '720px', lineHeight: 1.6, margin: '0 0 16px' }}>
                  {store.description || 'Welcome to our Beverly Group store catalog. Browse our items below for instant ordering.'}
                </p>

                {/* Operational Badges & PDF Menu Trigger */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {store.category === 'food' && (
                    <button
                      type="button"
                      onClick={() => window.print()}
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        fontSize: '12.5px', 
                        fontWeight: 700,
                        backgroundColor: '#111827',
                        color: '#ffffff',
                        border: '1.5px solid var(--accent-gold)',
                        padding: '6px 16px',
                        borderRadius: 'var(--radius-full)',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      <FileText size={14} color="var(--accent-gold)" /> Download Menu (PDF)
                    </button>
                  )}

                  {store.category === 'food' && store.opening_hours && (
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      fontSize: '12px', 
                      color: 'var(--primary-red)', 
                      fontWeight: 650,
                      backgroundColor: '#FEF2F2',
                      border: '1px solid rgba(233, 39, 26, 0.2)',
                      padding: '5px 14px',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      <Clock size={14} />
                      <span>Hours: {store.opening_hours.open} - {store.opening_hours.close}</span>
                    </div>
                  )}

                  {store.category === 'food' && store.avg_prep_time && (
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      fontSize: '12px', 
                      color: '#B45309', 
                      fontWeight: 650,
                      backgroundColor: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      padding: '5px 14px',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      <Zap size={14} />
                      <span>Avg Prep Time: ~{store.avg_prep_time} mins</span>
                    </div>
                  )}

                  {store.fulfillment_type === 'instant' ? (
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      fontSize: '12px', 
                      color: '#047857', 
                      fontWeight: 650,
                      backgroundColor: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      padding: '5px 14px',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      <Box size={14} />
                      <span>⚡ Instant Express Delivery</span>
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      fontSize: '12px', 
                      color: '#047857', 
                      fontWeight: 650,
                      backgroundColor: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      padding: '5px 14px',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      <Box size={14} />
                      <span>📦 Shippable Delivery</span>
                    </div>
                  )}
                </div>

                {/* Cuisine Specialty Tags */}
                {store.cuisine_types && store.cuisine_types.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Specialties:</span>
                    {store.cuisine_types.map(c => (
                      <span key={c} style={{ fontSize: '11px', fontWeight: 700, color: '#B45309', background: '#FEF3C7', border: '1px solid var(--accent-gold)', padding: '2px 10px', borderRadius: '4px' }}>
                        🍕 {c}
                      </span>
                    ))}
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>

        {/* =========================================================================
           2. PRODUCT CATALOG GRID & SEARCH FILTERS
           ========================================================================= */}
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '40px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.4px' }}>Store Catalog &amp; Menu</h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Select an item to customize options or add directly to your cart.
              </p>
            </div>

            {/* Catalog Search & Count */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search in this store..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 32px 8px 38px',
                    fontSize: '13px',
                    borderRadius: 'var(--radius-full)',
                    border: '1.5px solid var(--border)',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                />
                {catalogSearch && (
                  <button onClick={() => setCatalogSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={14} color="var(--text-muted)" />
                  </button>
                )}
              </div>

              <span className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', backgroundColor: '#FFFFFF', padding: '7px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}>
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Item' : 'Items'} Listed
              </span>
            </div>
          </div>

          {/* Quick Sub-Filter Pills */}
          {store.category === 'food' && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => setDietaryFilter('all')}
                style={{
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: 650,
                  border: dietaryFilter === 'all' ? '1.5px solid var(--primary-red)' : '1px solid var(--border)',
                  backgroundColor: dietaryFilter === 'all' ? 'var(--primary-red)' : '#ffffff',
                  color: dietaryFilter === 'all' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                All Items
              </button>
              <button
                type="button"
                onClick={() => setDietaryFilter('spicy')}
                style={{
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: 650,
                  border: dietaryFilter === 'spicy' ? '1.5px solid #EF4444' : '1px solid var(--border)',
                  backgroundColor: dietaryFilter === 'spicy' ? '#FEF2F2' : '#ffffff',
                  color: dietaryFilter === 'spicy' ? '#991B1B' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                🔥 Spicy Meals
              </button>
              <button
                type="button"
                onClick={() => setDietaryFilter('vegetarian')}
                style={{
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: 650,
                  border: dietaryFilter === 'vegetarian' ? '1.5px solid #10B981' : '1px solid var(--border)',
                  backgroundColor: dietaryFilter === 'vegetarian' ? '#ECFDF5' : '#ffffff',
                  color: dietaryFilter === 'vegetarian' ? '#047857' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                🥗 Vegetarian
              </button>
              <button
                type="button"
                onClick={() => setDietaryFilter('quality')}
                style={{
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: 650,
                  border: dietaryFilter === 'quality' ? '1.5px solid var(--accent-gold)' : '1px solid var(--border)',
                  backgroundColor: dietaryFilter === 'quality' ? '#FEF3C7' : '#ffffff',
                  color: dietaryFilter === 'quality' ? '#B45309' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                ✨ Quality Assured
              </button>
            </div>
          )}

          {/* Product Grid / Menu Category Sections */}
          {filteredProducts.length === 0 ? (
            <div style={{ 
              backgroundColor: '#FFFFFF', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border)', 
              padding: '60px 24px', 
              textAlign: 'center', 
              color: 'var(--text-secondary)' 
            }}>
              <StoreIcon size={44} style={{ color: 'var(--border)', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {catalogSearch ? `No products match "${catalogSearch}"` : 'No Products Listed Yet'}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '420px', margin: '6px auto 16px', lineHeight: 1.5 }}>
                {catalogSearch ? 'Try clearing your search or filtering for another item.' : 'This merchant is currently updating their catalog with fresh items.'}
              </p>
              {catalogSearch && (
                <button className="btn btn-secondary" onClick={() => setCatalogSearch('')} style={{ borderRadius: 'var(--radius-full)', padding: '8px 20px', fontSize: '13px' }}>
                  Clear Search
                </button>
              )}
            </div>
          ) : store.category === 'food' ? (
            /* Food Stores: Render Grouped by menu_category */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {Object.entries(
                filteredProducts.reduce((acc, prod) => {
                  const cat = prod.menu_category || 'Main Menu'
                  if (!acc[cat]) acc[cat] = []
                  acc[cat].push(prod)
                  return acc
                }, {} as Record<string, Product[]>)
              ).map(([categoryName, categoryProducts]) => (
                <div key={categoryName}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '2px solid var(--accent-gold)', paddingBottom: '8px' }}>
                    <Utensils size={20} color="var(--primary-red)" />
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>
                      {categoryName}
                    </h3>
                    <span style={{ fontSize: '12px', fontWeight: 700, backgroundColor: '#FEF3C7', color: '#B45309', padding: '2px 10px', borderRadius: 'var(--radius-full)' }}>
                      {categoryProducts.length} {categoryProducts.length === 1 ? 'Item' : 'Items'}
                    </span>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
                    gap: '24px' 
                  }}>
                    {categoryProducts.map(prod => (
                      <div 
                        key={prod.id} 
                        onClick={() => handleProductClick(prod.id)}
                        style={{ 
                          backgroundColor: '#FFFFFF',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          cursor: 'pointer',
                          border: '1.5px solid var(--border)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                          transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)'
                          e.currentTarget.style.borderColor = 'var(--accent-gold)'
                          e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.borderColor = 'var(--border)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div style={{ position: 'relative', width: '100%', height: '170px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                          <ProductImage 
                            src={prod.image_url} 
                            alt={prod.name} 
                            title={prod.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                          <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#047857', color: '#ffffff', padding: '3px 8px', borderRadius: '4px' }}>
                              Made to Order
                            </span>
                          </div>
                          {prod.food_details?.spicy_level && (
                            <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '11px', fontWeight: 700, backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5', padding: '2px 8px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Flame size={12} /> {prod.food_details.spicy_level}
                            </span>
                          )}
                        </div>

                        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                          <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '6px' }}>
                              {prod.name}
                            </h3>
                            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '12px' }}>
                              {prod.description || 'Fresh meal item prepared by store.'}
                            </p>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: 'auto' }}>
                            <div>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>PRICE</span>
                              <span className="font-mono" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-red)' }}>
                                ₦{prod.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={(e) => handleAddToCartClick(e, prod)}
                              style={{
                                padding: '7px 16px',
                                fontSize: '12px',
                                fontWeight: 700,
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: '#E9271A',
                                color: '#ffffff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 6px rgba(233, 39, 26, 0.25)'
                              }}
                            >
                              + Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Retail Stores: Standard Product Grid */
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
              gap: '24px' 
            }}>
              {filteredProducts.map(prod => (
                <div 
                  key={prod.id} 
                  onClick={() => handleProductClick(prod.id)}
                  style={{ 
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    cursor: 'pointer',
                    border: '1.5px solid var(--border)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.borderColor = 'var(--accent-gold)'
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                    <ProductImage 
                      src={prod.image_url} 
                      alt={prod.name} 
                      title={prod.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                      {prod.stock_quantity !== null ? (
                        <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#111827', color: '#ffffff', padding: '3px 8px', borderRadius: '4px' }}>
                          Stock: {prod.stock_quantity}
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#047857', color: '#ffffff', padding: '3px 8px', borderRadius: '4px' }}>
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '6px' }}>
                        {prod.name}
                      </h3>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '12px' }}>
                        {prod.description || 'Quality product from merchant.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: 'auto' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>PRICE</span>
                        <span className="font-mono" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-red)' }}>
                          ₦{prod.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={(e) => handleAddToCartClick(e, prod)}
                        style={{
                          padding: '7px 16px',
                          fontSize: '12px',
                          fontWeight: 700,
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: '#E9271A',
                          color: '#ffffff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 6px rgba(233, 39, 26, 0.25)'
                        }}
                      >
                        + Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      <CustomerFooter />
    </>
  )
}
