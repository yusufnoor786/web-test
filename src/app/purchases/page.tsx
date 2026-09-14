'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, KeyRound, Download, CheckCircle2, AlertCircle, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';

interface RecoveredDownload {
  id: string;
  productId: string;
  title: string;
  category: string;
  format: string;
  downloadCount: number;
  maxDownloads: number;
  downloadUrl: string;
}

interface RecoveredOrder {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  downloads: RecoveredDownload[];
}

function PurchasesContent() {
  const searchParams = useSearchParams();
  const urlEmail = searchParams.get('email') || '';
  const urlToken = searchParams.get('token') || '';

  const [step, setStep] = useState<'request' | 'verify' | 'dashboard'>('request');
  const [email, setEmail] = useState(urlEmail);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  const [customer, setCustomer] = useState<{ email: string; name?: string } | null>(null);
  const [orders, setOrders] = useState<RecoveredOrder[]>([]);

  // If email and token exist in URL (magic direct link), verify immediately
  useEffect(() => {
    if (urlEmail && urlToken) {
      handleVerifyToken(urlEmail, urlToken);
    }
  }, [urlEmail, urlToken]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessInfo('');
    setDebugOtp(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/purchases/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Recovery request failed');
      }

      setStep('verify');
      setSuccessInfo('If an account with verified purchases exists, a secure verification code was sent.');
      if (data.debugOtp) {
        setDebugOtp(data.debugOtp);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending recovery code';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyToken = async (targetEmail: string, tokenString: string) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/purchases/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail.trim().toLowerCase(),
          codeOrToken: tokenString.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setCustomer(data.customer);
      setOrders(data.orders || []);
      setStep('dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid code or recovery token';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    handleVerifyToken(email, code);
  };

  return (
    <div style={{ paddingTop: '60px', paddingBottom: '96px' }}>
      <div className="container-narrow">
        {/* Step 1 & 2: Authentication */}
        {step !== 'dashboard' && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-main)',
              borderRadius: '6px',
              padding: '48px 36px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ textAlign: 'center', maxWidth: '460px', margin: '0 auto 32px auto' }}>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '12px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  marginBottom: '14px',
                }}
              >
                <KeyRound size={28} />
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '8px' }}>
                Purchase Access & Recovery
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
                Access all digital products, notes, playbooks, and templates associated with your purchase email address.
              </p>
            </div>

            {errorMessage && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '4px',
                  color: 'var(--status-error)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {successInfo && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '4px',
                  color: '#166534',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                }}
              >
                <CheckCircle2 size={16} />
                <span>{successInfo}</span>
              </div>
            )}

            {/* Debug OTP Banner in development mode */}
            {debugOtp && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  borderRadius: '4px',
                  color: '#92400E',
                  fontSize: '0.82rem',
                  marginBottom: '20px',
                }}
              >
                <strong>Local Verification Code:</strong> {debugOtp}
              </div>
            )}

            {step === 'request' ? (
              <form onSubmit={handleRequestOtp} style={{ maxWidth: '420px', margin: '0 auto' }}>
                <div className="input-group">
                  <label htmlFor="recovery-email" className="input-label">
                    Purchase Email Address
                  </label>
                  <input
                    id="recovery-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="alex.growth@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Enter the email you used when purchasing your products.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  {isLoading ? 'Checking Purchases...' : 'Send Secure Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleManualVerify} style={{ maxWidth: '420px', margin: '0 auto' }}>
                <div className="input-group">
                  <label htmlFor="recovery-code" className="input-label">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    id="recovery-code"
                    type="text"
                    required
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="input-field"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.25rem',
                      letterSpacing: '0.2em',
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Verification code sent to {email}.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  {isLoading ? 'Verifying...' : 'Unlock My Purchases'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('request');
                      setErrorMessage('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    Use a different email address
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Step 3: Verified Customer Purchases Dashboard */}
        {step === 'dashboard' && customer && (
          <div>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-main)',
                paddingBottom: '24px',
                marginBottom: '36px',
                gap: '16px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                  }}
                >
                  Verified Purchases
                </span>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', marginTop: '4px', marginBottom: '4px' }}>
                  Your Digital Library
                </h1>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Logged in as <strong>{customer.email}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Link href="/store" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                  Explore More Products →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setStep('request');
                    setCustomer(null);
                    setOrders([]);
                  }}
                  className="btn btn-outline btn-sm"
                >
                  Log Out
                </button>
              </div>
            </div>

            {/* Orders list */}
            {orders.length === 0 ? (
              <div
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  borderRadius: '6px',
                }}
              >
                <BookOpen size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
                <h3>No Purchases Found</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                  No completed orders were found for this email address.
                </p>
                <Link href="/store" className="btn btn-primary btn-sm">
                  Browse the Library →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-main)',
                      borderRadius: '6px',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Order header */}
                    <div
                      style={{
                        padding: '16px 24px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '0.84rem',
                      }}
                    >
                      <div>
                        <strong>Order #{ord.orderNumber}</strong> · Placed on{' '}
                        {new Date(ord.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        Paid: ₹{ord.total}
                      </div>
                    </div>

                    {/* Download items */}
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {ord.downloads.map((dl) => (
                        <div
                          key={dl.id}
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
                              <div style={{ fontWeight: 600, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                                {dl.title}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {dl.format} · {dl.downloadCount} of {dl.maxDownloads} downloads used
                              </div>
                            </div>
                          </div>

                          <a
                            href={dl.downloadUrl}
                            download
                            className="btn btn-primary btn-sm"
                            style={{ textDecoration: 'none' }}
                          >
                            <Download size={14} />
                            <span>Download Fresh Copy</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PurchasesPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>Loading purchases...</div>}>
      <PurchasesContent />
    </Suspense>
  );
}
