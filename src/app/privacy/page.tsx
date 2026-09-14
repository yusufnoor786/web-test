import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | The Growth Archive',
  description: 'Our privacy practices, data handling, and encryption standards.',
};

export default function PrivacyPage() {
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
          Privacy & Data Protection Policy
        </h1>

        <div style={{ fontSize: '0.98rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          <p>
            At The Growth Archive, we respect your privacy and follow a principle of minimal data retention.
          </p>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '32px', marginBottom: '12px', color: 'var(--text-primary)' }}>
            Information We Collect
          </h3>
          <p>
            We only collect information strictly required to process your transaction and deliver digital products:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
            <li><strong>Email Address & Name:</strong> To record your purchase, send receipt notices, and authenticate purchase recovery.</li>
            <li><strong>Transaction Records:</strong> Payment gateway identifiers (Razorpay Order ID and Payment ID) to verify payment legitimacy. We do not store credit card numbers, CVVs, or UPI PINs on our servers.</li>
            <li><strong>Download Security Logs:</strong> IP address and User Agent recorded during token access to protect against unauthorized scraping.</li>
          </ul>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '32px', marginBottom: '12px', color: 'var(--text-primary)' }}>
            Third-Party Processors
          </h3>
          <p>
            Payment transactions are processed securely by Razorpay. All transmissions are encrypted using 256-bit SSL protocols.
          </p>
        </div>
      </div>
    </div>
  );
}
