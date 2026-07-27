'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Plus, Minus, Trash2, LayoutDashboard, Menu, Search, X, ArrowRight, Store } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { getCart, updateCartQuantity, removeFromCart, getCartSubtotal, clearCart, CartItem } from '@/lib/cart'
import Image from 'next/image'

export default function CustomerHeader() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [subtotal, setSubtotal] = useState(0)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Search Overlay State
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const loadCart = () => {
    setCartItems(getCart())
    setSubtotal(getCartSubtotal())
  }

  useEffect(() => {
    setIsMounted(true)
    loadCart()
    window.addEventListener('bgoc_cart_updated', loadCart)
    return () => {
      window.removeEventListener('bgoc_cart_updated', loadCart)
    }
  }, [])

  // Auto focus search input when search modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isSearchOpen])

  // Handle ESC key press to close search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchOpen])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const q = searchQuery.trim()
      setIsSearchOpen(false)
      setSearchQuery('')
      router.push(`/store?q=${encodeURIComponent(q)}`)
    } else {
      setIsSearchOpen(false)
      router.push('/store')
    }
  }

  const handleQuickTagClick = (tag: string) => {
    setIsSearchOpen(false)
    setSearchQuery('')
    router.push(`/store?q=${encodeURIComponent(tag)}`)
  }

  const handleQtyChange = (id: string, size: string | null | undefined, delta: number) => {
    updateCartQuantity(id, size, delta)
  }

  const handleRemove = (id: string, size: string | null | undefined) => {
    removeFromCart(id, size)
  }

  const handleClear = () => {
    clearCart()
  }

  const handleCheckoutClick = () => {
    setIsSheetOpen(false)
    router.push('/checkout')
  }

  const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
      <header className="platform-header" style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1.5px solid var(--border)', padding: '12px 0', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '48px' }}>
          
          {/* Left Section: Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Image 
                src="/logo.png" 
                alt="BGOC Logo" 
                width={36} 
                height={36} 
                style={{ objectFit: 'contain' }}
                priority
              />
              <span className="font-sans desktop-only" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Beverly Group
              </span>
            </Link>
          </div>

          {/* Center Section: Clean Uncluttered Navigation Links */}
          <nav className="desktop-only" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <Link href="/" className="hover:text-red-600 transition-colors" style={{ fontSize: '14px', fontWeight: 650, color: 'var(--text-primary)', textDecoration: 'none' }}>Home</Link>
            <Link href="/store" className="hover:text-red-600 transition-colors" style={{ fontSize: '14px', fontWeight: 650, color: 'var(--text-primary)', textDecoration: 'none' }}>Stores</Link>
            <Link href="/about" className="hover:text-red-600 transition-colors" style={{ fontSize: '14px', fontWeight: 650, color: 'var(--text-primary)', textDecoration: 'none' }}>About BGOC</Link>
            <Link href="/contact" className="hover:text-red-600 transition-colors" style={{ fontSize: '14px', fontWeight: 650, color: 'var(--text-primary)', textDecoration: 'none' }}>Contact &amp; Support</Link>
            <Link href="/register" className="hover:text-red-600 transition-colors" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none' }}>Register your store</Link>
          </nav>

          {/* Right Section: Pop-out Search Trigger, Shop Now Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            
            {/* Pop-Out Search Button Trigger */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '1.5px solid var(--border)',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                transition: 'all 0.2s'
              }}
              title="Search Stores & Products (Click to open)"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FEF2F2'
                e.currentTarget.style.borderColor = 'var(--primary-red)'
                e.currentTarget.style.color = 'var(--primary-red)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC'
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
            >
              <Search size={18} />
            </button>

            {/* Shop Now Primary Button */}
            <Link 
              href="/store"
              className="desktop-only"
              style={{
                padding: '8px 18px',
                fontSize: '13.5px',
                fontWeight: 700,
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#E9271A',
                color: '#ffffff',
                border: '1.5px solid var(--accent-gold)',
                boxShadow: '0 2px 8px rgba(233, 39, 26, 0.25)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(233, 39, 26, 0.35)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(233, 39, 26, 0.25)'
              }}
            >
              Shop Now
            </Link>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-only"
              style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer' }}
            >
              <Menu size={24} />
            </button>
          </div>

        </div>
      </header>

      {/* Floating Circular Cart Button (Fixed at Window Bottom-Right Corner) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger 
          style={{ 
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: '#111827',
            color: '#ffffff',
            border: '2px solid var(--accent-gold)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, boxShadow 0.2s'
          }}
          className="hover:scale-105"
          title="View Shopping Cart"
        >
          <ShoppingCart size={19} color="#ffffff" />
          {isMounted && totalQty > 0 && (
            <span 
              className="font-mono"
              style={{ 
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                backgroundColor: 'var(--primary-red)', 
                color: '#ffffff', 
                fontWeight: 800, 
                fontSize: '10px', 
                borderRadius: '50%', 
                width: '19px', 
                height: '19px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                lineHeight: 1,
                border: '2px solid #ffffff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}
            >
              {totalQty}
            </span>
          )}
        </SheetTrigger>

        <SheetContent side="right" style={{ width: '100%', maxWidth: '420px', padding: 0, borderLeft: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <SheetHeader style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
              <SheetTitle style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={20} color="var(--primary-red)" /> Your Shopping Cart ({totalQty})
              </SheetTitle>
            </SheetHeader>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {cartItems.length === 0 ? (
                <div className="text-center" style={{ padding: '60px 0', color: 'var(--text-muted)' }}>
                  <ShoppingCart size={48} color="var(--border)" style={{ margin: '0 auto 16px', display: 'block' }} />
                  <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-secondary)' }}>Your cart is empty.</p>
                  <p style={{ fontSize: '13px', marginTop: '4px' }}>Browse our stores to add items to your cart.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {cartItems.map((item, idx) => (
                    <div key={`${item.id}-${item.size_selected || idx}`} style={{ display: 'flex', gap: '12px', padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: '#ffffff' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#F1F5F9', flexShrink: 0, position: 'relative' }}>
                        <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{item.name}</h4>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                            Store: <strong>{item.store_name}</strong>
                          </span>
                          {item.size_selected && (
                            <span style={{ fontSize: '11px', color: 'var(--primary-red)', fontWeight: 600 }}>Option: {item.size_selected}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                          <span className="font-mono" style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--primary-red)' }}>
                            ₦{(item.price * item.quantity).toLocaleString()}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button onClick={() => handleQtyChange(item.id, item.size_selected, -1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--border)', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Minus size={12} /></button>
                            <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                            <button onClick={() => handleQtyChange(item.id, item.size_selected, 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--border)', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Plus size={12} /></button>
                            <button onClick={() => handleRemove(item.id, item.size_selected)} style={{ marginLeft: '6px', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }} title="Remove item"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div style={{ padding: '20px', borderTop: '1px solid var(--border)', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Subtotal</span>
                  <span className="font-mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-red)' }}>
                    ₦{subtotal.toLocaleString()}
                  </span>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={handleCheckoutClick}
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-full)', backgroundColor: '#E9271A', fontSize: '14px', fontWeight: 700, border: '1px solid var(--accent-gold)' }}
                >
                  Proceed to Checkout →
                </button>
                <button 
                  onClick={handleClear}
                  style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}
                >
                  Clear Cart
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Menu Drawer Overlay */}
      {isMounted && isMobileMenuOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            style={{
              width: '80%',
              maxWidth: '320px',
              height: '100%',
              backgroundColor: '#ffffff',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Image src="/logo.png" alt="BGOC Logo" width={30} height={30} style={{ objectFit: 'contain' }} />
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>Beverly Group</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>Home</Link>
                <Link href="/store" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>Stores</Link>
                <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>About BGOC</Link>
                <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>Contact &amp; Support</Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>Register Your Store</Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none', padding: '8px 0' }}>Merchant Portal</Link>
              </nav>
            </div>

            <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <Link 
                href="/store" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-full)', backgroundColor: '#E9271A', fontSize: '14px', fontWeight: 700, border: '1px solid var(--accent-gold)', textAlign: 'center', textDecoration: 'none', display: 'block' }}
              >
                Shop Now →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         POP-OUT FULLSCREEN SEARCH OVERLAY (Blurred background backdrop)
         ========================================================================= */}
      {isMounted && isSearchOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '80px 24px 24px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setIsSearchOpen(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '680px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1px solid var(--border)',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
              title="Close search (Esc)"
            >
              <X size={18} />
            </button>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-red)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                Beverly Group Marketplace Search
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)' }}>
                What are you looking for?
              </h3>
            </div>

            {/* Pop-Out Search Input Form */}
            <form onSubmit={handleSearchSubmit}>
              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <Search size={22} color="var(--primary-red)" style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search stores, pizza, bakery, toys, fashion..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px 120px 16px 54px',
                    fontSize: '16px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-full)',
                    border: '2px solid var(--accent-gold)',
                    backgroundColor: '#FAFAFA',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    boxShadow: '0 4px 14px rgba(251, 192, 45, 0.15)'
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderRadius: 'var(--radius-full)',
                    padding: '10px 24px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    backgroundColor: '#E9271A',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Search <ArrowRight size={15} />
                </button>
              </div>
            </form>

            {/* Popular Search Tags */}
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>
                Popular Searches:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button type="button" onClick={() => handleQuickTagClick('pizza')} style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--accent-gold)', backgroundColor: '#FEF3C7', color: '#B45309', fontSize: '12.5px', fontWeight: 650, cursor: 'pointer' }}>🍕 Yurmealicious Pizza</button>
                <button type="button" onClick={() => handleQuickTagClick('bakery')} style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--accent-gold)', backgroundColor: '#FFFBEB', color: '#B45309', fontSize: '12.5px', fontWeight: 650, cursor: 'pointer' }}>🥐 Beverly Bakeries</button>
                <button type="button" onClick={() => handleQuickTagClick('toys')} style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--accent-gold)', backgroundColor: '#FDE8E8', color: '#991B1B', fontSize: '12.5px', fontWeight: 650, cursor: 'pointer' }}>🧸 Toys in CandiLand</button>
                <button type="button" onClick={() => handleQuickTagClick('fashion')} style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--accent-gold)', backgroundColor: '#F3E8FF', color: '#6B21A8', fontSize: '12.5px', fontWeight: 650, cursor: 'pointer' }}>👗 Celebrity Styles</button>
                <button type="button" onClick={() => handleQuickTagClick('home')} style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--accent-gold)', backgroundColor: '#F0FDF4', color: '#166534', fontSize: '12.5px', fontWeight: 650, cursor: 'pointer' }}>🏠 Homeworld Supermarket</button>
              </div>
            </div>

            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Press <kbd style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', fontSize: '11px', fontWeight: 700 }}>ESC</kbd> or click outside to exit</span>
              <Link href="/register" onClick={() => setIsSearchOpen(false)} style={{ color: 'var(--primary-red)', textDecoration: 'underline', fontWeight: 600 }}>
                Merchant Registration →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
