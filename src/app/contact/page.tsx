'use client'

import CustomerHeader from '@/components/CustomerHeader'
import CustomerFooter from '@/components/CustomerFooter'
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react'

export default function ContactPage() {
  return (
    <>
      <CustomerHeader />

      <main className="main-content" style={{ minHeight: 'calc(100vh - 160px)', padding: '80px 24px', backgroundColor: 'var(--bg-app)', position: 'relative' }}>
        {/* Subtle decorative grid background */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.1,
          pointerEvents: 'none'
        }} />

        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          
          {/* Header Banner */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
              marginBottom: '16px'
            }}>
              Support & Inquiries
            </div>
            <h1 style={{ 
              fontSize: '36px', 
              fontWeight: 800, 
              letterSpacing: '-1px', 
              color: 'var(--ink)',
              marginBottom: '12px'
            }}>
              Get in Touch with Us
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '500px', margin: '0 auto', lineHeight: 1.5 }}>
              Have questions about an order, store registration, or payments? Our team is ready to assist.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
            
            {/* Direct Contact Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Card 1: Office Address */}
              <div className="card" style={{ 
                padding: '24px', 
                border: '1.5px solid var(--border)', 
                borderLeft: '4px solid var(--primary-red)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#ffffff',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #FEF2F2 0%, #FEF3C7 100%)', color: 'var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--accent-gold)', flexShrink: 0 }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>Office Address</h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    Beverly Group Offices<br />
                    Pinnacle Mall, Asese<br />
                    Along Lagos-Ibadan Expressway,<br />
                    Ogun State, Nigeria
                  </p>
                </div>
              </div>

              {/* Card 2: Phone Support */}
              <div className="card" style={{ 
                padding: '24px', 
                border: '1.5px solid var(--border)', 
                borderLeft: '4px solid var(--accent-gold)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#ffffff',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #FEF2F2 0%, #FEF3C7 100%)', color: 'var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--accent-gold)', flexShrink: 0 }}>
                  <Phone size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>Phone Support</h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>+234 (0) 800 BEVERLY</span><br />
                    +234 (0) 812 345 6789
                  </p>
                </div>
              </div>

              {/* Card 3: Email Address */}
              <div className="card" style={{ 
                padding: '24px', 
                border: '1.5px solid var(--border)', 
                borderLeft: '4px solid var(--primary-red)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#ffffff',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #FEF2F2 0%, #FEF3C7 100%)', color: 'var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--accent-gold)', flexShrink: 0 }}>
                  <Mail size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>Email Address</h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>support@beverlygroup.co</span><br />
                    info@beverlygroup.co
                  </p>
                </div>
              </div>

              {/* Card 4: Fulfillment Hours */}
              <div className="card" style={{ 
                padding: '24px', 
                border: '1.5px solid var(--border)', 
                borderLeft: '4px solid var(--accent-gold)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#ffffff',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #FEF2F2 0%, #FEF3C7 100%)', color: 'var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--accent-gold)', flexShrink: 0 }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>Fulfillment Hours</h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    Monday – Saturday: 8:00 AM – 8:00 PM<br />
                    Sunday: 10:00 AM – 6:00 PM
                  </p>
                </div>
              </div>

            </div>

            {/* Premium Contact Form */}
            <div className="card" style={{ 
              border: '2px solid var(--accent-gold)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '36px',
              backgroundColor: '#ffffff',
              boxShadow: '0 8px 32px rgba(251, 192, 45, 0.05)',
              position: 'relative'
            }}>
              {/* Gold Top Highlight Block */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '24px',
                right: '24px',
                height: '3px',
                backgroundColor: 'var(--primary-red)',
                borderRadius: '0 0 2px 2px'
              }} />

              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px', color: 'var(--ink)' }}>Send a Message</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Fill in the details below, and our support agents will respond shortly.</p>
              
              <form onSubmit={(e) => { e.preventDefault(); alert('Message sent! Our support team will get back to you shortly.'); e.currentTarget.reset(); }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</label>
                  <input type="text" className="form-control" placeholder="e.g. John Doe" required style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }} />
                </div>
                
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
                  <input type="email" className="form-control" placeholder="e.g. john@example.com" required style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }} />
                </div>
                
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Message</label>
                  <textarea className="form-control" style={{ minHeight: '120px', resize: 'vertical', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', lineHeight: 1.5 }} placeholder="How can we help you today?" required />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ 
                    width: '100%', 
                    padding: '12px 24px', 
                    fontSize: '14px', 
                    borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, var(--primary-red) 0%, #D11E13 100%)',
                    border: '1.5px solid var(--accent-gold)',
                    boxShadow: '0 4px 12px rgba(233, 39, 26, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(233, 39, 26, 0.35)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(233, 39, 26, 0.25)'
                  }}
                >
                  Submit Inquiry <Send size={14} />
                </button>
              </form>
            </div>

          </div>

        </div>
      </main>

      <CustomerFooter />
    </>
  )
}
