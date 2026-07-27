'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import CustomerHeader from '@/components/CustomerHeader'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Clock, MapPin, ClipboardList, HelpCircle, Package, Truck, Smile } from 'lucide-react'

interface Order {
  id: string
  created_at: string
  total_amount: number
  delivery_address: string
  status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
  paystack_reference: string
  store_id: string
}

interface OrderItem {
  id: string
  quantity: number
  size_selected: string | null
  unit_price: number
  products: {
    name: string
    image_url: string
  }
}

interface Store {
  name: string
  fulfillment_type: string
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function OrderTrackingPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = use(params)
  const supabase = createClient()

  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)

  const loadOrderDetails = useCallback(async () => {
    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (orderError) throw orderError
      if (!orderData) {
        router.push('/')
        return
      }

      setOrder(orderData)

      // Fetch store fulfillment info
      const { data: storeData } = await supabase
        .from('stores')
        .select('name, fulfillment_type')
        .eq('id', orderData.store_id)
        .single()

      setStore(storeData)

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          size_selected,
          unit_price,
          products:product_id (
            name,
            image_url
          )
        `)
        .eq('order_id', id)

      if (itemsError) throw itemsError
      setOrderItems((itemsData as any) || [])

    } catch (err) {
      console.error('Error loading order tracking:', err)
    } finally {
      setLoading(false)
    }
  }, [id, supabase, router])

  useEffect(() => {
    loadOrderDetails()
  }, [loadOrderDetails])

  // Realtime subscription for status updates
  useEffect(() => {
    if (!id) return

    const channel = supabase
      .channel(`order-tracking-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log('Realtime status update payload:', payload.new)
          setOrder(payload.new as Order)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, supabase])

  if (loading) {
    return <div className="text-center mt-24">Loading order details...</div>
  }

  if (!order) {
    return null
  }

  const isInstant = store?.fulfillment_type === 'instant'

  // Determine active step index
  const getActiveStep = () => {
    switch (order.status) {
      case 'pending': return 0
      case 'preparing': return 1
      case 'ready': 
      case 'out_for_delivery': return 2
      case 'delivered': return 3
      default: return -1
    }
  }

  const activeStep = getActiveStep()

  const steps = isInstant 
    ? [
        { label: 'Order Placed', desc: 'Confirmation received.', icon: ClipboardList },
        { label: 'Preparing', desc: 'Kitchen is cooking.', icon: Clock },
        { label: 'Out for Delivery', desc: 'Courier is en route.', icon: Truck },
        { label: 'Delivered', desc: 'Enjoy your meal!', icon: Smile }
      ]
    : [
        { label: 'Order Placed', desc: 'Order is queued.', icon: ClipboardList },
        { label: 'Assembling', desc: 'Packing your goods.', icon: Package },
        { label: 'Shipped', desc: 'Parcel in transit.', icon: Truck },
        { label: 'Delivered', desc: 'Package delivered!', icon: Smile }
      ]

  return (
    <>
      <CustomerHeader />

      <main className="main-content" style={{ backgroundColor: 'var(--bg-app)', minHeight: 'calc(100vh - 64px)' }}>
        <div className="container" style={{ maxWidth: '720px', padding: '40px 0' }}>
          
          {/* Plain confirmation banner */}
          <div className="card text-center" style={{ border: '1.5px solid var(--success)', padding: '40px 24px', marginBottom: '24px' }}>
            <CheckCircle2 size={48} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ink)' }}>Your order is confirmed</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', lineHeight: 1.4 }}>
              Thank you for shopping at <strong>{store?.name}</strong>. We will notify you here as the status changes in real time.
            </p>
          </div>

          {/* Realtime Order Tracker */}
          <Card className="mb-24">
            <CardContent style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                Delivery Progress Tracker
              </h3>

              {order.status === 'cancelled' ? (
                <div className="alert alert-danger" style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: 0 }}>
                  <Smile size={18} style={{ transform: 'rotate(180deg)' }} />
                  <span>This order has been cancelled by the merchant.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
                  
                  {/* Timeline bar */}
                  <div style={{ 
                    position: 'absolute', 
                    left: '20px', 
                    top: '24px', 
                    bottom: '24px', 
                    width: '3px', 
                    backgroundColor: 'var(--border)',
                    zIndex: 0
                  }} />

                  {/* Active timeline bar progress */}
                  {activeStep > 0 && (
                    <div style={{ 
                      position: 'absolute', 
                      left: '20px', 
                      top: '24px', 
                      height: `${(activeStep / (steps.length - 1)) * 90}%`, 
                      width: '3px', 
                      backgroundColor: 'var(--success)',
                      zIndex: 1,
                      transition: 'height 0.5s ease'
                    }} />
                  )}

                  {steps.map((step, idx) => {
                    const StepIcon = step.icon
                    const isDone = idx < activeStep
                    const isActive = idx === activeStep

                    return (
                      <div key={step.label} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', zIndex: 2 }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          backgroundColor: isDone ? 'var(--success)' : isActive ? 'var(--success-bg)' : 'var(--white)',
                          border: `2px solid ${isActive || isDone ? 'var(--success)' : 'var(--border)'}`,
                          color: isDone ? 'var(--white)' : isActive ? 'var(--success)' : 'var(--text-muted)',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          transition: 'all 0.3s'
                        }}>
                          <StepIcon size={18} />
                        </div>

                        <div>
                          <h4 style={{ 
                            fontSize: '14px', 
                            fontWeight: isActive || isDone ? 700 : 500,
                            color: isActive || isDone ? 'var(--text-primary)' : 'var(--text-muted)'
                          }}>
                            {step.label} {isActive && <span className="badge badge-approved" style={{ fontSize: '9px', marginLeft: '8px' }}>ACTIVE</span>}
                          </h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>{step.desc}</p>
                        </div>
                      </div>
                    )
                  })}

                </div>
              )}
            </CardContent>
          </Card>

          {/* Details Card */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            
            <Card>
              <CardContent style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Order Specifications</h4>
                
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Order ID</td>
                      <td className="font-mono" style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{order.id.substring(0, 8).toUpperCase()}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Transaction Reference</td>
                      <td className="font-mono" style={{ padding: '8px 0', textAlign: 'right', fontSize: '11px', color: 'var(--text-secondary)' }}>{order.paystack_reference}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Order Date</td>
                      <td className="font-mono" style={{ padding: '8px 0', textAlign: 'right' }}>{new Date(order.created_at).toLocaleString()}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Delivery Destination</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--text-primary)' }}>{order.delivery_address}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Delivery Window</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{isInstant ? '25-45 minutes' : '1-3 business days'}</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardContent style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Receipt Summary
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                  {orderItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <div>
                        <strong>{item.products?.name}</strong>
                        {item.size_selected && <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '8px' }}>({item.size_selected})</span>}
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Qty: {item.quantity} × ₦{item.unit_price.toLocaleString()}</div>
                      </div>
                      <span className="font-mono">₦{(item.unit_price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>Paid Total</span>
                  <span className="font-mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-red)' }}>
                    ₦{order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>
      </main>
    </>
  )
}
