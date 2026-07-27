'use client'

import CustomerHeader from '@/components/CustomerHeader'
import CustomerFooter from '@/components/CustomerFooter'

export default function AboutPage() {
  return (
    <>
      <CustomerHeader />

      <main className="main-content" style={{ minHeight: 'calc(100vh - 160px)', padding: '60px 24px', backgroundColor: 'var(--bg-app)' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          <span style={{ 
            color: 'var(--primary-red)', 
            fontWeight: 700, 
            fontSize: '13px', 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            display: 'inline-block',
            marginBottom: '12px'
          }}>
            Our Story
          </span>
          
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 800, 
            letterSpacing: '-0.5px', 
            color: 'var(--ink)',
            marginBottom: '24px'
          }}>
            About BGOC
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <p>
              BGOC (Beverly Group of Companies Portal) is the official digital shopping collective built to bring our founding retail, restaurant, and home goods brands together into a single, unified online platform.
            </p>

            <p>
              Instead of navigating multiple systems or disjointed interfaces, customers can browse menus, fashion catalogs, candy collections, and home essentials all under one hood. We focus on providing a direct, reliable connection to the physical stores you already know and trust.
            </p>

            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', marginTop: '16px', marginBottom: '8px' }}>
              The Beverly Group Story
            </h2>

            <p>
              Beverly Group represents a long-standing commitment to community commerce and local retail presence. From restaurant operations to home goods and toy supply, our family of brands has grown by serving customers directly on the ground.
            </p>

            <p>
              Building this platform is our next step. Rather than reinventing the stores themselves, we are digitizing their operations so that our store managers can update catalogs and manage fulfillment directly, while customers receive a unified, convenient checkout experience.
            </p>

            <p style={{ fontStyle: 'italic', borderLeft: '3px solid var(--primary-red)', paddingLeft: '16px', color: 'var(--text-primary)', margin: '12px 0' }}>
              "One trusted group, multiple local stores, delivered directly."
            </p>
          </div>

        </div>
      </main>

      <CustomerFooter />
    </>
  )
}
