import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Download, RefreshCw, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: '#121417',
        color: '#FAF9F6',
        borderTop: '1px solid #23272E',
        paddingTop: '64px',
        paddingBottom: '40px',
        marginTop: '80px',
      }}
    >
      <div className="container">
        {/* Top Editorial Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
            marginBottom: '48px',
          }}
        >
          {/* Brand & Manifesto */}
          <div style={{ gridColumn: 'span 1' }}>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '8px',
                color: '#FFFFFF',
              }}
            >
              The Growth Archive
            </div>
            <p
              style={{
                fontSize: '0.86rem',
                lineHeight: 1.6,
                color: '#9CA3AF',
                marginBottom: '16px',
              }}
            >
              Field-tested digital marketing notes, tactical playbooks, operational templates, and unfiltered growth experiment post-mortems. Written by practitioners for practitioners.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', color: '#9CA3AF' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} style={{ color: '#22C55E' }} />
                Server-Authoritative Cryptographic Delivery
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={14} style={{ color: '#60A5FA' }} />
                Instant Download & Lifetime Access
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={14} style={{ color: '#F59E0B' }} />
                Free 2026 Edition Revisions
              </span>
            </div>
          </div>

          {/* Catalog Categories */}
          <div>
            <h4
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#9CA3AF',
                marginBottom: '16px',
              }}
            >
              Knowledge Catalog
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <li>
                <Link href="/store" style={{ color: '#D1D5DB', textDecoration: 'none' }}>
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/store?category=NOTES" style={{ color: '#D1D5DB', textDecoration: 'none' }}>
                  Marketing Master Notes
                </Link>
              </li>
              <li>
                <Link href="/store?category=PLAYBOOKS" style={{ color: '#D1D5DB', textDecoration: 'none' }}>
                  Tactical Playbooks
                </Link>
              </li>
              <li>
                <Link href="/store?category=GUIDES" style={{ color: '#D1D5DB', textDecoration: 'none' }}>
                  Step-by-Step Guides
                </Link>
              </li>
              <li>
                <Link href="/store?category=TEMPLATES" style={{ color: '#D1D5DB', textDecoration: 'none' }}>
                  Operational Templates & Briefs
                </Link>
              </li>
              <li>
                <Link href="/store?category=CASE_STUDIES" style={{ color: '#D1D5DB', textDecoration: 'none' }}>
                  Real Campaign Experiments
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support & Recovery */}
          <div>
            <h4
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#9CA3AF',
                marginBottom: '16px',
              }}
            >
              Customer & Downloads
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <li>
                <Link href="/purchases" style={{ color: '#D1D5DB', textDecoration: 'none' }}>
                  My Purchases / Re-Download
                </Link>
              </li>
              <li>
                <Link href="/purchases" style={{ color: '#D1D5DB', textDecoration: 'none' }}>
                  Purchase Recovery via Email
                </Link>
              </li>
              <li>
                <Link href="/contact" style={{ color: '#D1D5DB', textDecoration: 'none' }}>
                  Customer Support & Helpdesk
                </Link>
              </li>
              <li>
                <Link href="/about" style={{ color: '#D1D5DB', textDecoration: 'none' }}>
                  About the Author & Methodology
                </Link>
              </li>
              <li>
                <Link href="/admin" style={{ color: '#6B7280', textDecoration: 'none' }}>
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Licensing */}
          <div>
            <h4
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#9CA3AF',
                marginBottom: '16px',
              }}
            >
              Terms & Legal
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <li>
                <Link href="/license" style={{ color: '#D1D5DB', textDecoration: 'none' }}>
                  Single-Operator License
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" style={{ color: '#D1D5DB', textDecoration: 'none' }}>
                  Digital Product Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy" style={{ color: '#D1D5DB', textDecoration: 'none' }}>
                  Privacy & Data Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" style={{ color: '#D1D5DB', textDecoration: 'none' }}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" style={{ color: '#D1D5DB', textDecoration: 'none' }}>
                  Contact & Inquiries
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid #23272E',
            paddingTop: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            fontSize: '0.78rem',
            color: '#6B7280',
          }}
        >
          <div>
            © {new Date().getFullYear()} The Growth Archive. All rights reserved. Registered independent digital publishing brand.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Razorpay Standard Secure Checkout</span>
            <span>•</span>
            <span>Cryptographic Entitlements</span>
            <span>•</span>
            <span>INR Payments Accepted</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
