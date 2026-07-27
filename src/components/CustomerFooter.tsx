import Link from 'next/link'
import Image from 'next/image'

export default function CustomerFooter() {
  return (
    <footer style={{ backgroundColor: '#0F172A', color: '#94A3B8', borderTop: '1px solid #1E293B', padding: '60px 24px 28px', marginTop: 'auto' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Main 4-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px', marginBottom: '48px' }}>
          
          {/* Column 1: Brand & Blurb */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <Image 
                src="/logo.png" 
                alt="BGOC Logo" 
                width={40} 
                height={40} 
                style={{ objectFit: 'contain' }} 
              />
              <span className="font-sans" style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
                Beverly Group
              </span>
            </Link>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6, maxWidth: '280px', margin: 0 }}>
              One unified marketplace bringing together all approved founding brands of the Beverly Group of Companies with express delivery &amp; single checkout.
            </p>
          </div>

          {/* Column 2: Information */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Information
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <Link href="/about" style={{ fontSize: '13px', color: '#CBD5E1', textDecoration: 'none' }}>About BGOC</Link>
              </li>
              <li>
                <Link href="/store" style={{ fontSize: '13px', color: '#CBD5E1', textDecoration: 'none' }}>Delivery &amp; Fulfillment</Link>
              </li>
              <li>
                <Link href="/privacy" style={{ fontSize: '13px', color: '#CBD5E1', textDecoration: 'none' }}>Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" style={{ fontSize: '13px', color: '#CBD5E1', textDecoration: 'none' }}>Terms of Service</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <Link href="/store" style={{ fontSize: '13px', color: '#CBD5E1', textDecoration: 'none' }}>Shop Stores</Link>
              </li>
              <li>
                <Link href="/register" style={{ fontSize: '13px', color: '#CBD5E1', textDecoration: 'none' }}>Register Your Store</Link>
              </li>
              <li>
                <Link href="/order" style={{ fontSize: '13px', color: '#CBD5E1', textDecoration: 'none' }}>Track an Order</Link>
              </li>
              <li>
                <Link href="/contact" style={{ fontSize: '13px', color: '#CBD5E1', textDecoration: 'none' }}>Contact &amp; Support</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Location */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Headquarters
            </h4>
            <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
              Beverly Group Offices<br />
              Pinnacle Mall, Asese<br />
              Ogun State, Nigeria
            </p>
            <div style={{ marginTop: '14px' }}>
              <Link href="/contact" style={{ fontSize: '13px', color: '#FBC02D', textDecoration: 'none', fontWeight: 700 }}>
                Get Full Address &amp; Directions →
              </Link>
            </div>
          </div>

        </div>

        {/* Payment Badges & Trust Strip */}
        <div style={{ borderTop: '1px solid #1E293B', borderBottom: '1px solid #1E293B', padding: '20px 0', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Secured Payments by Paystack:
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#1E293B', color: '#E2E8F0', padding: '4px 12px', borderRadius: '4px', border: '1px solid #334155' }}>
              🔒 Paystack
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#1E293B', color: '#E2E8F0', padding: '4px 12px', borderRadius: '4px', border: '1px solid #334155' }}>
              💳 VISA
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#1E293B', color: '#E2E8F0', padding: '4px 12px', borderRadius: '4px', border: '1px solid #334155' }}>
              💳 Mastercard
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#1E293B', color: '#E2E8F0', padding: '4px 12px', borderRadius: '4px', border: '1px solid #334155' }}>
              💳 Verve
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#1E293B', color: '#E2E8F0', padding: '4px 12px', borderRadius: '4px', border: '1px solid #334155' }}>
              ⚡ Bank Transfer
            </span>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            &copy; {new Date().getFullYear()} Beverly Group of Companies. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/privacy" style={{ fontSize: '12px', color: '#64748B', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/terms" style={{ fontSize: '12px', color: '#64748B', textDecoration: 'none' }}>Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
