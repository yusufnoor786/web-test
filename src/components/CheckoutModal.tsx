'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  ShieldCheck,
  Zap,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Smartphone,
  Building2,
  Check,
  RefreshCw,
} from 'lucide-react';
import { trackBeginCheckout, trackPurchase } from '@/lib/analytics';

// Razorpay standard checkout interface on window
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    email?: string;
    name?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface CheckoutProduct {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  slug?: string;
  format?: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CheckoutProduct | null;
}

export function CheckoutModal({ isOpen, onClose, product }: CheckoutModalProps) {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{
    code: string;
    discountAmount: number;
    message: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [couponError, setCouponError] = useState('');

  // Simulator state for local verification
  const [mockOrderData, setMockOrderData] = useState<{
    orderId: string;
    orderNumber: string;
    razorpayOrderId: string;
    total: number;
  } | null>(null);

  const [simTab, setSimTab] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Lock body scroll and handle Escape key when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const currentPrice = product.price;
  const discountAmount = couponApplied ? couponApplied.discountAmount : 0;
  const finalTotal = Math.max(1, currentPrice - discountAmount);

  // Validate coupon handler
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          orderAmount: currentPrice,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.message || 'Invalid coupon code');
        setCouponApplied(null);
      } else {
        setCouponApplied({
          code: data.code,
          discountAmount: data.discountAmount,
          message: data.message,
        });
      }
    } catch (err) {
      console.error('Failed to validate coupon:', err);
      setCouponError('Network error validating coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  // Payment completion handler
  const handlePaymentSuccess = async (paymentResult: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    try {
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentResult),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Server payment verification failed');
      }

      // Track purchase in analytics
      trackPurchase(
        verifyData.orderNumber,
        [{ id: product.id, name: product.title, price: finalTotal }],
        finalTotal
      );

      // Close modal and redirect to Order Success Page
      onClose();
      router.push(
        `/orders/success?order=${verifyData.orderNumber}&tokens=${encodeURIComponent(
          JSON.stringify(verifyData.downloadTokens || [])
        )}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setErrorMessage(msg);
      setIsLoading(false);
      setIsAuthorizing(false);
    }
  };

  // Submit checkout handler
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address for digital delivery.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Initiate order server-side (server validates price authoritatively)
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          customerEmail: email,
          customerName: name,
          couponCode: couponApplied?.code || undefined,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Track begin checkout
      trackBeginCheckout(
        [{ id: product.id, name: product.title, price: finalTotal }],
        finalTotal
      );

      // Check if real Razorpay credentials are present or if sandbox mode is active
      const isMockMode =
        Boolean(orderData.isMock) ||
        !orderData.keyId ||
        orderData.keyId.includes('placeholder');

      if (!isMockMode && typeof window.Razorpay === 'function') {
        const options: RazorpayOptions = {
          key: orderData.keyId,
          amount: Math.round(orderData.amount * 100),
          currency: orderData.currency || 'INR',
          name: 'The Growth Archive',
          description: product.title,
          order_id: orderData.razorpayOrderId,
          prefill: {
            email: email,
            name: name,
          },
          theme: {
            color: '#4F46E5',
          },
          handler: (response) => {
            handlePaymentSuccess({
              orderId: orderData.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
            },
          },
        };

        try {
          const rzpInstance = new window.Razorpay(options);
          rzpInstance.open();
        } catch (rzpErr) {
          console.warn('[Razorpay] Fallback to Sandbox Simulator:', rzpErr);
          setMockOrderData({
            orderId: orderData.orderId,
            orderNumber: orderData.orderNumber,
            razorpayOrderId: orderData.razorpayOrderId,
            total: orderData.amount,
          });
          setIsLoading(false);
        }
      } else {
        // Razorpay Sandbox Simulator
        setMockOrderData({
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
          razorpayOrderId: orderData.razorpayOrderId,
          total: orderData.amount,
        });
        setIsLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout encountered an error';
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  // Mock payment simulator confirm
  const handleSimulatedPayment = (simulateSuccess: boolean) => {
    if (!mockOrderData) return;

    if (!simulateSuccess) {
      setErrorMessage('Simulated payment declined. Order preserved for retry.');
      setMockOrderData(null);
      setIsLoading(false);
      setIsAuthorizing(false);
      return;
    }

    setIsAuthorizing(true);
    const mockPaymentId = `pay_mock_${Date.now()}`;
    const mockSig = `mock_sig_${Date.now()}`;

    // Small delay to simulate real network roundtrip
    setTimeout(() => {
      handlePaymentSuccess({
        orderId: mockOrderData.orderId,
        razorpayOrderId: mockOrderData.razorpayOrderId,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: mockSig,
      });
    }, 450);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '540px',
          padding: '0',
          maxHeight: 'min(92vh, 92dvh)',
          overflowY: 'auto',
          margin: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Razorpay Sandbox Simulator Active View */}
        {mockOrderData ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Razorpay Branded Modal Header */}
            <div
              style={{
                backgroundColor: '#072654',
                color: '#FFFFFF',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      backgroundColor: '#3395FF',
                      color: '#FFFFFF',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    RAZORPAY SANDBOX
                  </span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Test Environment</span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  ₹{mockOrderData.total}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                  Order: {mockOrderData.orderNumber} · {email}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMockOrderData(null);
                  setIsLoading(false);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#FFFFFF',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Cancel test payment"
              >
                <X size={18} />
              </button>
            </div>

            {/* Payment Method Selector Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-main)',
                backgroundColor: '#F8FAFC',
              }}
            >
              <button
                type="button"
                onClick={() => setSimTab('card')}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  border: 'none',
                  borderBottom: simTab === 'card' ? '2px solid #3395FF' : '2px solid transparent',
                  backgroundColor: simTab === 'card' ? '#FFFFFF' : 'transparent',
                  color: simTab === 'card' ? '#072654' : 'var(--text-muted)',
                  fontWeight: simTab === 'card' ? 700 : 500,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <CreditCard size={16} />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setSimTab('upi')}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  border: 'none',
                  borderBottom: simTab === 'upi' ? '2px solid #3395FF' : '2px solid transparent',
                  backgroundColor: simTab === 'upi' ? '#FFFFFF' : 'transparent',
                  color: simTab === 'upi' ? '#072654' : 'var(--text-muted)',
                  fontWeight: simTab === 'upi' ? 700 : 500,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Smartphone size={16} />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setSimTab('netbanking')}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  border: 'none',
                  borderBottom: simTab === 'netbanking' ? '2px solid #3395FF' : '2px solid transparent',
                  backgroundColor: simTab === 'netbanking' ? '#FFFFFF' : 'transparent',
                  color: simTab === 'netbanking' ? '#072654' : 'var(--text-muted)',
                  fontWeight: simTab === 'netbanking' ? 700 : 500,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Building2 size={16} />
                <span>Netbanking</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ padding: '24px' }}>
              {simTab === 'card' && (
                <div>
                  <div
                    style={{
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#F8FAFC',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Test Card Pre-Populated
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3395FF' }}>VISA / RUPAY</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 600, letterSpacing: '0.12em', color: '#0F172A' }}>
                      4111 •••• •••• 4444
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <span>Expires: 12/28</span>
                      <span>CVV: 123</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Instant OTP bypass is enabled for this test order. Authorizing will simulate a valid 3D-Secure transaction.
                  </p>
                </div>
              )}

              {simTab === 'upi' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                    {['Google Pay', 'PhonePe', 'Paytm'].map((app) => (
                      <div
                        key={app}
                        style={{
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          padding: '12px 8px',
                          textAlign: 'center',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: '#0F172A',
                          backgroundColor: '#F8FAFC',
                        }}
                      >
                        {app}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Simulated UPI ID: <code>success@razorpay</code>
                  </div>
                </div>
              )}

              {simTab === 'netbanking' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                    {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'].map((bank) => (
                      <div
                        key={bank}
                        style={{
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: '#0F172A',
                          backgroundColor: '#F8FAFC',
                        }}
                      >
                        {bank}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  disabled={isAuthorizing}
                  onClick={() => handleSimulatedPayment(true)}
                  style={{
                    backgroundColor: '#059669',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '14px',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    cursor: isAuthorizing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isAuthorizing ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Verifying HMAC Signature...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Authorize Test Payment (₹{mockOrderData.total})</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isAuthorizing}
                  onClick={() => handleSimulatedPayment(false)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#DC2626',
                    border: '1px solid #FCA5A5',
                    borderRadius: '6px',
                    padding: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: isAuthorizing ? 'not-allowed' : 'pointer',
                  }}
                >
                  Simulate Bank Decline / Failure
                </button>
              </div>

              {/* Helpful Env Hint */}
              <div
                style={{
                  marginTop: '18px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                }}
              >
                💡 To test with the live Razorpay pop-up modal, add your <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> in <code>.env</code>.
              </div>
            </div>
          </div>
        ) : (
          /* Normal Order Form View */
          <div style={{ padding: 'clamp(18px, 4vw, 28px)' }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-main)',
                paddingBottom: '16px',
                marginBottom: '20px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--brand-primary)',
                    fontWeight: 700,
                  }}
                >
                  Instant Delivery Checkout
                </span>
                <h3 id="checkout-modal-title" style={{ margin: '4px 0 0 0', fontSize: '1.35rem', fontWeight: 700 }}>
                  Complete Your Order
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '4px',
                }}
                aria-label="Close checkout"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit}>
              {/* Product Summary Box */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-main)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700 }}>
                      {product.title}
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {product.format || 'Instant Digital Delivery · Single-Operator License'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                      ₹{currentPrice}
                    </div>
                    {product.compareAtPrice && product.compareAtPrice > currentPrice && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        ₹{product.compareAtPrice}
                      </div>
                    )}
                  </div>
                </div>

                {/* Applied Coupon Display */}
                {couponApplied && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px dashed var(--border-strong)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.84rem',
                      color: 'var(--status-success)',
                      fontWeight: 700,
                    }}
                  >
                    <span>Coupon {couponApplied.code}</span>
                    <span>-₹{couponApplied.discountAmount}</span>
                  </div>
                )}

                {/* Total Due Line */}
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-main)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>Total Due</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                    ₹{finalTotal}
                  </span>
                </div>
              </div>

              {/* Error banner */}
              {errorMessage && (
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--status-error-bg)',
                    border: '1px solid #FCA5A5',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--status-error)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Delivery Email Input */}
              <div className="input-group">
                <label htmlFor="checkout-email" className="input-label">
                  Digital Delivery Email <span style={{ color: 'var(--status-error)' }}>*</span>
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Encrypted single-use download tokens and invoice are sent here immediately.
                </span>
              </div>

              {/* Customer Name Input (Optional) */}
              <div className="input-group">
                <label htmlFor="checkout-name" className="input-label">
                  Full Name (optional, for receipt)
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Coupon Code Input */}
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="checkout-coupon" className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Discount Code
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="checkout-coupon"
                    type="text"
                    placeholder="e.g. LAUNCH20"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="input-field"
                    style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="btn btn-secondary btn-sm"
                    style={{ minWidth: '80px' }}
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--status-error)', display: 'block', marginTop: '4px' }}>
                    {couponError}
                  </span>
                )}
                {couponApplied && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--status-success)', display: 'block', marginTop: '4px', fontWeight: 600 }}>
                    ✓ {couponApplied.message}
                  </span>
                )}
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-accent btn-lg"
                style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
              >
                {isLoading ? (
                  <span>Creating Authoritative Order...</span>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Proceed to Payment — ₹{finalTotal}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Trust and Delivery Guarantees */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  marginTop: '16px',
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--status-success)' }} />
                  256-bit SSL
                </span>
                <span>•</span>
                <span>Razorpay Gateway</span>
                <span>•</span>
                <span>Instant Digital Access</span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
