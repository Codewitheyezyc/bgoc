'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import CustomerHeader from '@/components/CustomerHeader'
import CustomerFooter from '@/components/CustomerFooter'
import { Search, Filter, X, Utensils, ShoppingBag, Sparkles, Truck, Clock } from 'lucide-react'

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

const FOUNDING_STORES = [
  { name: "Beverly Meals Exclusive Restaurant", slug: "beverly-meals-exclusive-restaurant", category: "food", description: "Fine dining and hot local meals, ready when you are." },
  { name: "Beverly Meals & Bakeries", slug: "beverly-meals-bakeries", category: "food", description: "Freshly baked bread, pastries, and confectionery — made daily." },
  { name: "Yurmealicious Pizza", slug: "yurmealicious-pizza", category: "food", description: "Hot, wood-fired pizza made to order." },
  { name: "Homeworld Supermarket", slug: "homeworld-supermarket", category: "home", description: "Home appliances, electronics, and kitchen essentials." },
  { name: "Toys in CandiLand", slug: "toys-in-candiland", category: "toys", description: "Exotic candies, chocolates, sweets, and children's toys." },
  { name: "Dollnatia — Kayla's Castle", slug: "dollnatia-kaylas-castle", category: "toys", description: "Beautiful dolls, toys, and gifts for children." },
  { name: "Celebrity Styles", slug: "celebrity-styles", category: "fashion", description: "High-quality, stylish local fashion and apparel." }
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

function StoreDirectoryContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const supabase = createClient()
  const [dbStores, setDbStores] = useState<DBStore[]>([])
  const [loading, setLoading] = useState(true)

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all')
  const [selectedFulfillment, setSelectedFulfillment] = useState<string>('all')

  useEffect(() => {
    const q = searchParams.get('q')
    if (q !== null) {
      setSearchQuery(q)
    }
  }, [searchParams])

  useEffect(() => {
    async function loadStores() {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .in('approval_status', ['approved', 'unclaimed'])

        if (!error && data) {
          setDbStores(data)
        }
      } catch (err) {
        console.error('Error fetching stores:', err)
      } finally {
        setLoading(false)
      }
    }
    loadStores()
  }, [supabase])

  // Filter calculation
  const filteredFoundingStores = FOUNDING_STORES.filter(founding => {
    // Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchesName = founding.name.toLowerCase().includes(q)
      const matchesCategory = founding.category.toLowerCase().includes(q)
      const matchesDesc = founding.description.toLowerCase().includes(q)
      const matchesSlug = founding.slug.toLowerCase().includes(q)
      if (!matchesName && !matchesCategory && !matchesDesc && !matchesSlug) {
        return false
      }
    }

    // Category filter check
    if (selectedCategory !== 'all' && founding.category !== selectedCategory) {
      return false
    }

    // Food Cuisine subcategory filter check
    if (selectedCuisine !== 'all') {
      const slug = founding.slug.toLowerCase()
      if (selectedCuisine === 'pizza' && !slug.includes('pizza')) return false
      if (selectedCuisine === 'bakery' && !slug.includes('bakeries')) return false
      if (selectedCuisine === 'restaurant' && !slug.includes('exclusive-restaurant')) return false
    }

    // Fulfillment filter check
    if (selectedFulfillment !== 'all') {
      const approvedMatch = matchFoundingStore(founding.slug, dbStores, 'approved')
      if (approvedMatch && approvedMatch.fulfillment_type !== selectedFulfillment) {
        return false
      }
    }

    return true
  })

  return (
    <>
      <CustomerHeader />

      <main className="main-content" style={{ minHeight: 'calc(100vh - 160px)', padding: '40px 24px 80px', backgroundColor: 'var(--bg-app)', position: 'relative' }}>
        {/* Subtle grid background */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.1,
          pointerEvents: 'none'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Header & Title */}
          <div style={{ marginBottom: '36px', textAlign: 'center' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '4px 14px', 
              borderRadius: 'var(--radius-full)', 
              backgroundColor: '#FEF3C7', 
              border: '1.5px solid var(--accent-gold)', 
              color: '#B45309', 
              fontSize: '11px', 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              letterSpacing: '0.8px', 
              marginBottom: '14px'
            }}>
              Beverly Group Marketplace
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-1px', marginBottom: '10px' }}>
              Explore Our Stores
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '540px', margin: '0 auto', lineHeight: 1.5 }}>
              Browse menu catalogs, hot pizzas, fresh bakery items, toys, and apparel from our approved brands.
            </p>
          </div>

          {/* Search & Multi-Filter Controls */}
          <div className="card" style={{ padding: '20px 24px', marginBottom: '36px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', maxWidth: '100%', overflow: 'hidden' }}>
            
            {/* Top Bar: Search Input + Fulfillment selector */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', maxWidth: '100%' }}>
              
              {/* Search Bar */}
              <div style={{ position: 'relative', flex: '1 1 200px', width: '100%', maxWidth: '100%' }}>
                <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search stores, pizza, bakery, toys..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 36px 10px 40px',
                    fontSize: '13.5px',
                    borderRadius: 'var(--radius-full)',
                    border: '1.5px solid var(--border)',
                    backgroundColor: 'var(--bg-app)',
                    outline: 'none'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Fulfillment Type Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', maxWidth: '100%' }}>
                <Truck size={16} color="var(--text-muted)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Fulfillment:</span>
                <select
                  value={selectedFulfillment}
                  onChange={(e) => setSelectedFulfillment(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    backgroundColor: '#FAFAFA',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer',
                    maxWidth: '100%'
                  }}
                >
                  <option value="all">All Models</option>
                  <option value="instant">⚡ Instant / Same-Day</option>
                  <option value="shippable">📦 Shippable</option>
                </select>
              </div>

            </div>

            {/* Category Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '4px' }}>Categories:</span>
              
              <button
                type="button"
                onClick={() => { setSelectedCategory('all'); setSelectedCuisine('all'); }}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  border: selectedCategory === 'all' ? '1.5px solid var(--primary-red)' : '1px solid var(--border)',
                  backgroundColor: selectedCategory === 'all' ? 'var(--primary-red)' : '#ffffff',
                  color: selectedCategory === 'all' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                All Stores
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('food')}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  border: selectedCategory === 'food' ? '1.5px solid var(--primary-red)' : '1px solid var(--border)',
                  backgroundColor: selectedCategory === 'food' ? 'var(--primary-red)' : '#ffffff',
                  color: selectedCategory === 'food' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🍕 Food & Restaurants
              </button>

              <button
                type="button"
                onClick={() => { setSelectedCategory('fashion'); setSelectedCuisine('all'); }}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  border: selectedCategory === 'fashion' ? '1.5px solid var(--primary-red)' : '1px solid var(--border)',
                  backgroundColor: selectedCategory === 'fashion' ? 'var(--primary-red)' : '#ffffff',
                  color: selectedCategory === 'fashion' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                👗 Fashion & Clothing
              </button>

              <button
                type="button"
                onClick={() => { setSelectedCategory('toys'); setSelectedCuisine('all'); }}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  border: selectedCategory === 'toys' ? '1.5px solid var(--primary-red)' : '1px solid var(--border)',
                  backgroundColor: selectedCategory === 'toys' ? 'var(--primary-red)' : '#ffffff',
                  color: selectedCategory === 'toys' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🧸 Toys & Candies
              </button>

              <button
                type="button"
                onClick={() => { setSelectedCategory('home'); setSelectedCuisine('all'); }}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  border: selectedCategory === 'home' ? '1.5px solid var(--primary-red)' : '1px solid var(--border)',
                  backgroundColor: selectedCategory === 'home' ? 'var(--primary-red)' : '#ffffff',
                  color: selectedCategory === 'home' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🏠 Home Goods
              </button>
            </div>

            {/* Food Cuisine Subcategory Pills */}
            {(selectedCategory === 'all' || selectedCategory === 'food') && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '12px', paddingLeft: '12px', borderLeft: '3px solid var(--accent-gold)' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#B45309' }}>Food Specialities:</span>

                <button
                  type="button"
                  onClick={() => setSelectedCuisine('all')}
                  style={{
                    padding: '3px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    border: selectedCuisine === 'all' ? '1px solid var(--accent-gold)' : '1px dashed var(--border)',
                    backgroundColor: selectedCuisine === 'all' ? '#FEF3C7' : 'transparent',
                    color: selectedCuisine === 'all' ? '#B45309' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  All Food
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedCategory('food'); setSelectedCuisine('pizza'); }}
                  style={{
                    padding: '3px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    border: selectedCuisine === 'pizza' ? '1px solid var(--accent-gold)' : '1px dashed var(--border)',
                    backgroundColor: selectedCuisine === 'pizza' ? '#FEF3C7' : 'transparent',
                    color: selectedCuisine === 'pizza' ? '#B45309' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  🍕 Pizza
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedCategory('food'); setSelectedCuisine('bakery'); }}
                  style={{
                    padding: '3px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    border: selectedCuisine === 'bakery' ? '1px solid var(--accent-gold)' : '1px dashed var(--border)',
                    backgroundColor: selectedCuisine === 'bakery' ? '#FEF3C7' : 'transparent',
                    color: selectedCuisine === 'bakery' ? '#B45309' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  🥐 Bakery & Confectionery
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedCategory('food'); setSelectedCuisine('restaurant'); }}
                  style={{
                    padding: '3px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    border: selectedCuisine === 'restaurant' ? '1px solid var(--accent-gold)' : '1px dashed var(--border)',
                    backgroundColor: selectedCuisine === 'restaurant' ? '#FEF3C7' : 'transparent',
                    color: selectedCuisine === 'restaurant' ? '#B45309' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  🍽️ Exclusive Restaurant
                </button>
              </div>
            )}

          </div>

          {loading ? (
            <div className="text-center font-mono" style={{ padding: '60px 0', color: 'var(--text-muted)' }}>
              Loading stores directory...
            </div>
          ) : filteredFoundingStores.length === 0 ? (
            <div className="card text-center" style={{ padding: '60px 24px', backgroundColor: '#ffffff', border: '1px dashed var(--border)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEF2F2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Search size={24} color="var(--primary-red)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>No Stores Match Your Search</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                We couldn't find any stores matching "{searchQuery}". Try searching for another term like "Pizza", "Bakery", or clearing your filters.
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedCuisine('all'); setSelectedFulfillment('all'); }}
                style={{ borderRadius: 'var(--radius-full)', padding: '8px 20px', fontSize: '13px' }}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '20px'
            }}>
              {filteredFoundingStores.map(founding => {
                const approvedMatch = matchFoundingStore(founding.slug, dbStores, 'approved')
                const unclaimedMatch = approvedMatch
                  ? undefined
                  : matchFoundingStore(founding.slug, dbStores, 'unclaimed')

                if (approvedMatch) {
                  return (
                    <Link 
                      key={approvedMatch.slug} 
                      href={`/store/${approvedMatch.slug}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Card style={{ 
                        height: '100%', 
                        transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s', 
                        cursor: 'pointer',
                        border: '1.5px solid var(--border)',
                        backgroundColor: '#ffffff'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.borderColor = 'var(--accent-gold)'
                        e.currentTarget.style.boxShadow = '0 10px 25px rgba(233, 39, 26, 0.08)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.borderColor = 'var(--border)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                      >
                        <CardContent style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ position: 'relative', width: '52px', height: '52px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                              <Image 
                                src={approvedMatch.logo_url} 
                                alt={approvedMatch.name} 
                                fill
                                sizes="52px"
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                            <div>
                              <h3 style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.2, color: 'var(--text-primary)' }}>{approvedMatch.name}</h3>
                              <span style={{ 
                                fontSize: '10px', 
                                fontWeight: 700, 
                                backgroundColor: 'var(--success-bg)', 
                                color: '#047857', 
                                padding: '2px 10px', 
                                borderRadius: 'var(--radius-full)',
                                marginTop: '4px',
                                display: 'inline-block',
                                letterSpacing: '0.5px'
                              }}>
                                ACTIVE
                              </span>
                            </div>
                          </div>

                          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: 1.5, flex: 1 }}>
                            {approvedMatch.description || founding.description}
                          </p>

                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            borderTop: '1px solid var(--border)', 
                            paddingTop: '14px',
                            fontSize: '12px', 
                            color: 'var(--text-muted)' 
                          }}>
                            <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>Category: {approvedMatch.category}</span>
                            <span className="font-mono" style={{ color: 'var(--primary-red)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                              Enter Store →
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                } else {
                  const logoSrc = unclaimedMatch?.logo_url || null
                  return (
                    <Card key={founding.slug} style={{ 
                      opacity: 0.8, 
                      border: '1.5px dashed var(--accent-gold)', 
                      height: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.45)',
                      position: 'relative'
                    }}>
                      <CardContent style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          {logoSrc ? (
                            <div style={{ position: 'relative', width: '52px', height: '52px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0, filter: 'grayscale(100%) opacity(0.7)' }}>
                              <Image
                                src={logoSrc}
                                alt={founding.name}
                                fill
                                sizes="52px"
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                          ) : (
                            <div style={{ 
                              width: '52px', 
                              height: '52px', 
                              borderRadius: 'var(--radius-sm)', 
                              backgroundColor: '#E5E7EB', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: '#9CA3AF',
                              fontSize: '15px',
                              flexShrink: 0
                            }}>
                              {founding.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-muted)' }}>{founding.name}</h3>
                            <span style={{ 
                              fontSize: '10px', 
                              fontWeight: 700, 
                              backgroundColor: '#FEF3C7', 
                              color: '#B45309', 
                              border: '1px solid var(--accent-gold)',
                              padding: '2px 10px', 
                              borderRadius: 'var(--radius-full)',
                              marginTop: '4px',
                              display: 'inline-block',
                              letterSpacing: '0.5px'
                            }}>
                              OPENING SOON
                            </span>
                          </div>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: 1.5, flex: 1 }}>
                          {founding.description}
                        </p>

                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          borderTop: '1px solid var(--border)', 
                          paddingTop: '14px',
                          fontSize: '12px', 
                          color: 'var(--text-muted)' 
                        }}>
                          <span style={{ textTransform: 'capitalize', fontWeight: 550 }}>Category: {founding.category}</span>
                          <span className="font-mono" style={{ fontWeight: 500 }}>Offline</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                }
              })}
            </div>
          )}
        </div>
      </main>

      <CustomerFooter />
    </>
  )
}

export default function StoreDirectoryPage() {
  return (
    <Suspense fallback={
      <div className="text-center font-mono" style={{ padding: '80px 0', color: 'var(--text-muted)' }}>
        Loading Stores...
      </div>
    }>
      <StoreDirectoryContent />
    </Suspense>
  )
}
