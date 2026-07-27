'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import CustomerHeader from '@/components/CustomerHeader'
import CustomerFooter from '@/components/CustomerFooter'
import { addToCart } from '@/lib/cart'
import { 
  ShieldCheck, Truck, Lock, ArrowRight, ChevronLeft, ChevronRight, 
  ShoppingBag, Search, Sparkles, Store as StoreIcon, Utensils, CheckCircle, Mail, ArrowUpRight
} from 'lucide-react'

interface DBStore {
  id: string
  name: string
  slug: string
  category: string
  description: string
  logo_url: string
  fulfillment_type: string
  approval_status: string
}

interface DBProduct {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  store_id: string
  stores?: {
    name: string
    slug: string
    fulfillment_type?: string
  }
}

const FOUNDING_STORES = [
  { name: "Beverly Meals Exclusive Restaurant", slug: "beverly-meals-exclusive-restaurant", category: "food", tag: "Fine Dining • Hot Meals", actionText: "View Menu", description: "Fine dining and hot local meals, ready when you are.", icon: "🍽️", tint: "#FEF2F2", isFood: true },
  { name: "Beverly Meals & Bakeries", slug: "beverly-meals-bakeries", category: "food", tag: "Fresh Pastries • Daily", actionText: "View Menu", description: "Freshly baked bread, pastries, and confectionery — made daily.", icon: "🥐", tint: "#FFFBEB", isFood: true },
  { name: "Yurmealicious Pizza", slug: "yurmealicious-pizza", category: "food", tag: "Pizza • Fast Delivery", actionText: "View Menu", description: "Hot, wood-fired pizza made to order.", icon: "🍕", tint: "#FEF3C7", isFood: true },
  { name: "Homeworld Supermarket", slug: "homeworld-supermarket", category: "home", tag: "Home & Kitchen Goods", actionText: "Visit Store", description: "Home appliances, electronics, and kitchen essentials.", icon: "🏠", tint: "#F0FDF4", isFood: false },
  { name: "Toys in CandiLand", slug: "toys-in-candiland", category: "toys", tag: "Sweets & Toys", actionText: "Visit Store", description: "Exotic candies, chocolates, sweets, and children's toys.", icon: "🧸", tint: "#FDE8E8", isFood: false },
  { name: "Dollnatia — Kayla's Castle", slug: "dollnatia-kaylas-castle", category: "toys", tag: "Dolls & Gifts", actionText: "Visit Store", description: "Beautiful dolls, toys, and gifts for children.", icon: "👑", tint: "#FEE2E2", isFood: false },
  { name: "Celebrity Styles", slug: "celebrity-styles", category: "fashion", tag: "Fashion & Apparel", actionText: "Visit Store", description: "High-quality, stylish local fashion and apparel.", icon: "👗", tint: "#F3E8FF", isFood: false }
]

const matchFoundingStore = (foundingSlug: string, dbStores: DBStore[], status: 'approved' | 'unclaimed') => {
  return dbStores.find(db => {
    if (db.approval_status !== status) return false

    const dbName = db.name.toLowerCase()
    const dbSlug = db.slug.toLowerCase()

    if (foundingSlug === 'beverly-meals-bakeries') {
      return dbSlug.includes('bakeries') || dbSlug.includes('bakery') || dbName.includes('bakery') || dbName.includes('bakeries')
    }
    if (foundingSlug === 'beverly-meals-exclusive-restaurant') {
      return dbSlug.includes('exclusive-restaurant') || dbName.includes('exclusive restaurant') || (dbSlug.includes('restaurant') && !dbSlug.includes('pizza'))
    }
    if (foundingSlug === 'yurmealicious-pizza') {
      return dbSlug.includes('pizza') || dbName.includes('pizza')
    }
    if (foundingSlug === 'homeworld-supermarket') {
      return dbSlug.includes('homeworld') || dbName.includes('homeworld')
    }
    if (foundingSlug === 'toys-in-candiland') {
      return dbSlug.includes('candiland') || dbName.includes('candiland') || dbSlug.includes('candi') || dbName.includes('candi')
    }
    if (foundingSlug === 'dollnatia-kaylas-castle') {
      return dbSlug.includes('dollnatia') || dbName.includes('dollnatia')
    }
    if (foundingSlug === 'celebrity-styles') {
      return dbSlug.includes('celebrity') || dbName.includes('celebrity')
    }
    return false
  })
}

export default function StorefrontHome() {
  const router = useRouter()
  const supabase = createClient()

  const [dbStores, setDbStores] = useState<DBStore[]>([])
  const [recentProducts, setRecentProducts] = useState<DBProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [heroSearch, setHeroSearch] = useState('')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)

  const shopByStoreScrollRef = useRef<HTMLDivElement>(null)
  const meetOurStoresScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch approved & unclaimed stores
        const { data: storesData } = await supabase
          .from('stores')
          .select('*')
          .in('approval_status', ['approved', 'unclaimed'])

        if (storesData) {
          setDbStores(storesData)
        }

        // Fetch recent products for Newest Products section
        const { data: productsData } = await supabase
          .from('products')
          .select('*, stores:store_id(name, slug, fulfillment_type)')
          .order('created_at', { ascending: false })
          .limit(8)

        if (productsData) {
          setRecentProducts(productsData)
        }
      } catch (err) {
        console.error('Error fetching storefront data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [supabase])

  const scrollShopByStore = (direction: 'left' | 'right') => {
    if (shopByStoreScrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320
      shopByStoreScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const scrollMeetOurStores = (direction: 'left' | 'right') => {
    if (meetOurStoresScrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340
      meetOurStoresScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (heroSearch.trim()) {
      router.push(`/store?q=${encodeURIComponent(heroSearch.trim())}`)
    } else {
      router.push('/store')
    }
  }

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true)
    }
  }

  return (
    <>
      <CustomerHeader />

      <main className="main-content" style={{ padding: 0, backgroundColor: '#FFFFFF' }}>
        
        {/* =========================================================================
           1. HERO SECTION (Split Left Content / Right Visual Grid)
           ========================================================================= */}
        <section style={{ 
          background: 'radial-gradient(circle at top right, rgba(251, 192, 45, 0.08) 0%, rgba(233, 39, 26, 0.03) 50%, #ffffff 100%)', 
          borderBottom: '1.5px solid var(--border)', 
          padding: '72px 24px 80px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative subtle dot texture */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.12,
            pointerEvents: 'none'
          }} />

          <div className="container" style={{ maxWidth: '1200px', position: 'relative', zIndex: 1, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '48px', alignItems: 'center' }}>
              
              {/* Hero Left Content */}
              <div className="mobile-stack-center">
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '6px 16px', 
                  borderRadius: 'var(--radius-full)', 
                  backgroundColor: '#FEF3C7', 
                  border: '1.5px solid var(--accent-gold)', 
                  color: '#B45309', 
                  fontSize: '12px', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px', 
                  marginBottom: '24px',
                  boxShadow: '0 2px 10px rgba(251, 192, 45, 0.15)'
                }}>
                  ✨ Beverly Group Official Marketplace
                </div>

                <h1 className="mobile-center" style={{ 
                  fontSize: '44px', 
                  fontWeight: 800, 
                  letterSpacing: '-1.2px', 
                  lineHeight: 1.12,
                  color: 'var(--ink)',
                  marginBottom: '20px'
                }}>
                  Everything Beverly Group sells,<br />
                  <span style={{ 
                    background: 'linear-gradient(135deg, #E9271A 0%, #B91C1C 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    all in one place.
                  </span>
                </h1>
                
                <p className="mobile-center" style={{ 
                  fontSize: '16.5px', 
                  color: 'var(--text-secondary)', 
                  lineHeight: 1.6, 
                  marginBottom: '32px',
                  maxWidth: '520px'
                }}>
                  Order fresh meals, hot pizzas, daily baked treats, fashion, home goods, and toys from all Beverly Group stores in one easy checkout.
                </p>

                {/* Hero Primary Actions */}
                <div className="mobile-flex-center" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '32px' }}>
                  <Link 
                    href="/store"
                    className="btn btn-primary mobile-btn-full" 
                    style={{ 
                      padding: '14px 32px', 
                      fontSize: '15px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: '#E9271A',
                      color: '#ffffff',
                      border: '1.5px solid var(--accent-gold)',
                      boxShadow: '0 4px 16px rgba(233, 39, 26, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      textDecoration: 'none'
                    }}
                  >
                    Shop Now <ArrowRight size={18} />
                  </Link>

                  <Link 
                    href="/register"
                    className="btn btn-secondary mobile-btn-full" 
                    style={{ 
                      padding: '14px 24px', 
                      fontSize: '14px',
                      fontWeight: 650,
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid var(--border)',
                      color: 'var(--text-primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none'
                    }}
                  >
                    <StoreIcon size={16} color="var(--primary-red)" /> Partner as Merchant
                  </Link>
                </div>

                {/* Quick Category Chips */}
                <div className="mobile-flex-center" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '12.5px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Popular Categories:</span>
                  <button type="button" onClick={() => router.push('/store?q=pizza')} style={{ background: '#FEF3C7', border: '1px solid var(--accent-gold)', borderRadius: 'var(--radius-full)', padding: '4px 14px', color: '#B45309', cursor: 'pointer', fontWeight: 650 }}>🍕 Pizza &amp; Fast Meals</button>
                  <button type="button" onClick={() => router.push('/store?q=bakery')} style={{ background: '#FFFBEB', border: '1px solid var(--accent-gold)', borderRadius: 'var(--radius-full)', padding: '4px 14px', color: '#B45309', cursor: 'pointer', fontWeight: 650 }}>🥐 Bakeries &amp; Cakes</button>
                  <button type="button" onClick={() => router.push('/store?q=toys')} style={{ background: '#FDE8E8', border: '1px solid var(--accent-gold)', borderRadius: 'var(--radius-full)', padding: '4px 14px', color: '#991B1B', cursor: 'pointer', fontWeight: 650 }}>🧸 Toys &amp; Candies</button>
                  <button type="button" onClick={() => router.push('/store?q=fashion')} style={{ background: '#F3E8FF', border: '1px solid var(--accent-gold)', borderRadius: 'var(--radius-full)', padding: '4px 14px', color: '#6B21A8', cursor: 'pointer', fontWeight: 650 }}>👗 Fashion Boutique</button>
                </div>
              </div>

              {/* Hero Right Visual Showcase (Sleek Modern Glassmorphic Platform Card) */}
              <div style={{ position: 'relative' }}>
                
                {/* Background Ambient Glow */}
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '240px',
                  height: '240px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(233, 39, 26, 0.15) 0%, rgba(251, 192, 45, 0.15) 50%, transparent 70%)',
                  filter: 'blur(30px)',
                  pointerEvents: 'none'
                }} />

                {/* Main Hero Card Container */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  padding: '24px',
                  border: '1.5px solid var(--border)',
                  boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)',
                  position: 'relative',
                  zIndex: 2
                }}>
                  
                  {/* Card Header Pill */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verified Beverly Merchants</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      7 Stores Live
                    </span>
                  </div>

                  {/* Curated Store Photography Grid Preview */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    
                    <div 
                      onClick={() => {
                        const m = matchFoundingStore('yurmealicious-pizza', dbStores, 'approved') || matchFoundingStore('yurmealicious-pizza', dbStores, 'unclaimed')
                        router.push(`/store/${m?.slug || 'yurmealicious-pizza'}`)
                      }}
                      style={{ 
                        borderRadius: 'var(--radius-md)', 
                        overflow: 'hidden',
                        border: '1px solid #FCA5A5', 
                        cursor: 'pointer',
                        position: 'relative',
                        height: '110px',
                        backgroundColor: '#FEF2F2'
                      }}
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80" 
                        alt="Yurmealicious Pizza" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>Yurmealicious Pizza</h4>
                        <span style={{ fontSize: '10px', color: '#FCD34D', fontWeight: 700 }}>Wood-Fired Pizza</span>
                      </div>
                    </div>

                    <div 
                      onClick={() => {
                        const m = matchFoundingStore('beverly-meals-bakeries', dbStores, 'approved') || matchFoundingStore('beverly-meals-bakeries', dbStores, 'unclaimed')
                        router.push(`/store/${m?.slug || 'beverly-meals-bakeries'}`)
                      }}
                      style={{ 
                        borderRadius: 'var(--radius-md)', 
                        overflow: 'hidden',
                        border: '1px solid #FDE68A', 
                        cursor: 'pointer',
                        position: 'relative',
                        height: '110px',
                        backgroundColor: '#FFFBEB'
                      }}
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80" 
                        alt="Beverly Bakeries" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>Beverly Bakeries</h4>
                        <span style={{ fontSize: '10px', color: '#FCD34D', fontWeight: 700 }}>Fresh Pastries Daily</span>
                      </div>
                    </div>

                    <div 
                      onClick={() => {
                        const m = matchFoundingStore('celebrity-styles', dbStores, 'approved') || matchFoundingStore('celebrity-styles', dbStores, 'unclaimed')
                        router.push(`/store/${m?.slug || 'celebrity-styles'}`)
                      }}
                      style={{ 
                        borderRadius: 'var(--radius-md)', 
                        overflow: 'hidden',
                        border: '1px solid #DDD6FE', 
                        cursor: 'pointer',
                        position: 'relative',
                        height: '110px',
                        backgroundColor: '#F3E8FF'
                      }}
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=400&q=80" 
                        alt="Celebrity Styles" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>Celebrity Styles</h4>
                        <span style={{ fontSize: '10px', color: '#FCD34D', fontWeight: 700 }}>Fashion &amp; Boutique</span>
                      </div>
                    </div>

                    <div 
                      onClick={() => {
                        const m = matchFoundingStore('toys-in-candiland', dbStores, 'approved') || matchFoundingStore('toys-in-candiland', dbStores, 'unclaimed')
                        router.push(`/store/${m?.slug || 'toys-in-candiland'}`)
                      }}
                      style={{ 
                        borderRadius: 'var(--radius-md)', 
                        overflow: 'hidden',
                        border: '1px solid #FCA5A5', 
                        cursor: 'pointer',
                        position: 'relative',
                        height: '110px',
                        backgroundColor: '#FDE8E8'
                      }}
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=400&q=80" 
                        alt="Toys in CandiLand" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>Toys in CandiLand</h4>
                        <span style={{ fontSize: '10px', color: '#FCD34D', fontWeight: 700 }}>Sweets &amp; Toys</span>
                      </div>
                    </div>

                  </div>

                  {/* Card Bottom Banner */}
                  <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      ⚡ Single Unified Checkout
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-red)' }}>
                      Paystack Secured 🔒
                    </span>
                  </div>

                </div>

              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
           2. TRUST BADGES ROW (3 Cards matching NexCart reference layout)
           ========================================================================= */}
        <section style={{ backgroundColor: '#ffffff', padding: '40px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              
              {/* Card 1 */}
              <div style={{ 
                padding: '28px', 
                borderRadius: 'var(--radius-md)', 
                backgroundColor: '#F8FAFC', 
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '18px'
              }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={22} color="#B45309" />
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', marginBottom: '4px' }}>Verified Local Stores</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>Every store on BGOC is reviewed and approved by Beverly Group admins.</p>
                  <Link href="/about" style={{ fontSize: '12px', fontWeight: 700, color: '#B45309', textDecoration: 'none' }}>
                    Explore Platform Integrity →
                  </Link>
                </div>
              </div>

              {/* Card 2: DARK HIGHLIGHTED CARD (Matches NexCart reference) */}
              <div style={{ 
                padding: '28px', 
                borderRadius: 'var(--radius-md)', 
                backgroundColor: '#111827', 
                color: '#ffffff',
                border: '1px solid #1E293B',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '18px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
              }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(233, 39, 26, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Truck size={22} color="#E9271A" />
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>Fast, Reliable Delivery</h4>
                  <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.5, marginBottom: '10px' }}>Express local dispatch for hot meals, bakery items, and retail packages.</p>
                  <Link href="/store" style={{ fontSize: '12px', fontWeight: 700, color: '#E9271A', textDecoration: 'none' }}>
                    Explore Delivery Options →
                  </Link>
                </div>
              </div>

              {/* Card 3 */}
              <div style={{ 
                padding: '28px', 
                borderRadius: 'var(--radius-md)', 
                backgroundColor: '#F8FAFC', 
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '18px'
              }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Lock size={22} color="#047857" />
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', marginBottom: '4px' }}>Secure Checkout</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>Payments processed safely with instant verification through Paystack.</p>
                  <Link href="/terms" style={{ fontSize: '12px', fontWeight: 700, color: '#047857', textDecoration: 'none' }}>
                    Explore Payment Security →
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
           3. "MEET OUR STORES" (Horizontally Scrollable Store Carousel)
           ========================================================================= */}
        <section id="store-grid-section" style={{ backgroundColor: '#F8FAFC', padding: '60px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-red)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                  Founding Marketplace Brands
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.8px' }}>
                  Meet Our Stores
                </h2>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Link href="/store" style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--primary-red)', textDecoration: 'none' }}>
                  View All Stores →
                </Link>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => scrollMeetOurStores('left')}
                    style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--border)', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    title="Scroll Left"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => scrollMeetOurStores('right')}
                    style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--border)', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    title="Scroll Right"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center font-mono" style={{ padding: '40px 0', color: 'var(--text-muted)' }}>
                Loading Beverly Group stores...
              </div>
            ) : (
              <div 
                ref={meetOurStoresScrollRef}
                style={{ 
                  display: 'flex', 
                  gap: '20px', 
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  paddingBottom: '12px'
                }}
              >
                {FOUNDING_STORES.map(founding => {
                  const approvedMatch = matchFoundingStore(founding.slug, dbStores, 'approved')
                  const unclaimedMatch = approvedMatch
                    ? undefined
                    : matchFoundingStore(founding.slug, dbStores, 'unclaimed')

                  if (approvedMatch) {
                    return (
                      <div key={approvedMatch.slug} style={{ flex: '0 0 310px' }}>
                        <Link href={`/store/${approvedMatch.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div className="card" style={{ 
                            height: '100%', 
                            padding: '22px',
                            backgroundColor: '#ffffff',
                            border: '1.5px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)'
                            e.currentTarget.style.borderColor = 'var(--accent-gold)'
                            e.currentTarget.style.boxShadow = '0 10px 24px rgba(233, 39, 26, 0.08)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.borderColor = 'var(--border)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                          >
                            <div>
                              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                                <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                                  <Image src={approvedMatch.logo_url} alt={approvedMatch.name} fill sizes="48px" style={{ objectFit: 'cover' }} />
                                </div>
                                <div>
                                  <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{approvedMatch.name}</h3>
                                  <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: 'var(--radius-full)', marginTop: '4px', display: 'inline-block' }}>
                                    {founding.tag}
                                  </span>
                                </div>
                              </div>

                              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px', height: '38px', overflow: 'hidden' }}>
                                {approvedMatch.description || founding.description}
                              </p>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                              <button 
                                className="btn btn-primary"
                                style={{ 
                                  width: '100%', 
                                  padding: '10px 16px', 
                                  fontSize: '13px', 
                                  fontWeight: 700, 
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: founding.isFood ? '#E9271A' : '#111827',
                                  color: '#ffffff',
                                  border: founding.isFood ? '1.5px solid var(--accent-gold)' : 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px'
                                }}
                              >
                                {founding.actionText} →
                              </button>
                            </div>
                          </div>
                        </Link>
                      </div>
                    )
                  } else {
                    const logoSrc = unclaimedMatch?.logo_url || null
                    return (
                      <div key={founding.slug} style={{ flex: '0 0 310px' }}>
                        <div className="card" style={{ 
                          opacity: 0.9, 
                          border: '1.5px dashed var(--accent-gold)', 
                          height: '100%',
                          padding: '22px',
                          backgroundColor: '#ffffff',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                              {logoSrc ? (
                                <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0, filter: 'grayscale(100%) opacity(0.7)' }}>
                                  <Image src={logoSrc} alt={founding.name} fill sizes="48px" style={{ objectFit: 'cover' }} />
                                </div>
                              ) : (
                                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#9CA3AF', fontSize: '14px', flexShrink: 0 }}>
                                  {founding.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--text-muted)' }}>{founding.name}</h3>
                                <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid var(--accent-gold)', padding: '2px 8px', borderRadius: 'var(--radius-full)', marginTop: '4px', display: 'inline-block' }}>
                                  OPENING SOON
                                </span>
                              </div>
                            </div>

                            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px', height: '38px', overflow: 'hidden' }}>
                              {founding.description}
                            </p>
                          </div>

                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                            <div 
                              style={{ 
                                width: '100%', 
                                padding: '10px 16px', 
                                fontSize: '12.5px', 
                                fontWeight: 700, 
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: '#F1F5F9',
                                color: '#64748B',
                                textAlign: 'center'
                              }}
                            >
                              Pre-Launch Store
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }
                })}
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
           4. "SHOP BY CATEGORY" (Interactive category filter cards)
           ========================================================================= */}
        <section style={{ backgroundColor: '#ffffff', padding: '60px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.6px' }}>
                  Shop by Category
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Explore products and stores by your favorite shopping category.
                </p>
              </div>

              {/* Scroll Arrow Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => scrollShopByStore('left')}
                  style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--border)', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  title="Scroll Left"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => scrollShopByStore('right')}
                  style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--border)', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  title="Scroll Right"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Category Cards Row */}
            <div 
              ref={shopByStoreScrollRef}
              style={{
                display: 'flex',
                gap: '20px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                paddingBottom: '8px'
              }}
            >
              {[
                { name: "Restaurants & Dining", query: "food", icon: "🍽️", tag: "Fine Meals & Dishes", tint: "#FEF2F2" },
                { name: "Wood-Fired Pizza", query: "pizza", icon: "🍕", tag: "Hot Pizza Delivery", tint: "#FEF3C7" },
                { name: "Bakeries & Cakes", query: "bakery", icon: "🥐", tag: "Fresh Pastries Daily", tint: "#FFFBEB" },
                { name: "Supermarket & Home", query: "home", icon: "🏠", tag: "Appliances & Goods", tint: "#F0FDF4" },
                { name: "Toys & Candies", query: "toys", icon: "🧸", tag: "Sweets & Children Toys", tint: "#FDE8E8" },
                { name: "Fashion & Boutique", query: "fashion", icon: "👗", tag: "Style & Apparel", tint: "#F3E8FF" }
              ].map((cat, idx) => (
                <div
                  key={idx}
                  onClick={() => router.push(`/store?q=${encodeURIComponent(cat.query)}`)}
                  style={{
                    flex: '0 0 240px',
                    backgroundColor: cat.tint,
                    borderRadius: 'var(--radius-md)',
                    padding: '24px 20px',
                    textAlign: 'center',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div>
                    <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-sm)', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 14px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                      {cat.icon}
                    </div>

                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
                      {cat.name}
                    </h4>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.4px' }}>
                      {cat.tag}
                    </span>
                  </div>

                  <div style={{ marginTop: '16px', fontSize: '12.5px', fontWeight: 700, color: 'var(--primary-red)' }}>
                    Browse Category →
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* =========================================================================
           5. NEWEST PRODUCTS (Curated real database products)
           ========================================================================= */}
        {recentProducts.length > 0 && (
          <section style={{ backgroundColor: '#F8FAFC', padding: '60px 24px', borderBottom: '1px solid var(--border)' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-red)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                    Fresh Additions
                  </div>
                  <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.6px' }}>
                    Newest Products
                  </h2>
                </div>
                <Link href="/store" style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--primary-red)', textDecoration: 'none' }}>
                  Browse Full Catalog →
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                {recentProducts.map(prod => (
                  <div 
                    key={prod.id} 
                    className="card"
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)'
                      e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.06)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ position: 'relative', height: '160px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                      <img 
                        src={prod.image_url} 
                        alt={prod.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      {prod.stores && (
                        <span style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '10px', fontWeight: 700, backgroundColor: '#111827', color: '#ffffff', padding: '3px 8px', borderRadius: '4px' }}>
                          {prod.stores.name}
                        </span>
                      )}
                    </div>

                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '6px' }}>
                          {prod.name}
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, height: '34px', overflow: 'hidden', marginBottom: '12px' }}>
                          {prod.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                        <span className="font-mono" style={{ fontSize: '15px', fontWeight: 700, color: '#E9271A' }}>
                          ₦{prod.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <button
                          className="btn btn-primary"
                          style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px', fontSize: '12px', fontWeight: 700, backgroundColor: '#E9271A' }}
                          onClick={() => {
                            const result = addToCart({
                              id: prod.id,
                              name: prod.name,
                              price: prod.price,
                              quantity: 1,
                              image_url: prod.image_url,
                              store_id: prod.store_id,
                              store_name: prod.stores?.name || 'Beverly Store',
                              fulfillment_type: prod.stores?.fulfillment_type || 'instant'
                            })
                            if (result.success) {
                              alert(`Added "${prod.name}" to cart!`)
                            } else {
                              alert(result.error || 'Could not add product to cart.')
                            }
                          }}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>
        )}

        {/* =========================================================================
           6. "HOW IT WORKS" (3-step value explanation)
           ========================================================================= */}
        <section style={{ backgroundColor: '#ffffff', padding: '60px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
            
            <div style={{ marginBottom: '40px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-red)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                Simple &amp; Unified Experience
              </div>
              <h2 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.8px' }}>
                How BGOC Works
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
              <div className="card text-center" style={{ padding: '32px 24px', backgroundColor: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 800, fontSize: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  1
                </div>
                <h4 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '8px' }}>Choose Your Store</h4>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Select from verified Beverly restaurants, bakeries, supermarkets, toys, or fashion boutiques.
                </p>
              </div>

              <div className="card text-center" style={{ padding: '32px 24px', backgroundColor: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 800, fontSize: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  2
                </div>
                <h4 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '8px' }}>Add to Unified Cart</h4>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Combine meals, fresh bread, and retail items from multiple stores into a single checkout with Paystack.
                </p>
              </div>

              <div className="card text-center" style={{ padding: '32px 24px', backgroundColor: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 800, fontSize: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  3
                </div>
                <h4 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '8px' }}>Express Delivery</h4>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Get hot food dispatches, daily bakery orders, or package shipments delivered directly to your door.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
           7. "WE ARE READY TO HELP" NEWSLETTER STRIP (Matches reference dark banner)
           ========================================================================= */}
        <section style={{ backgroundColor: '#0F172A', color: '#ffffff', padding: '60px 24px', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(233, 39, 26, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Mail size={24} color="#E9271A" />
            </div>

            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '10px' }}>
              We Are Ready to Help!
            </h2>
            <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '28px' }}>
              Subscribe to receive updates on new store openings, fresh menu additions, and special Beverly Group offers.
            </p>

            {newsletterSubscribed ? (
              <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 'var(--radius-full)', padding: '14px 24px', color: '#4ADE80', fontWeight: 700, fontSize: '14px' }}>
                ✓ Thank you for subscribing to Beverly Group updates!
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} style={{ display: 'flex', gap: '8px', maxWidth: '480px', margin: '0 auto', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  placeholder="Enter your email address..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    padding: '12px 18px',
                    fontSize: '13.5px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid #334155',
                    backgroundColor: '#1E293B',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ borderRadius: 'var(--radius-full)', padding: '12px 24px', fontSize: '13.5px', fontWeight: 700, backgroundColor: '#E9271A' }}
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </section>

      </main>

      <CustomerFooter />
    </>
  )
}
