'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  BarChart2,
  Package,
  ShoppingBag,
  Tag,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Search,
  Check,
  X,
  ExternalLink,
  Ban,
  ShieldCheck,
  LogOut,
  Clock,
  DollarSign,
  FileText,
  UserCheck,
  ChevronRight,
  Loader2,
  Upload,
  Trash2,
  Plus,
  FileUp,
  Eye,
} from 'lucide-react';

interface AdminStats {
  revenue: number;
  totalOrders: number;
  paidOrderCount: number;
  conversionRate: number;
  totalCustomers: number;
  totalDownloads: number;
  totalEntitlements?: number;
  revokedEntitlements?: number;
  totalCoupons?: number;
  activeCoupons?: number;
  topProducts: Array<{ title: string; category: string; count: number; revenue: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    totalInPaise: number;
    status: string;
    createdAt: string;
    customer: { email: string; name?: string };
    items: Array<{ product: { title: string } }>;
  }>;
  recentAuditLogs?: Array<{
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    createdAt: string;
    ipAddress?: string;
    adminUser?: { name: string; email: string };
    details?: any;
  }>;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalInPaise: number;
  amountRefundedInPaise: number;
  currency: string;
  createdAt: string;
  razorpayPaymentId?: string;
  customer: { email: string; name?: string };
  items: Array<{ product: { title: string }; priceInPaise: number }>;
  entitlements: Array<{
    id: string;
    downloadCount: number;
    maxDownloads: number;
    isRevoked: boolean;
    revokedReason?: string | null;
    product: { title: string };
  }>;
  refunds: Array<{
    id: string;
    amountInPaise: number;
    reason?: string;
    createdAt: string;
  }>;
}

interface AdminProduct {
  id: string;
  slug: string;
  title: string;
  category: string;
  tagline: string;
  priceInPaise: number;
  compareAtInPaise?: number | null;
  format: string;
  isPublished: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  _count: { orderItems: number; entitlements: number };
}

interface AdminCoupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderInPaise: number;
  maxUses?: number | null;
  usedCount: number;
  reservedCount: number;
  isActive: boolean;
  createdAt: string;
}

interface AdminEntitlement {
  id: string;
  customerId: string;
  productId: string;
  downloadCount: number;
  maxDownloads: number;
  isRevoked: boolean;
  revokedReason?: string | null;
  createdAt: string;
  product: { id: string; title: string; format: string };
  customer: { id: string; email: string; name?: string };
  order: { id: string; orderNumber: string; status: string; paidAt?: string };
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'entitlements' | 'products' | 'coupons'>('dashboard');

  // Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [entitlements, setEntitlements] = useState<AdminEntitlement[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // New coupon modal state
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState('PERCENTAGE');
  const [newCouponValue, setNewCouponValue] = useState('20');
  const [newCouponMin, setNewCouponMin] = useState('0');
  const [newCouponMaxUses, setNewCouponMaxUses] = useState('');

  // New Product Upload State
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(true);
  const [newProductFile, setNewProductFile] = useState<File | null>(null);
  const [newProductTitle, setNewProductTitle] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('PLAYBOOK');
  const [newProductPrice, setNewProductPrice] = useState('199');
  const [newProductCompareAtPrice, setNewProductCompareAtPrice] = useState('399');
  const [newProductTagline, setNewProductTagline] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductFormat, setNewProductFormat] = useState('');
  const [newProductLevel, setNewProductLevel] = useState('All Levels');
  const [newProductIsPublished, setNewProductIsPublished] = useState(false);
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Authenticated fetch wrapper injecting double-submit CSRF header for state changes
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && csrfToken) {
      headers.set('x-ga-csrf-token', csrfToken);
    }
    return fetch(url, { ...options, headers });
  };

  // Check existing session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/admin/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            setAdminUser(data.admin);
            if (data.csrfToken) setCsrfToken(data.csrfToken);
          }
        }
      } catch (err) {
        // Unauthenticated
      } finally {
        setIsCheckingSession(false);
      }
    }
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setIsAuthenticated(true);
      setAdminUser(data.admin);
      if (data.csrfToken) setCsrfToken(data.csrfToken);
      showToast('Admin session established');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      setLoginError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authFetch('/api/admin/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      setAdminUser(null);
      setCsrfToken('');
      setLoginPassword('');
      showToast('Logged out');
    }
  };

  const loadDashboardData = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [statsRes, ordersRes, productsRes, couponsRes, entitlementsRes] = await Promise.all([
        authFetch('/api/admin/stats'),
        authFetch(`/api/admin/orders?status=${orderStatusFilter}&q=${encodeURIComponent(orderSearch)}`),
        authFetch('/api/admin/products'),
        authFetch('/api/admin/coupons'),
        authFetch('/api/admin/entitlements'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (ordersRes.ok) {
        const d = await ordersRes.json();
        setOrders(d.orders || []);
      }
      if (productsRes.ok) {
        const d = await productsRes.json();
        setProducts(d.products || []);
      }
      if (couponsRes.ok) {
        const d = await couponsRes.json();
        setCoupons(d.coupons || []);
      }
      if (entitlementsRes.ok) {
        const d = await entitlementsRes.json();
        setEntitlements(d.entitlements || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, orderStatusFilter, orderSearch]);

  const handleFullRefund = async (orderId: string, orderNumber: string) => {
    const reason = prompt(`Reason for FULL refund of order #${orderNumber}?`, 'Customer requested refund');
    if (reason === null) return;

    try {
      const res = await authFetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Refund failed');
      showToast(data.message || 'Full refund processed successfully');
      loadDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const handlePartialRefund = async (orderId: string, orderNumber: string, maxRefundPaise: number) => {
    const maxRupees = (maxRefundPaise / 100).toFixed(2);
    const amountStr = prompt(`Enter refund amount in ₹ (Max: ₹${maxRupees}):`, '');
    if (!amountStr) return;

    const amountRupees = parseFloat(amountStr);
    if (isNaN(amountRupees) || amountRupees <= 0) {
      alert('Please enter a valid positive number');
      return;
    }

    const reason = prompt('Reason for partial refund:', 'Partial customer accommodation') || 'Partial refund';

    try {
      const res = await authFetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountInPaise: Math.round(amountRupees * 100),
          reason,
          revokeEntitlements: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Partial refund failed');
      showToast(data.message || 'Partial refund processed');
      loadDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const handleRevokeEntitlement = async (orderId: string, entitlementId: string, productTitle: string) => {
    const reason = prompt(`Reason for revoking customer access to "${productTitle}"?`, 'Violation of digital terms');
    if (reason === null) return;

    try {
      const res = await authFetch(`/api/admin/orders/${orderId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entitlementId, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Revocation failed');
      showToast(`Access revoked for ${productTitle}`);
      loadDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to revoke entitlement');
    }
  };

  const handleToggleProductPublish = async (productId: string, currentPublished: boolean) => {
    try {
      const res = await authFetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentPublished }),
      });
      if (!res.ok) throw new Error('Failed to update product status');
      showToast('Product visibility updated');
      loadDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewProductFile(file);
      setUploadError('');

      // Auto-compute format label if empty
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      if (!newProductFormat) {
        setNewProductFormat(file.name.toLowerCase().endsWith('.zip') ? `ZIP · ${sizeMb} MB` : `PDF · ${sizeMb} MB`);
      }

      // Auto-suggest clean title if title is empty
      if (!newProductTitle) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]+/g, ' ')
          .split(' ')
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        setNewProductTitle(cleanName);
      }
    }
  };

  const handleUploadProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductFile) {
      setUploadError('Please choose a PDF or ZIP file to upload.');
      return;
    }
    if (!newProductTitle.trim()) {
      setUploadError('Product title is required.');
      return;
    }
    const priceNum = parseFloat(newProductPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setUploadError('Please enter a valid price in ₹ greater than 0.');
      return;
    }

    setIsUploadingProduct(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', newProductFile);
      formData.append('title', newProductTitle.trim());
      formData.append('category', newProductCategory);
      formData.append('price', newProductPrice.trim());
      if (newProductCompareAtPrice.trim()) {
        formData.append('compareAtPrice', newProductCompareAtPrice.trim());
      }
      formData.append('tagline', newProductTagline.trim());
      formData.append('description', newProductDescription.trim());
      formData.append('format', newProductFormat.trim());
      formData.append('level', newProductLevel);
      formData.append('isPublished', newProductIsPublished ? 'true' : 'false');

      const res = await authFetch('/api/admin/products', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload product');

      showToast(`Product "${newProductTitle}" uploaded successfully!`);
      // Reset form
      setNewProductFile(null);
      setNewProductTitle('');
      setNewProductTagline('');
      setNewProductDescription('');
      setNewProductPrice('199');
      setNewProductCompareAtPrice('399');
      setNewProductFormat('');
      setNewProductIsPublished(false);

      loadDashboardData();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploadingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${productTitle}"? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await authFetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');
      showToast('Product deleted successfully');
      loadDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleToggleCouponActive = async (couponId: string, currentActive: boolean) => {
    try {
      const res = await authFetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: couponId, isActive: !currentActive }),
      });
      if (!res.ok) throw new Error('Failed to update coupon status');
      showToast('Coupon status updated');
      loadDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    try {
      const res = await authFetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCouponCode.trim(),
          discountType: newCouponType,
          discountValue: Number(newCouponValue),
          minOrderAmount: Number(newCouponMin) || 0,
          maxUses: newCouponMaxUses ? Number(newCouponMaxUses) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create coupon');

      setNewCouponCode('');
      setNewCouponMaxUses('');
      showToast(`Coupon ${data.coupon.code} created`);
      loadDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create coupon');
    }
  };

  if (isCheckingSession) {
    return (
      <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Checking administrative session...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // LOGIN SCREEN
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div style={{ paddingTop: '80px', paddingBottom: '96px' }}>
        <div className="container-narrow" style={{ maxWidth: '440px' }}>
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-main)',
              borderRadius: '8px',
              padding: '40px 32px',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '14px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  marginBottom: '14px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <Lock size={26} />
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', marginBottom: '6px', fontWeight: 700 }}>
                Admin Portal
              </h1>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
                Identity-based scrypt credentials and CSRF double-submit protection.
              </p>
            </div>

            {loginError && (
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
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label htmlFor="admin-email" className="input-label">
                  Administrator Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@thegrowtharchive.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label htmlFor="admin-password" className="input-label">
                  Master Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="input-field"
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Rate limited: 5 attempts per 15 minutes per IP.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '10px' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  'Sign In to Admin Console'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATED DASHBOARD
  // ---------------------------------------------------------------------------
  return (
    <div style={{ paddingTop: '32px', paddingBottom: '96px' }}>
      <div className="container">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              backgroundColor: '#121417',
              color: '#FFFFFF',
              padding: '12px 20px',
              borderRadius: '6px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.88rem',
            }}
          >
            <CheckCircle2 size={18} style={{ color: '#22C55E' }} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Control Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-main)',
            paddingBottom: '20px',
            marginBottom: '32px',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--text-muted)',
                }}
              >
                Operator Session
              </span>
              {adminUser && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  {adminUser.role} · {adminUser.email}
                </span>
              )}
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.1rem', margin: 0, fontWeight: 700 }}>
              The Growth Archive Admin
            </h1>
          </div>

          {/* Navigation Tabs & Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`btn btn-sm ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <BarChart2 size={14} />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`btn btn-sm ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <ShoppingBag size={14} />
              <span>Orders ({orders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('entitlements')}
              className={`btn btn-sm ${activeTab === 'entitlements' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <FileText size={14} />
              <span>Entitlements ({entitlements.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`btn btn-sm ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Package size={14} />
              <span>Products ({products.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('coupons')}
              className={`btn btn-sm ${activeTab === 'coupons' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Tag size={14} />
              <span>Coupons ({coupons.length})</span>
            </button>

            <button
              type="button"
              onClick={loadDashboardData}
              className="btn btn-outline btn-sm"
              title="Refresh all data"
            >
              <RefreshCcw size={14} />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-error)' }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* TAB 1: OVERVIEW & KPIS */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'dashboard' && stats && (
          <div>
            {/* KPI Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '16px',
                marginBottom: '36px',
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  padding: '20px',
                  borderRadius: '6px',
                }}
              >
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  VERIFIED REVENUE
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                  ₹{stats.revenue.toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 500 }}>
                  Paise-exact server calculations
                </span>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  padding: '20px',
                  borderRadius: '6px',
                }}
              >
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  PAID ORDERS
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                  {stats.paidOrderCount}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {stats.totalOrders} total checkout attempts
                </span>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  padding: '20px',
                  borderRadius: '6px',
                }}
              >
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  TOTAL BUYERS
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                  {stats.totalCustomers}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Customer accounts
                </span>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  padding: '20px',
                  borderRadius: '6px',
                }}
              >
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  DOWNLOAD EVENTS
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                  {stats.totalDownloads}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Cryptographically authorized files served
                </span>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  padding: '20px',
                  borderRadius: '6px',
                }}
              >
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ENTITLEMENTS
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                  {stats.totalEntitlements || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--status-error)' }}>
                  {stats.revokedEntitlements || 0} revoked
                </span>
              </div>
            </div>

            {/* Top Products & Recent Audit Logs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '28px',
              }}
            >
              {/* Top Products */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  borderRadius: '6px',
                  padding: '24px',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600 }}>
                  Top Performing Products
                </h3>
                {stats.topProducts.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No orders recorded yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stats.topProducts.map((tp, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 14px',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: '4px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tp.title}</div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {tp.count} units fulfilled
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          ₹{tp.revenue.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Immutable Audit Log Timeline */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  borderRadius: '6px',
                  padding: '24px',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600 }}>
                  Recent Privileged Audit Trail
                </h3>
                {!stats.recentAuditLogs || stats.recentAuditLogs.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No audit events logged yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stats.recentAuditLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: '#FAF8F5',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          fontSize: '0.82rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              fontSize: '0.74rem',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {log.action}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            {new Date(log.createdAt).toLocaleTimeString('en-IN')}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                          Target: {log.targetType} ({log.targetId}) · Operator: {log.adminUser?.email || 'System'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 2: ORDERS MANAGEMENT */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'orders' && (
          <div>
            {/* Filter toolbar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="search"
                  placeholder="Filter by Order #, Customer Email, Name, or Payment ID..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-main)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid Only</option>
                <option value="PENDING">Pending Only</option>
                <option value="REFUNDED">Refunded</option>
                <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {/* Orders Table */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                borderRadius: '6px',
                overflowX: 'auto',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-main)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Order #</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Products</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Amount</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Payment Info</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No orders match the current filter.
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord) => {
                      const totalRupees = (ord.totalInPaise / 100).toFixed(2);
                      const refundedRupees = (ord.amountRefundedInPaise / 100).toFixed(2);
                      const refundablePaise = ord.totalInPaise - ord.amountRefundedInPaise;

                      return (
                        <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {ord.orderNumber}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 500 }}>{ord.customer.email}</div>
                            {ord.customer.name && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.customer.name}</div>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {ord.items.map((it) => it.product.title).join(', ')}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700 }}>₹{totalRupees}</div>
                            {ord.amountRefundedInPaise > 0 && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--status-error)' }}>
                                Refunded: ₹{refundedRupees}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              className={`badge ${
                                ord.status === 'PAID'
                                  ? 'badge-bestseller'
                                  : ord.status === 'REFUNDED'
                                  ? 'badge-featured'
                                  : 'badge'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            {ord.razorpayPaymentId || 'N/A'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {refundablePaise > 0 && (ord.status === 'PAID' || ord.status === 'PARTIALLY_REFUNDED') && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleFullRefund(ord.id, ord.orderNumber)}
                                    className="btn btn-outline btn-sm"
                                    style={{ color: 'var(--status-error)', borderColor: 'var(--border-main)', fontSize: '0.75rem' }}
                                    title="Full Refund & Revoke Entitlements"
                                  >
                                    Full Refund
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePartialRefund(ord.id, ord.orderNumber, refundablePaise)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.75rem' }}
                                    title="Partial Refund without revoking"
                                  >
                                    Partial
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 3: ENTITLEMENTS MANAGEMENT */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'entitlements' && (
          <div>
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                borderRadius: '6px',
                overflowX: 'auto',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-main)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Product Title</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Order #</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Downloads Used</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {entitlements.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No entitlements issued yet.
                      </td>
                    </tr>
                  ) : (
                    entitlements.map((ent) => (
                      <tr key={ent.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <strong>{ent.customer.email}</strong>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{ent.product.title}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>
                          {ent.order.orderNumber}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {ent.downloadCount} of {ent.maxDownloads}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {ent.isRevoked ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                color: 'var(--status-error)',
                                backgroundColor: '#FEF2F2',
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              <Ban size={12} />
                              Revoked ({ent.revokedReason || 'Admin'})
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                color: '#166534',
                                backgroundColor: '#F0FDF4',
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              <CheckCircle2 size={12} />
                              Active
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {!ent.isRevoked && (
                            <button
                              type="button"
                              onClick={() => handleRevokeEntitlement(ent.order.id, ent.id, ent.product.title)}
                              className="btn btn-outline btn-sm"
                              style={{ color: 'var(--status-error)', borderColor: 'var(--border-main)', fontSize: '0.75rem' }}
                            >
                              Revoke Access
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 4: PRODUCTS & PDF UPLOADS */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Upload New Product Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '12px',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Upload size={20} style={{ color: 'var(--brand-primary)' }} />
                    <span>Upload New Digital Product (PDF / ZIP)</span>
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Upload your PDF or resource archive, set its title, price, and description, then click Upload. You can publish it live anytime.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsUploadFormOpen(!isUploadFormOpen)}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  {isUploadFormOpen ? 'Hide Form' : 'Show Upload Form'}
                </button>
              </div>

              {isUploadFormOpen && (
                <form onSubmit={handleUploadProduct}>
                  {/* File Dropzone Area */}
                  <div
                    style={{
                      border: '2px dashed var(--border-strong)',
                      borderRadius: '8px',
                      padding: '24px',
                      textAlign: 'center',
                      backgroundColor: newProductFile ? '#F0FDF4' : 'var(--bg-subtle)',
                      borderColor: newProductFile ? '#16A34A' : 'var(--border-strong)',
                      cursor: 'pointer',
                      marginBottom: '20px',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                    onClick={() => document.getElementById('admin-pdf-input')?.click()}
                  >
                    <input
                      id="admin-pdf-input"
                      type="file"
                      accept=".pdf,.zip"
                      style={{ display: 'none' }}
                      onChange={handleProductFileChange}
                    />

                    {newProductFile ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={32} style={{ color: '#16A34A' }} />
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#166534' }}>
                          {newProductFile.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#15803D' }}>
                          Size: {(newProductFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('admin-pdf-input')?.click();
                          }}
                          className="btn btn-sm btn-outline"
                          style={{ marginTop: '8px', fontSize: '0.75rem' }}
                        >
                          Choose Different File
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <FileUp size={36} style={{ color: 'var(--brand-primary)' }} />
                        <div style={{ fontWeight: 600, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                          Click or drag & drop PDF or ZIP file here
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Supports .pdf and .zip files up to 100MB
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">Product Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Meta Ads Scaling Playbook (2026 Edition)"
                        value={newProductTitle}
                        onChange={(e) => setNewProductTitle(e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">Category *</label>
                      <select
                        value={newProductCategory}
                        onChange={(e) => setNewProductCategory(e.target.value)}
                        className="input-field"
                        style={{ height: '44px' }}
                      >
                        <option value="PLAYBOOK">PLAYBOOK (Action Playbook)</option>
                        <option value="NOTE">NOTE (Field Notes)</option>
                        <option value="GUIDE">GUIDE (Operator Guide)</option>
                        <option value="TEMPLATE">TEMPLATE (System Template)</option>
                        <option value="CASE_STUDY">CASE STUDY (Deconstructed Campaign)</option>
                        <option value="BUNDLE">BUNDLE (Curated Collection)</option>
                      </select>
                    </div>

                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">Price in ₹ (INR) *</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        placeholder="199"
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">Compare At / Original Price (₹)</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="399 (optional strike-through)"
                        value={newProductCompareAtPrice}
                        onChange={(e) => setNewProductCompareAtPrice(e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">Format Label</label>
                      <input
                        type="text"
                        placeholder="e.g. PDF · 84 pages"
                        value={newProductFormat}
                        onChange={(e) => setNewProductFormat(e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">Difficulty / Level</label>
                      <select
                        value={newProductLevel}
                        onChange={(e) => setNewProductLevel(e.target.value)}
                        className="input-field"
                        style={{ height: '44px' }}
                      >
                        <option value="All Levels">All Levels</option>
                        <option value="Beginner to Intermediate">Beginner to Intermediate</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Intermediate to Advanced">Intermediate to Advanced</option>
                        <option value="Advanced Operators">Advanced Operators</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label className="input-label">Tagline (1-line subtitle)</label>
                    <input
                      type="text"
                      placeholder="e.g. The consolidated campaign framework for scaling profitably in modern auctions."
                      value={newProductTagline}
                      onChange={(e) => setNewProductTagline(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label className="input-label">About / Full Description</label>
                    <textarea
                      rows={3}
                      placeholder="Describe what this resource covers, who it is for, and key learnings..."
                      value={newProductDescription}
                      onChange={(e) => setNewProductDescription(e.target.value)}
                      className="input-field"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {/* Immediate Publish Checkbox */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: '6px',
                      marginBottom: '20px',
                    }}
                  >
                    <input
                      id="publish-immediately"
                      type="checkbox"
                      checked={newProductIsPublished}
                      onChange={(e) => setNewProductIsPublished(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label
                      htmlFor="publish-immediately"
                      style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
                    >
                      Publish immediately (Make live on website as soon as uploaded)
                    </label>
                  </div>

                  {/* Error display */}
                  {uploadError && (
                    <div
                      style={{
                        padding: '12px 14px',
                        backgroundColor: 'var(--status-error-bg)',
                        border: '1px solid #FCA5A5',
                        borderRadius: '6px',
                        color: 'var(--status-error)',
                        fontSize: '0.85rem',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <AlertCircle size={16} />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      type="submit"
                      disabled={isUploadingProduct}
                      className="btn btn-primary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        fontWeight: 700,
                      }}
                    >
                      {isUploadingProduct ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Uploading & Processing PDF...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          <span>Upload & Save Product</span>
                        </>
                      )}
                    </button>

                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      The file will be securely stored in <code>storage/products/</code> with SHA-256 integrity verification.
                    </span>
                  </div>
                </form>
              )}
            </div>

            {/* Products Table Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  backgroundColor: 'var(--bg-subtle)',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                    Product Catalog ({products.length})
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Toggle 'Publish' to show or hide items on your live website.
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={16} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="input-field"
                    style={{ width: '200px', padding: '6px 10px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'var(--bg-subtle)',
                        borderBottom: '1px solid var(--border-main)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Title & Format</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Category</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Price</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Live Status</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Orders / Buyers</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products
                      .filter(
                        (p) =>
                          !productSearch ||
                          p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.category.toLowerCase().includes(productSearch.toLowerCase())
                      )
                      .map((prod) => (
                        <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prod.title}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {prod.format} · <code style={{ fontSize: '0.72rem' }}>/{prod.slug}</code>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span className="badge" style={{ fontSize: '0.7rem' }}>
                              {prod.category}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700 }}>₹{(prod.priceInPaise / 100).toFixed(0)}</div>
                            {prod.compareAtInPaise && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                ₹{(prod.compareAtInPaise / 100).toFixed(0)}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              className={`badge ${prod.isPublished ? 'badge-bestseller' : 'badge'}`}
                              style={{
                                fontSize: '0.72rem',
                                backgroundColor: prod.isPublished ? '#DCFCE7' : '#F1F5F9',
                                color: prod.isPublished ? '#15803D' : '#64748B',
                                border: prod.isPublished ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                              }}
                            >
                              {prod.isPublished ? '● Live on Website' : '○ Draft (Hidden)'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {prod._count.orderItems} orders · {prod._count.entitlements} buyers
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              {/* 1-Click Publish Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleProductPublish(prod.id, prod.isPublished)}
                                className="btn btn-sm"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '6px 12px',
                                  backgroundColor: prod.isPublished ? 'transparent' : '#059669',
                                  color: prod.isPublished ? 'var(--text-secondary)' : '#FFFFFF',
                                  borderColor: prod.isPublished ? 'var(--border-strong)' : '#059669',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                {prod.isPublished ? (
                                  'Unpublish'
                                ) : (
                                  <>
                                    <Check size={12} />
                                    <span>Publish</span>
                                  </>
                                )}
                              </button>

                              {/* View live on website */}
                              <a
                                href={`/products/${prod.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '6px 10px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  textDecoration: 'none',
                                }}
                                title="View on store"
                              >
                                <ExternalLink size={12} />
                                <span>View</span>
                              </a>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(prod.id, prod.title)}
                                className="btn btn-sm btn-outline"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '6px 8px',
                                  color: '#DC2626',
                                  borderColor: '#FCA5A5',
                                }}
                                title="Delete product"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 5: COUPONS */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'coupons' && (
          <div>
            {/* Create Coupon Form */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                borderRadius: '6px',
                padding: '24px',
                marginBottom: '28px',
              }}
            >
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600 }}>
                Create New Promotional Coupon
              </h3>

              <form onSubmit={handleCreateCoupon} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="LAUNCH20"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value)}
                    className="input-field"
                    style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Discount Type</label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value)}
                    style={{
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-main)',
                      backgroundColor: 'var(--bg-surface)',
                      fontSize: '0.88rem',
                      width: '100%',
                    }}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Amount (₹)</option>
                  </select>
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Value</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Min Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newCouponMin}
                    onChange={(e) => setNewCouponMin(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Max Uses</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={newCouponMaxUses}
                    onChange={(e) => setNewCouponMaxUses(e.target.value)}
                    className="input-field"
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-md" style={{ height: '42px' }}>
                  Create Coupon
                </button>
              </form>
            </div>

            {/* Coupons Table */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                borderRadius: '6px',
                overflowX: 'auto',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-main)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Code</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Discount</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Min Order</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Capacity / Usage</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {c.code}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        ₹{(c.minOrderInPaise / 100).toFixed(0)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.82rem' }}>
                        Used: <strong>{c.usedCount}</strong> · Reserved: <strong>{c.reservedCount}</strong> · Max:{' '}
                        <strong>{c.maxUses ?? '∞'}</strong>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          className={`badge ${c.isActive ? 'badge-bestseller' : 'badge'}`}
                          style={{ fontSize: '0.72rem' }}
                        >
                          {c.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleCouponActive(c.id, c.isActive)}
                          className={`btn btn-sm ${c.isActive ? 'btn-outline' : 'btn-secondary'}`}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {c.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
