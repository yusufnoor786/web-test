'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  KeyRound,
  Download,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ShieldCheck,
  Ban,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  LogOut,
  RefreshCw,
} from 'lucide-react';

interface LibraryItem {
  entitlementId: string;
  productId: string;
  title: string;
  tagline: string;
  category: string;
  format: string;
  fileSize: string;
  downloadCount: number;
  maxDownloads: number;
  isRevoked: boolean;
  revokedReason: string | null;
  orderNumber: string;
  purchasedAt: string;
}

interface CustomerInfo {
  id: string;
  email: string;
  name: string | null;
}

function PurchasesContent() {
  const searchParams = useSearchParams();
  const urlEmail = searchParams.get('email') || '';
  const urlToken = searchParams.get('token') || '';

  const [step, setStep] = useState<'request' | 'verify' | 'dashboard'>('request');
  const [email, setEmail] = useState(urlEmail);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Check active session on initial mount
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const res = await fetch('/api/purchases/portal');
        if (res.ok) {
          const data = await res.json();
          setCustomer(data.customer);
          setItems(data.items || []);
          setStep('dashboard');
        }
      } catch {
        // Not authenticated, stay on request step
      } finally {
        setIsCheckingSession(false);
      }
    }

    if (urlEmail && urlToken) {
      handleVerifyToken(urlEmail, urlToken);
      setIsCheckingSession(false);
    } else {
      checkExistingSession();
    }
  }, [urlEmail, urlToken]);

  const loadPortalData = async () => {
    try {
      const res = await fetch('/api/purchases/portal');
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to reload portal:', err);
    }
  };

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
      setSuccessInfo(
        'If an account with verified purchases exists, a secure verification code was sent to your inbox.'
      );
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
    setDownloadError(null);

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

      // Load portal items with fresh cookie session
      await loadPortalData();
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

  const handleDownload = async (entitlementId: string) => {
    setDownloadingId(entitlementId);
    setDownloadError(null);

    try {
      // 1. Request single-use 15-minute download grant
      const grantRes = await fetch(`/api/entitlements/${entitlementId}/grant`, {
        method: 'POST',
      });

      const grantData = await grantRes.json();
      if (!grantRes.ok) {
        throw new Error(grantData.error || 'Failed to authorize download');
      }

      // 2. Trigger secure download delivery
      const link = document.createElement('a');
      link.href = grantData.downloadUrl;
      link.setAttribute('rel', 'noreferrer');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 3. Refresh portal data to reflect updated quota count
      setTimeout(() => {
        loadPortalData();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to download asset';
      setDownloadError(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/purchases/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setCustomer(null);
      setItems([]);
      setStep('request');
      setCode('');
      setDebugOtp(null);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Verifying your purchase session...</p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '60px', paddingBottom: '96px' }}>
      <div className="container">
        {/* Step 1 & 2: Authentication Modal / Container */}
        {step !== 'dashboard' && (
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                borderRadius: '8px',
                padding: '48px 36px',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    padding: '14px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    marginBottom: '16px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <KeyRound size={28} />
                </div>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', marginBottom: '8px', fontWeight: 700 }}>
                  Customer Digital Library
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                  Instant access to your purchased notes, guides, frameworks, and experiment logs.
                </p>
              </div>

              {errorMessage && (
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '6px',
                    color: 'var(--status-error)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successInfo && (
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '6px',
                    color: '#166534',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px',
                  }}
                >
                  <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                  <span>{successInfo}</span>
                </div>
              )}

              {/* Local Dev / Test Verification Code Banner */}
              {debugOtp && (
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    borderRadius: '6px',
                    color: '#92400E',
                    fontSize: '0.84rem',
                    marginBottom: '20px',
                  }}
                >
                  <strong>Development OTP Code:</strong>{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.1em' }}>
                    {debugOtp}
                  </span>
                </div>
              )}

              {step === 'request' ? (
                <form onSubmit={handleRequestOtp}>
                  <div className="input-group">
                    <label htmlFor="recovery-email" className="input-label">
                      Purchase Email Address
                    </label>
                    <input
                      id="recovery-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="alex.growth@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Enter the email you used during checkout. A 15-minute magic link and OTP will be dispatched.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginTop: '12px' }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      'Send Secure Verification Code'
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleManualVerify}>
                  <div className="input-group">
                    <label htmlFor="recovery-code" className="input-label">
                      Enter 6-Digit Code
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
                        fontSize: '1.35rem',
                        letterSpacing: '0.25em',
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Code sent to <strong>{email}</strong>. Valid for 15 minutes.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginTop: '12px' }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      'Access My Library'
                    )}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('request');
                        setErrorMessage('');
                        setDebugOtp(null);
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
          </div>
        )}

        {/* Step 3: Authenticated Customer Digital Library */}
        {step === 'dashboard' && customer && (
          <div>
            {/* Library Top Header */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-main)',
                paddingBottom: '24px',
                marginBottom: '32px',
                gap: '16px',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                  }}
                >
                  <ShieldCheck size={14} style={{ color: 'var(--accent-sage)' }} />
                  <span>Authenticated Customer Session</span>
                </div>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 700, margin: 0 }}>
                  Your Digital Library
                </h1>
                <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                  Account: <strong>{customer.email}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link href="/store" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                  Browse Catalog →
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            {/* Error banner if download fails */}
            {downloadError && (
              <div
                style={{
                  padding: '14px 16px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '6px',
                  color: 'var(--status-error)',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '24px',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{downloadError}</span>
              </div>
            )}

            {/* Entitlement Items List */}
            {items.length === 0 ? (
              <div
                style={{
                  padding: '64px 24px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  borderRadius: '8px',
                }}
              >
                <BookOpen size={42} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto' }} />
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '8px' }}>
                  No Purchased Assets Found
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '24px', maxWidth: '440px', margin: '0 auto 24px auto' }}>
                  We could not find any active digital product entitlements under this email. If you made a purchase under a different address, please log in with that email.
                </p>
                <Link href="/store" className="btn btn-primary btn-md">
                  Explore Products →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {items.map((item) => {
                  const remaining = Math.max(0, item.maxDownloads - item.downloadCount);
                  const isExhausted = remaining <= 0;
                  const isDownloading = downloadingId === item.entitlementId;

                  return (
                    <div
                      key={item.entitlementId}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: `1px solid ${item.isRevoked ? '#FCA5A5' : 'var(--border-main)'}`,
                        borderRadius: '8px',
                        padding: '24px',
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) auto',
                        gap: '24px',
                        alignItems: 'center',
                        transition: 'box-shadow 0.2s ease',
                      }}
                    >
                      {/* Left: Product and entitlement details */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontFamily: 'var(--font-mono)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-subtle)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {item.category}
                          </span>

                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Order #{item.orderNumber}
                          </span>

                          {item.isRevoked ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                color: 'var(--status-error)',
                                backgroundColor: '#FEF2F2',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                border: '1px solid #FCA5A5',
                              }}
                            >
                              <Ban size={12} />
                              Revoked ({item.revokedReason || 'Refunded'})
                            </span>
                          ) : isExhausted ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                color: '#92400E',
                                backgroundColor: '#FEF3C7',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                border: '1px solid #FDE68A',
                              }}
                            >
                              Quota Exhausted ({item.downloadCount}/{item.maxDownloads})
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                color: '#166534',
                                backgroundColor: '#F0FDF4',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                border: '1px solid #BBF7D0',
                              }}
                            >
                              <CheckCircle2 size={12} />
                              Active Access
                            </span>
                          )}
                        </div>

                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                          {item.title}
                        </h3>

                        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                          {item.tagline}
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span>Format: <strong>{item.format}</strong></span>
                          <span>Size: <strong>{item.fileSize}</strong></span>
                          <span>
                            Downloads: <strong>{item.downloadCount} of {item.maxDownloads} used</strong> ({remaining} remaining)
                          </span>
                        </div>
                      </div>

                      {/* Right: Download Action */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          disabled={item.isRevoked || isExhausted || isDownloading}
                          onClick={() => handleDownload(item.entitlementId)}
                          className={`btn ${item.isRevoked || isExhausted ? 'btn-outline' : 'btn-primary'} btn-md`}
                          style={{
                            minWidth: '180px',
                            cursor: item.isRevoked || isExhausted || isDownloading ? 'not-allowed' : 'pointer',
                            opacity: item.isRevoked || isExhausted ? 0.6 : 1,
                          }}
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="animate-spin" size={16} />
                              <span>Authorizing...</span>
                            </>
                          ) : item.isRevoked ? (
                            <>
                              <Ban size={16} />
                              <span>Access Revoked</span>
                            </>
                          ) : isExhausted ? (
                            <>
                              <Clock size={16} />
                              <span>Limit Reached</span>
                            </>
                          ) : (
                            <>
                              <Download size={16} />
                              <span>Download Asset</span>
                            </>
                          )}
                        </button>

                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Cryptographic 15-min single-use grant
                        </span>
                      </div>
                    </div>
                  );
                })}
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
    <Suspense
      fallback={
        <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 12px auto' }} />
          <div>Loading customer purchases...</div>
        </div>
      }
    >
      <PurchasesContent />
    </Suspense>
  );
}
