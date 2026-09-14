'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ShieldCheck, Zap, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
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
      // 1. Initiate order server-side (server validates price authoritative)
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

      // 2. If Razorpay is loaded on window and keys are active
      if (typeof window.Razorpay === 'function' && !orderData.isMock) {
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
            color: '#121417',
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

        const rzpInstance = new window.Razorpay(options);
        rzpInstance.open();
      } else {
        // Local Simulator Mode (zero-friction verification)
        setMockOrderData({
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
          razorpayOrderId: orderData.razorpayOrderId,
          total: orderData.amount,
        });
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
      setErrorMessage('Simulated payment declined. You can retry anytime.');
      setMockOrderData(null);
      setIsLoading(false);
      return;
    }

    const mockPaymentId = `pay_mock_${Date.now()}`;
    const mockSig = `mock_sig_${Date.now()}`;

    handlePaymentSuccess({
      orderId: mockOrderData.orderId,
      razorpayOrderId: mockOrderData.razorpayOrderId,
      razorpayPaymentId: mockPaymentId,
      razorpaySignature: mockSig,
    });
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
        style={{ maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
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
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
              }}
            >
              Frictionless Checkout
            </span>
            <h3 id="checkout-modal-title" style={{ margin: '4px 0 0 0', fontSize: '1.25rem' }}>
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

        {/* Local Simulator Dialog If Triggered */}
        {mockOrderData ? (
          <div
            style={{
              padding: '24px',
              backgroundColor: '#F8F9FA',
              border: '1px solid var(--border-main)',
              borderRadius: '6px',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                padding: '10px',
                borderRadius: '50%',
                backgroundColor: '#EEF2F6',
                color: '#121417',
                marginBottom: '12px',
              }}
            >
              <Zap size={24} />
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>Razorpay Test Simulator</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Testing in local environment with authoritative server order <strong>{mockOrderData.orderNumber}</strong> for <strong>₹{mockOrderData.total}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleSimulatedPayment(true)}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <CheckCircle2 size={16} />
                <span>Simulate Successful Payment (₹{mockOrderData.total})</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulatedPayment(false)}
                className="btn btn-outline"
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                <span>Simulate Failed / Cancelled Payment</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCheckoutSubmit}>
            {/* Product Summary Box */}
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-main)',
                borderRadius: '6px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.98rem' }}>{product.title}</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {product.format || 'Instant Digital Delivery · Single-Operator License'}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{currentPrice}</div>
                  {product.compareAtPrice && product.compareAtPrice > currentPrice && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
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
                    fontSize: '0.82rem',
                    color: 'var(--status-success)',
                    fontWeight: 600,
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
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Total Due</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ₹{finalTotal}
                </span>
              </div>
            </div>

            {/* Error banner */}
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
                Your encrypted download tokens and receipt will be delivered here immediately.
              </span>
            </div>

            {/* Customer Name Input (Optional) */}
            <div className="input-group">
              <label htmlFor="checkout-name" className="input-label">
                Full Name (for receipt)
              </label>
              <input
                id="checkout-name"
                type="text"
                autoComplete="name"
                placeholder="Alex Thompson"
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
                <span style={{ fontSize: '0.74rem', color: 'var(--status-error)', display: 'block', marginTop: '4px' }}>
                  {couponError}
                </span>
              )}
              {couponApplied && (
                <span style={{ fontSize: '0.74rem', color: 'var(--status-success)', display: 'block', marginTop: '4px' }}>
                  ✓ {couponApplied.message}
                </span>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', padding: '14px' }}
            >
              {isLoading ? (
                <span>Preparing Secure Checkout...</span>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Pay & Download Instantly — ₹{finalTotal}</span>
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
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} style={{ color: 'var(--status-success)' }} />
                256-bit Encrypted
              </span>
              <span>•</span>
              <span>Razorpay Verified</span>
              <span>•</span>
              <span>Instant Download Access</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
