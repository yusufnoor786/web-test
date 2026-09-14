'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Download, ShieldCheck, Mail, ArrowRight, BookOpen } from 'lucide-react';

interface DownloadTokenItem {
  productId: string;
  productTitle: string;
  downloadUrl: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || 'ORD-COMPLETED';
  const tokensParam = searchParams.get('tokens');

  let downloadTokens: DownloadTokenItem[] = [];
  try {
    if (tokensParam) {
      downloadTokens = JSON.parse(decodeURIComponent(tokensParam));
    }
  } catch (e) {
    console.error('Failed to parse download tokens:', e);
  }

  return (
    <div style={{ paddingTop: '60px', paddingBottom: '96px' }}>
      <div className="container-narrow">
        {/* Success Banner */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-main)',
            borderRadius: '6px',
            padding: '48px 36px',
            textAlign: 'center',
            marginBottom: '36px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              padding: '12px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-forest-bg)',
              color: 'var(--status-success)',
              marginBottom: '16px',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <span
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--text-muted)',
              marginBottom: '6px',
            }}
          >
            Payment Verified · Order #{orderNumber}
          </span>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.2rem',
              marginBottom: '12px',
              color: 'var(--text-primary)',
            }}
          >
            Your Digital Products Are Ready
          </h1>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              maxWidth: '520px',
              margin: '0 auto 24px auto',
              lineHeight: 1.6,
            }}
          >
            Thank you for your purchase. Your server-verified payment has been completed. You can download your files immediately below.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: '4px',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
            }}
          >
            <Mail size={15} style={{ color: 'var(--text-muted)' }} />
            <span>A copy of your receipt and backup download access has been emailed to you.</span>
          </div>
        </div>

        {/* Download Items Box */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-main)',
            borderRadius: '6px',
            padding: '32px',
            marginBottom: '36px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '14px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-serif)' }}>
              Download Files
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Single-Operator License
            </span>
          </div>

          {downloadTokens.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                Your order is confirmed. If your download links do not appear automatically, you can access them anytime from My Purchases.
              </p>
              <Link href="/purchases" className="btn btn-primary btn-sm">
                Go to My Purchases Portal →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {downloadTokens.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    backgroundColor: '#FCFAF7',
                    border: '1px solid var(--border-main)',
                    borderRadius: '4px',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        padding: '10px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {item.productTitle}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Encrypted token access · 5 downloads permitted
                      </div>
                    </div>
                  </div>

                  <a
                    href={item.downloadUrl}
                    download
                    className="btn btn-primary btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    <Download size={14} />
                    <span>Download File</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post-Purchase Support & Re-access Guide */}
        <div
          style={{
            padding: '24px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-main)',
            borderRadius: '6px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>Need to re-download in the future?</h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Visit <strong>/purchases</strong> anytime with your email address to generate fresh download tokens.
            </p>
          </div>
          <Link href="/store" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
            <span>Continue to Store</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>Loading confirmation...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
