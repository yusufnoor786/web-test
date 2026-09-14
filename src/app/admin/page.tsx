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
} from 'lucide-react';

interface AdminStats {
  revenue: number;
  totalOrders: number;
  paidOrderCount: number;
  conversionRate: number;
  totalCustomers: number;
  totalDownloads: number;
  topProducts: Array<{ title: string; category: string; count: number; revenue: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
    customer: { email: string; name?: string };
    items: Array<{ product: { title: string } }>;
  }>;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  razorpayPaymentId?: string;
  customer: { email: string; name?: string };
  items: Array<{ product: { title: string }; price: number }>;
  entitlements: Array<{
    id: string;
    downloadCount: number;
    maxDownloads: number;
    revokedAt?: string | null;
    product: { title: string };
  }>;
}

interface AdminProduct {
  id: string;
  slug: string;
  title: string;
  category: string;
  tagline: string;
  price: number;
  compareAtPrice?: number | null;
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
  minOrderAmount: number;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'coupons'>('dashboard');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // New coupon modal state
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState('PERCENTAGE');
  const [newCouponValue, setNewCouponValue] = useState('20');
  const [newCouponMin, setNewCouponMin] = useState('0');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setIsAuthenticated(true);
      loadDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      setLoginError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, ordersRes, productsRes, couponsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch(`/api/admin/orders?status=${orderStatusFilter}&q=${encodeURIComponent(orderSearch)}`),
        fetch('/api/admin/products'),
        fetch('/api/admin/coupons'),
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

  const handleRefundOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to mark this order as refunded and revoke download access?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Refund action failed');
      showToast(data.message || 'Order refunded successfully');
      loadDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const handleTogglePublish = async (productId: string, currentPublished: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentPublished }),
      });
      if (!res.ok) throw new Error('Failed to update product status');
      showToast('Product updated');
      loadDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCouponCode.trim(),
          discountType: newCouponType,
          discountValue: Number(newCouponValue),
          minOrderAmount: Number(newCouponMin) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create coupon');

      setNewCouponCode('');
      showToast(`Coupon ${data.coupon.code} created`);
      loadDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create coupon');
    }
  };

  // Login View
  if (!isAuthenticated) {
    return (
      <div style={{ paddingTop: '80px', paddingBottom: '96px' }}>
        <div className="container-narrow" style={{ maxWidth: '440px' }}>
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-main)',
              borderRadius: '6px',
              padding: '40px 32px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '12px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  marginBottom: '12px',
                }}
              >
                <Lock size={24} />
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', marginBottom: '6px' }}>
                Store Administration
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Enter your secure admin secret key to access order reconciliation and store controls.
              </p>
            </div>

            {loginError && (
              <div
                style={{
                  padding: '10px 14px',
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
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label htmlFor="admin-key" className="input-label">
                  Admin Passkey
                </label>
                <input
                  id="admin-key"
                  type="password"
                  required
                  placeholder="Enter ADMIN_SECRET_KEY"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Default local key: growth_archive_admin_secure_key_2026
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '8px' }}
              >
                {isLoading ? 'Authenticating...' : 'Unlock Admin Dashboard'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Dashboard View
  return (
    <div style={{ paddingTop: '32px', paddingBottom: '96px' }}>
      <div className="container">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              backgroundColor: '#121417',
              color: '#FFFFFF',
              padding: '12px 20px',
              borderRadius: '4px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.88rem',
            }}
          >
            <CheckCircle2 size={16} style={{ color: '#22C55E' }} />
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
            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
              }}
            >
              Control Center
            </span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginTop: '2px', marginBottom: 0 }}>
              The Growth Archive Management
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
              title="Refresh data"
            >
              <RefreshCcw size={14} />
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & KPIS */}
        {activeTab === 'dashboard' && stats && (
          <div>
            {/* KPI Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                marginBottom: '40px',
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  padding: '24px',
                  borderRadius: '4px',
                }}
              >
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  TOTAL VERIFIED REVENUE
                </span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                  ₹{stats.revenue}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--status-success)' }}>
                  100% server-verified payments
                </span>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  padding: '24px',
                  borderRadius: '4px',
                }}
              >
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  PAID ORDERS
                </span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                  {stats.paidOrderCount}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {stats.totalOrders} initiated checkout attempts
                </span>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  padding: '24px',
                  borderRadius: '4px',
                }}
              >
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  UNIQUE CUSTOMERS
                </span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                  {stats.totalCustomers}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Registered buyer accounts
                </span>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  padding: '24px',
                  borderRadius: '4px',
                }}
              >
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  DOWNLOAD EVENTS
                </span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                  {stats.totalDownloads}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Total cryptographically served files
                </span>
              </div>
            </div>

            {/* Top Products Table & Recent Orders */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '32px',
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
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '16px' }}>
                  Top Selling Products
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
                          padding: '10px 12px',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: '4px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tp.title}</div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {tp.count} units sold
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          ₹{tp.revenue}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Orders */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  borderRadius: '6px',
                  padding: '24px',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '16px' }}>
                  Recent Orders
                </h3>
                {stats.recentOrders.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No orders yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stats.recentOrders.map((ro) => (
                      <div
                        key={ro.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          borderBottom: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                            {ro.orderNumber} · {ro.customer.email}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {ro.items.map((i) => i.product.title).join(', ')}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>₹{ro.total}</div>
                          <span
                            className={`badge ${ro.status === 'PAID' ? 'badge-bestseller' : 'badge-featured'}`}
                            style={{ fontSize: '0.65rem' }}
                          >
                            {ro.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT */}
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
                  placeholder="Filter by Order #, Customer Email, or Payment ID..."
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
                <option value="PENDING">Pending</option>
                <option value="REFUNDED">Refunded</option>
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
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Downloads</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No matching orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord) => (
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
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                          ₹{ord.total}
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
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {ord.entitlements.map((e) => `${e.downloadCount}/${e.maxDownloads}`).join(', ') || '0'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {ord.status === 'PAID' && (
                            <button
                              type="button"
                              onClick={() => handleRefundOrder(ord.id)}
                              className="btn btn-outline btn-sm"
                              style={{ color: 'var(--status-error)', borderColor: 'var(--border-main)' }}
                            >
                              Refund & Revoke
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

        {/* TAB 3: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
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
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Title & Slug</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Price</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Format</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Sales Volume</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          /products/{p.slug}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge">{p.category}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                        ₹{p.price}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {p.format}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem' }}>
                        {p._count.orderItems} orders
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${p.isPublished ? 'badge-bestseller' : 'badge'}`}>
                          {p.isPublished ? 'Live' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(p.id, p.isPublished)}
                          className="btn btn-secondary btn-sm"
                        >
                          {p.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: COUPONS MANAGEMENT */}
        {activeTab === 'coupons' && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '32px',
              }}
            >
              {/* Existing Coupons List */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  borderRadius: '6px',
                  padding: '24px',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '16px' }}>
                  Active Promotional Coupons
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {coupons.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '14px 16px',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-main)',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                          {c.code}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% off` : `₹${c.discountValue} flat off`} · Min spend ₹{c.minOrderAmount}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="badge badge-bestseller">{c.usedCount} used</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create New Coupon Form */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  borderRadius: '6px',
                  padding: '24px',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '16px' }}>
                  Create New Coupon
                </h3>

                <form onSubmit={handleCreateCoupon}>
                  <div className="input-group">
                    <label className="input-label">Coupon Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FLASH30"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value)}
                      className="input-field"
                      style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Discount Type</label>
                    <select
                      value={newCouponType}
                      onChange={(e) => setNewCouponType(e.target.value)}
                      className="input-field"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Flat Amount (₹)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Discount Value</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newCouponValue}
                      onChange={(e) => setNewCouponValue(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Minimum Order Value (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={newCouponMin}
                      onChange={(e) => setNewCouponMin(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                    Create Promotional Code
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
