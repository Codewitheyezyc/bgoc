'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import CustomerHeader from '@/components/CustomerHeader'
import CustomerFooter from '@/components/CustomerFooter'
import { addToCart, CartItem } from '@/lib/cart'
import { Clock, Box, ShoppingCart, Plus, Minus, AlertTriangle, ArrowLeft, Check, ChevronRight, ShieldCheck, Sparkles, Store as StoreIcon } from 'lucide-react'

interface Store {
  id: string
  name: string
  slug: string
  category: string
  description: string
  logo_url: string
  fulfillment_type: string
  approval_status: string
}

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

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  stock_quantity: number | null
  size_options: string[] | null
  food_details?: FoodDetails
  customizations?: CustomizationGroup[]
}

interface PageProps {
  params: Promise<{ slug: string; id: string }>
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
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'rgba(233, 39, 26, 0.08)',
          color: 'var(--primary-red)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '24px',
          border: '2px solid rgba(233, 39, 26, 0.2)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
          marginBottom: '10px'
        }}>
          {getInitials(title)}
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center', padding: '0 16px' }}>
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

export default function DedicatedProductPage({ params }: PageProps) {
  const router = useRouter()
  const { slug, id: productId } = use(params)
  const supabase = createClient()

  const [store, setStore] = useState<Store | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Selection & Cart state
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedCustomOptions, setSelectedCustomOptions] = useState<{ [groupTitle: string]: CustomizationOption[] }>({})
  const [quantity, setQuantity] = useState(1)
  const [cartError, setCartError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const getExtraPrice = () => {
    let extra = 0
    Object.values(selectedCustomOptions).forEach(opts => {
      opts.forEach(o => { extra += o.price })
    })
    return extra
  }

  const loadProductData = useCallback(async () => {
    try {
      // 1. Fetch Store details
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

      // 2. Fetch Product details
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('store_id', storeData.id)
        .maybeSingle()

      if (prodError) throw prodError
      if (!prodData) {
        router.push(`/store/${slug}`)
        return
      }

      setProduct(prodData)

      // Set default size selection if available
      if (prodData.size_options && prodData.size_options.length > 0) {
        setSelectedSize(prodData.size_options[0])
      } else {
        setSelectedSize(null)
      }

      // Pre-select first option for required single-choice customization groups
      if (prodData.customizations && Array.isArray(prodData.customizations)) {
        const initialCustoms: { [groupTitle: string]: CustomizationOption[] } = {}
        prodData.customizations.forEach((group: CustomizationGroup) => {
          if (group.type === 'single' && group.options.length > 0) {
            initialCustoms[group.title] = [group.options[0]]
          }
        })
        setSelectedCustomOptions(initialCustoms)
      }

      // 3. Fetch Related Products from same store
      const { data: relatedData } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeData.id)
        .neq('id', prodData.id)
        .limit(4)

      setRelatedProducts(relatedData || [])
    } catch (err) {
      console.error('Error loading product details:', err)
      router.push(`/store/${slug}`)
    } finally {
      setLoading(false)
    }
  }, [slug, productId, supabase, router])

  useEffect(() => {
    loadProductData()
  }, [loadProductData])

  const handleAddToCart = () => {
    if (!product || !store) return
    setCartError('')
    setSuccessMsg('')

    if (product.food_details?.is_available === false) {
      setCartError('Sorry, this item is currently sold out for today.')
      return
    }

    // Stock validation
    if (product.stock_quantity !== null && quantity > product.stock_quantity) {
      setCartError(`Only ${product.stock_quantity} items currently available in stock.`)
      return
    }

    // Compile selected custom options text
    const customSummary: string[] = []
    if (selectedSize) customSummary.push(selectedSize)
    Object.entries(selectedCustomOptions).forEach(([title, opts]) => {
      opts.forEach(o => customSummary.push(`${title}: ${o.name}`))
    })

    const unitPrice = product.price + getExtraPrice()

    const item: CartItem = {
      id: product.id + (customSummary.length > 0 ? '-' + customSummary.join('-').replace(/\s+/g, '') : ''),
      name: product.name,
      price: unitPrice,
      image_url: product.image_url,
      quantity,
      size_selected: customSummary.length > 0 ? customSummary.join(' | ') : null,
      store_id: store.id,
      store_name: store.name,
      fulfillment_type: store.fulfillment_type
    }

    const res = addToCart(item)
    if (!res.success) {
      setCartError(res.error || 'Failed to add item.')
    } else {
      setSuccessMsg('Added to cart successfully!')
      setTimeout(() => {
        setSuccessMsg('')
      }, 3000)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
        <CustomerHeader />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          <StoreIcon className="animate-pulse" size={24} style={{ color: 'var(--primary-red)' }} /> Loading product details...
        </div>
      </div>
    )
  }

  if (!store || !product) {
    return null
  }

  return (
    <>
      <CustomerHeader />

      <main className="main-content" style={{ backgroundColor: '#F8FAFC', minHeight: 'calc(100vh - 64px)', paddingBottom: '80px' }}>
        
        {/* Breadcrumb Navigation Bar */}
        <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border)', padding: '14px 0' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="hover:text-red-600">
                Home
              </Link>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              <Link href="/store" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="hover:text-red-600">
                Stores
              </Link>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              <Link href={`/store/${store.slug}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="hover:text-red-600">
                {store.name}
              </Link>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{product.name}</span>
            </div>
          </div>
        </div>

        {/* Product Showcase Hero Container */}
        <div className="container" style={{ paddingTop: '32px' }}>
          
          <button 
            onClick={() => router.push(`/store/${store.slug}`)}
            style={{ 
              background: '#FFFFFF', 
              border: '1px solid var(--border)', 
              color: 'var(--text-secondary)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              cursor: 'pointer',
              fontSize: '13px',
              marginBottom: '24px',
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'all 0.2s'
            }}
          >
            <ArrowLeft size={16} /> Back to {store.name} Catalog
          </button>

          <div style={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--border)', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            padding: '36px',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: '40px'
          }}
          className="product-showcase-grid"
          >
            <style jsx>{`
              @media (min-width: 1024px) {
                .product-showcase-grid {
                  grid-template-columns: 1fr 1fr !important;
                }
              }
            `}</style>

            {/* Left Column: Product Image Showcase */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ 
                position: 'relative', 
                width: '100%', 
                height: '380px', 
                borderRadius: 'var(--radius-md)', 
                overflow: 'hidden', 
                border: '1px solid var(--border)',
                backgroundColor: '#F8FAFC',
                boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
              }}>
                <ProductImage 
                  src={product.image_url} 
                  alt={product.name} 
                  title={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Stock Status Chip */}
                {product.stock_quantity !== null && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    zIndex: 2,
                    backgroundColor: product.stock_quantity <= 5 ? 'rgba(239, 68, 68, 0.95)' : 'rgba(26, 26, 26, 0.85)',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    backdropFilter: 'blur(6px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {product.stock_quantity <= 5 ? `Only ${product.stock_quantity} left` : `${product.stock_quantity} in stock`}
                  </div>
                )}
              </div>

              {/* Merchant Store Info Card */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '14px', 
                backgroundColor: '#F8FAFC', 
                padding: '16px', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border)' 
              }}>
                <ProductImage 
                  src={store.logo_url} 
                  alt={store.name} 
                  title={store.name}
                  style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--accent-gold)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Fulfilled by Merchant</div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>{store.name}</h4>
                </div>
                <Link 
                  href={`/store/${store.slug}`}
                  style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-red)', textDecoration: 'none' }}
                >
                  Visit Store →
                </Link>
              </div>
            </div>

            {/* Right Column: Product Info & Purchase Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Category & Fulfillment Badges */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <span style={{ 
                    backgroundColor: '#FEF2F2', 
                    color: 'var(--primary-red)', 
                    border: '1px solid rgba(233, 39, 26, 0.2)',
                    fontSize: '11px', 
                    fontWeight: 700, 
                    padding: '3px 12px', 
                    borderRadius: 'var(--radius-full)',
                    textTransform: 'uppercase'
                  }}>
                    {store.category}
                  </span>

                  {store.fulfillment_type === 'instant' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#B45309', fontWeight: 600, backgroundColor: '#FFFBEB', padding: '3px 10px', borderRadius: 'var(--radius-full)', border: '1px solid #FDE68A' }}>
                      <Clock size={14} /> Instant Delivery (20-40 mins prep)
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#047857', fontWeight: 600, backgroundColor: '#ECFDF5', padding: '3px 10px', borderRadius: 'var(--radius-full)', border: '1px solid #A7F3D0' }}>
                      <Box size={14} /> Shippable Delivery (1-3 days)
                    </span>
                  )}
                </div>

                <h1 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.5px', marginBottom: '12px', lineHeight: 1.2 }}>
                  {product.name}
                </h1>

                {/* Price Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '20px' }}>
                  <span className="font-mono" style={{ fontSize: '28px', fontWeight: 900, color: 'var(--primary-red)' }}>
                    ₦{product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>per unit</span>
                </div>

                {/* Food Details Badges */}
                {product.food_details && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {product.food_details.spicy_level && product.food_details.spicy_level !== 'None' && (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '16px', backgroundColor: '#FEF2F2', color: 'var(--primary-red)', border: '1px solid #FCA5A5' }}>
                        🌶️ {product.food_details.spicy_level} Spicy
                      </span>
                    )}
                    {product.food_details.dietary && product.food_details.dietary.map(d => (
                      <span key={d} style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '16px', backgroundColor: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}>
                        🌱 {d}
                      </span>
                    ))}
                    {product.food_details.is_available === false && (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '16px', backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                        ⚠️ Sold Out Today
                      </span>
                    )}
                  </div>
                )}

                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '28px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  {product.description || 'No detailed product description available for this item.'}
                </p>

                {/* Feedback Alerts */}
                {cartError && (
                  <div className="alert alert-danger" style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 16px', marginBottom: '20px', borderRadius: 'var(--radius-sm)' }}>
                    <AlertTriangle size={18} />
                    <span>{cartError}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="alert alert-success" style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 16px', marginBottom: '20px', borderRadius: 'var(--radius-sm)' }}>
                    <Check size={18} />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Customizations Groups (Crusts, Sizes, Toppings) */}
                {product.customizations && product.customizations.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    {product.customizations.map((group, gIdx) => (
                      <div key={gIdx} style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <label className="form-label" style={{ marginBottom: '10px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                          {group.title} {group.type === 'single' ? '(Select 1)' : '(Optional Extras)'}
                        </label>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {group.options.map((opt, oIdx) => {
                            const currentList = selectedCustomOptions[group.title] || []
                            const isSelected = currentList.some(o => o.name === opt.name)

                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => {
                                  if (group.type === 'single') {
                                    setSelectedCustomOptions({
                                      ...selectedCustomOptions,
                                      [group.title]: [opt]
                                    })
                                  } else {
                                    const exists = currentList.some(o => o.name === opt.name)
                                    const updated = exists
                                      ? currentList.filter(o => o.name !== opt.name)
                                      : [...currentList, opt]
                                    setSelectedCustomOptions({
                                      ...selectedCustomOptions,
                                      [group.title]: updated
                                    })
                                  }
                                }}
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1.5px solid',
                                  borderColor: isSelected ? 'var(--primary-red)' : 'var(--border)',
                                  backgroundColor: isSelected ? '#FEF2F2' : '#FFFFFF',
                                  color: isSelected ? 'var(--primary-red)' : 'var(--text-primary)',
                                  fontWeight: isSelected ? 700 : 500,
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                {isSelected && <Check size={14} />}
                                <span>{opt.name}</span>
                                {opt.price > 0 && (
                                  <span style={{ fontSize: '11px', color: isSelected ? 'var(--primary-red)' : 'var(--text-muted)' }}>
                                    (+₦{opt.price.toLocaleString()})
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sizing selector (if applicable) */}
                {product.size_options && product.size_options.length > 0 && (
                  <div style={{ marginBottom: '24px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <label className="form-label" style={{ marginBottom: '10px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                      Select Size Option
                    </label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {product.size_options.map(sz => {
                        const isSelected = selectedSize === sz
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedSize(sz)}
                            style={{
                              padding: '10px 22px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1.5px solid',
                              borderColor: isSelected ? 'var(--primary-red)' : 'var(--border)',
                              backgroundColor: isSelected ? '#FEF2F2' : '#FFFFFF',
                              color: isSelected ? 'var(--primary-red)' : 'var(--text-primary)',
                              fontWeight: isSelected ? 700 : 500,
                              fontSize: '13px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {isSelected && <Check size={14} />}
                            <span>{sz}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity Stepper & Subtotal Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Calculated Total</span>
                    <div className="font-mono" style={{ fontSize: '20px', fontWeight: 900, color: 'var(--ink)' }}>
                      ₦{((product.price + getExtraPrice()) * quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Quantity:</span>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: '#FFFFFF' }}>
                      <button 
                        type="button"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        style={{ background: 'none', border: 'none', padding: '10px 14px', cursor: 'pointer', display: 'flex', color: 'var(--text-primary)' }}
                        title="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-mono" style={{ width: '40px', textAlign: 'center', fontSize: '15px', fontWeight: 700 }}>
                        {quantity}
                      </span>
                      <button 
                        type="button"
                        onClick={() => setQuantity(q => q + 1)}
                        style={{ background: 'none', border: 'none', padding: '10px 14px', cursor: 'pointer', display: 'flex', color: 'var(--text-primary)' }}
                        title="Increase quantity"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add to Cart CTA Button */}
              <div>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', 
                    padding: '16px', 
                    fontSize: '16px', 
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--primary-red)',
                    border: '1.5px solid var(--accent-gold)',
                    boxShadow: '0 4px 16px rgba(233, 39, 26, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                  }}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart size={20} /> 
                  <span>Add to Cart • ₦{(product.price * quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </button>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={15} style={{ color: '#047857' }} /> Verified Platform Merchant
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={15} style={{ color: 'var(--accent-gold)' }} /> Secure Checkout Guarantee
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Related Items Section */}
          {relatedProducts.length > 0 && (
            <div style={{ marginTop: '56px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)' }}>
                  More from {store.name}
                </h3>
                <Link 
                  href={`/store/${store.slug}`}
                  style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-red)', textDecoration: 'none' }}
                >
                  View Full Catalog →
                </Link>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
                gap: '24px' 
              }}>
                {relatedProducts.map(rel => (
                  <div 
                    key={rel.id} 
                    style={{ 
                      backgroundColor: '#FFFFFF',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)'
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)'
                    }}
                    onClick={() => router.push(`/store/${store.slug}/product/${rel.id}`)}
                  >
                    <ProductImage 
                      src={rel.image_url} 
                      alt={rel.name} 
                      title={rel.name}
                      style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                    />
                    
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>{rel.name}</h4>
                        <p style={{ 
                          color: 'var(--text-secondary)', 
                          fontSize: '12px', 
                          lineHeight: 1.4, 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical', 
                          overflow: 'hidden' 
                        }}>
                          {rel.description || 'No description available.'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                        <span className="font-mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-red)' }}>
                          ₦{rel.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          View Item →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <CustomerFooter />
    </>
  )
}
