import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | The Growth Archive',
  description: 'Terms and conditions governing the purchase and access of digital products on The Growth Archive.',
};

export default function TermsPage() {
  return (
    <div style={{ paddingTop: '56px', paddingBottom: '96px' }}>
      <div className="container-text">
        <span
          style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
          }}
        >
          Legal
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 3.5vw, 2.6rem)',
            marginTop: '6px',
            marginBottom: '24px',
          }}
        >
          Terms of Service
        </h1>

        <div style={{ fontSize: '0.98rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          <p>
            By accessing or purchasing from The Growth Archive (&quot;we&quot;, &quot;us&quot;, &quot;the website&quot;), you agree to be bound by these Terms of Service.
          </p>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '32px', marginBottom: '12px', color: 'var(--text-primary)' }}>
            1. Commercial Terms
          </h3>
          <p>
            All prices listed on the store are denominated in Indian Rupees (INR) unless explicitly stated otherwise. We reserve the right to alter pricing, bundle compositions, and promotional discounts at any time without prior notice.
          </p>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '32px', marginBottom: '12px', color: 'var(--text-primary)' }}>
            2. Intellectual Property
          </h3>
          <p>
            All text, frameworks, charts, layouts, and digital publications available on this platform are the exclusive intellectual property of The Growth Archive. Purchases grant a personal use license and do not transfer copyright or ownership.
          </p>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '32px', marginBottom: '12px', color: 'var(--text-primary)' }}>
            3. Disclaimer of Marketing Guarantees
          </h3>
          <p>
            While our products reflect verifiable methodologies and live campaign experiments, individual advertising outcomes depend on factors beyond our control (such as product-market fit, unit economics, landing page speed, and auction fluctuations). We do not guarantee specific monetary earnings or return on ad spend.
          </p>
        </div>
      </div>
    </div>
  );
}
