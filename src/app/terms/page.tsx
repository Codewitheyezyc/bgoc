'use client'

import CustomerHeader from '@/components/CustomerHeader'
import CustomerFooter from '@/components/CustomerFooter'

export default function TermsPage() {
  return (
    <>
      <CustomerHeader />
      <main className="main-content" style={{ minHeight: 'calc(100vh - 160px)', padding: '60px 24px', backgroundColor: 'var(--bg-app)' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '24px' }}>Terms of Service</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <p><strong>Effective Date:</strong> July 19, 2026</p>
            <p>
              Welcome to BGOC. By accessing or using our platform, you agree to comply with and be bound by the following terms of service.
            </p>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>Use of the Platform</h2>
            <p>
              BGOC allows you to browse and purchase goods from founding stores of Beverly Group. All catalog details, pricing, and availability are set directly by store managers and may change without notice.
            </p>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>Payments & Refunds</h2>
            <p>
              Transactions are completed through Paystack. Once an order is accepted and goes into preparation, it cannot be canceled. Please contact the respective store directly for quality or delivery issues.
            </p>
          </div>
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}
