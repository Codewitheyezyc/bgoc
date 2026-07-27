export interface CartItem {
  id: string
  name: string
  price: number
  image_url: string
  quantity: number
  size_selected?: string | null
  store_id: string
  store_name: string
  fulfillment_type: string
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem('bgoc_cart')
  return data ? JSON.parse(data) : []
}

export function saveCart(cart: CartItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem('bgoc_cart', JSON.stringify(cart))
}

export function addToCart(item: CartItem): { success: boolean; error?: string } {
  const cart = getCart()
  
  // Enforce single-store cart rule
  if (cart.length > 0 && cart[0].store_id !== item.store_id) {
    return {
      success: false,
      error: `Finish this order first, or clear your cart, to shop at ${item.store_name}.`
    }
  }
  
  const existing = cart.find(i => i.id === item.id && i.size_selected === item.size_selected)
  if (existing) {
    existing.quantity += item.quantity
  } else {
    cart.push(item)
  }
  
  saveCart(cart)
  
  // Custom event to notify other components of cart changes
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bgoc_cart_updated'))
  }
  
  return { success: true }
}

export function updateCartQuantity(id: string, size_selected: string | null | undefined, delta: number) {
  const cart = getCart()
  const item = cart.find(i => i.id === id && i.size_selected === size_selected)
  if (item) {
    item.quantity += delta
    if (item.quantity <= 0) {
      const idx = cart.indexOf(item)
      cart.splice(idx, 1)
    }
    saveCart(cart)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('bgoc_cart_updated'))
    }
  }
}

export function removeFromCart(id: string, size_selected: string | null | undefined) {
  const cart = getCart()
  const filtered = cart.filter(i => !(i.id === id && i.size_selected === size_selected))
  saveCart(filtered)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bgoc_cart_updated'))
  }
}

export function clearCart() {
  saveCart([])
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bgoc_cart_updated'))
  }
}

export function getCartSubtotal(): number {
  return getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0)
}
