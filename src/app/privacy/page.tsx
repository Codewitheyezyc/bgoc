'use client'

import CustomerHeader from '@/components/CustomerHeader'
import CustomerFooter from '@/components/CustomerFooter'

export default function PrivacyPage() {
  return (
    <>
      <CustomerHeader />
      <main className="main-content" style={{ minHeight: 'calc(100vh - 160px)', padding: '60px 24px', backgroundColor: 'var(--bg-app)' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '24px' }}>Privacy Policy</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <p><strong>Effective Date:</strong> July 19, 2026</p>
            <p>
              Beverly Group of Companies operates the BGOC platform. We respect your privacy and are committed to protecting any personal information you provide when using our storefront.
            </p>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>Information We Collect</h2>
            <p>
              When you place an order, we collect details necessary to process payment and complete delivery: your name, delivery address, phone number, and email address. Payment details are handled securely by Paystack.
            </p>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>How We Use Information</h2>
            <p>
              We use your information strictly to process transactions, share order status updates via email/SMS, and coordinate fulfillment with our delivery drivers and store managers.
            </p>
          </div>
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}
