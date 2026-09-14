import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund & Delivery Policy | The Growth Archive',
  description: 'Our transparent refund and instant digital delivery policy for digital marketing products.',
};

export default function RefundPolicyPage() {
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
          Customer Terms
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 3.5vw, 2.6rem)',
            marginTop: '6px',
            marginBottom: '24px',
          }}
        >
          Digital Products Refund & Delivery Policy
        </h1>

        <div style={{ fontSize: '0.98rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          <p>
            Last Updated: January 2026
          </p>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '32px', marginBottom: '12px', color: 'var(--text-primary)' }}>
            1. Nature of Digital Knowledge Products
          </h3>
          <p>
            All products offered on <strong>The Growth Archive</strong> (including Notes, Guides, Playbooks, Templates, and Case Studies) are non-tangible, irrevocable digital goods delivered immediately upon completed server payment verification.
          </p>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '32px', marginBottom: '12px', color: 'var(--text-primary)' }}>
            2. Instant Delivery Process
          </h3>
          <p>
            Upon successful payment via Razorpay, our backend server automatically verifies the cryptographic signature and creates a secure 256-bit download entitlement. You are immediately provided with download links on the order confirmation screen, and a transactional backup receipt is delivered to your designated email address.
          </p>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '32px', marginBottom: '12px', color: 'var(--text-primary)' }}>
            3. Refund Eligibility
          </h3>
          <p>
            Because digital files can be saved immediately to local storage upon delivery, <strong>all sales are final</strong>. We do not offer buyer’s remorse refunds, changes of mind, or refunds resulting from lack of implementation.
          </p>
          <p>
            We provide comprehensive multi-page sample previews, full chapter breakdowns, and detailed specifications on each product page so you can verify the suitability and quality of every dossier before completing purchase.
          </p>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '32px', marginBottom: '12px', color: 'var(--text-primary)' }}>
            4. Exceptions: Technical Defects & Duplicate Charges
          </h3>
          <p>
            We stand firmly behind the integrity of our files. We will gladly issue an immediate refund or replacement under the following conditions:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li>
              <strong>Corrupt or Unopenable File:</strong> If a downloaded file is corrupted and our support team cannot provide a working binary within 24 hours of notice.
            </li>
            <li>
              <strong>Duplicate Billing:</strong> If an unintended network glitch or browser retry results in multiple charges for the exact same order, all duplicate charges will be refunded immediately.
            </li>
          </ul>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '32px', marginBottom: '12px', color: 'var(--text-primary)' }}>
            5. Contact for Support
          </h3>
          <p>
            For any billing inquiries, download troubleshooting, or technical questions, please contact our desk at{' '}
            <Link href="/contact" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>
              support via our Contact Page
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
