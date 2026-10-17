'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Download,
  Check,
  X,
  FileText,
  Lock,
  Eye,
  ArrowRight,
  BookOpen,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { ProductCover } from './ProductCover';
import { ProductCard } from './ProductCard';
import { CheckoutModal } from './CheckoutModal';
import { ProductPreviewModal } from './ProductPreviewModal';
import { trackViewItem } from '@/lib/analytics';

interface ProductData {
  id: string;
  slug: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  format: string;
  pageCount: number | null;
  fileSize: string | null;
  level: string | null;
  tags: string;
  whatYouLearn: string;
  whatsIncluded: string;
  faq: string;
  previewPages: string;
  isBestseller: boolean;
  isFeatured: boolean;
}

interface ProductDetailClientProps {
  product: ProductData;
  relatedProducts: ProductData[];
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Parse JSON properties safely
  let whatYouLearnItems: string[] = [];
  try {
    whatYouLearnItems = JSON.parse(product.whatYouLearn);
  } catch (e) {
    whatYouLearnItems = ['Practical campaign architecture and deterministic scaling rules.'];
  }

  let whatsIncludedItems: string[] = [];
  try {
    whatsIncludedItems = JSON.parse(product.whatsIncluded);
  } catch (e) {
    whatsIncludedItems = ['Complete high-resolution PDF dossier.'];
  }

  let faqItems: Array<{ q: string; a: string }> = [];
  try {
    faqItems = JSON.parse(product.faq);
  } catch (e) {
    faqItems = [];
  }

  // Track product view in analytics
  useEffect(() => {
    trackViewItem({
      id: product.id,
      name: product.title,
      category: product.category,
      price: product.price,
    });
  }, [product]);

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  return (
    <div style={{ paddingTop: '24px', paddingBottom: '96px' }}>
      <div className="container">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumbs"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            marginBottom: '32px',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link href="/store" style={{ textDecoration: 'none' }}>Store</Link>
          <span>/</span>
          <Link href={`/store?category=${product.category}`} style={{ textDecoration: 'none' }}>
            {product.category.replace('_', ' ')}
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{product.title}</span>
        </nav>

        {/* Product Hero Section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '48px',
            alignItems: 'start',
            marginBottom: '64px',
            paddingBottom: '48px',
            borderBottom: '1px solid var(--border-main)',
          }}
        >
          {/* Left: Cover & Preview Launcher */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '380px', position: 'relative' }}>
              <ProductCover
                title={product.title}
                category={product.category}
                tagline={product.tagline}
                format={product.format}
                level={product.level}
                variant="hero"
              />

              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Eye size={16} />
                <span>Read Sample Pages (Free Preview)</span>
              </button>
            </div>
          </div>

          {/* Right: Product Narrative & Buy Box */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span
                className={`badge ${
                  product.category.toUpperCase().includes('NOTE')
                    ? 'badge-cat-notes'
                    : product.category.toUpperCase().includes('GUIDE')
                    ? 'badge-cat-guide'
                    : product.category.toUpperCase().includes('TEMPLATE')
                    ? 'badge-cat-template'
                    : product.category.toUpperCase().includes('CASE')
                    ? 'badge-cat-casestudy'
                    : product.category.toUpperCase().includes('BUNDLE')
                    ? 'badge-cat-bundle'
                    : 'badge-cat-playbook'
                }`}
              >
                {product.category.replace('_', ' ')}
              </span>
              {product.isBestseller && <span className="badge badge-bestseller">★ Bestseller</span>}
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {product.format}
              </span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2rem, 3.5vw, 2.7rem)',
                lineHeight: 1.18,
                marginBottom: '16px',
                letterSpacing: '-0.02em',
              }}
            >
              {product.title}
            </h1>

            <p
              style={{
                fontSize: '1.08rem',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                marginBottom: '28px',
              }}
            >
              {product.tagline}
            </p>

            {/* Price & Buy Action Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                borderRadius: '6px',
                padding: '24px',
                marginBottom: '28px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '2.4rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                  }}
                >
                  ₹{product.price}
                </span>

                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span
                    style={{
                      fontSize: '1.1rem',
                      color: 'var(--text-muted)',
                      textDecoration: 'line-through',
                    }}
                  >
                    ₹{product.compareAtPrice}
                  </span>
                )}

                {discountPercent && (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--status-success)',
                      backgroundColor: 'var(--accent-forest-bg)',
                      padding: '3px 8px',
                      borderRadius: '3px',
                    }}
                  >
                    Save {discountPercent}%
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                One-time purchase · Instant digital download · Lifetime single-operator license
              </div>

              {/* Primary Buy CTA */}
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(true)}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', padding: '16px', fontSize: '1.05rem', fontWeight: 700 }}
              >
                <Lock size={16} />
                <span>Buy & Download — ₹{product.price}</span>
                <ArrowRight size={16} />
              </button>

              {/* Guarantees */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '10px',
                  marginTop: '18px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.76rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--status-success)' }} />
                  Razorpay Verified
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={14} />
                  Instant Delivery
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} />
                  2026 Free Updates
                </span>
              </div>
            </div>

            {/* Overview text */}
            <div style={{ fontSize: '0.96rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              <p>{product.description}</p>
            </div>
          </div>
        </div>

        {/* Detailed Sections Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '56px',
            marginBottom: '64px',
          }}
        >
          {/* Left Column: What You'll Learn & What's Included */}
          <div>
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '16px' }}>
                What You’ll Learn & Execute
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {whatYouLearnItems.map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      fontSize: '0.94rem',
                      lineHeight: 1.5,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div
                      style={{
                        padding: '3px',
                        backgroundColor: 'var(--accent-forest-bg)',
                        borderRadius: '50%',
                        color: 'var(--status-success)',
                        marginTop: '2px',
                        flexShrink: 0,
                      }}
                    >
                      <Check size={13} />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What's Included In the Download */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '16px' }}>
                What’s Included in Your Download
              </h3>
              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-main)',
                  borderRadius: '6px',
                  padding: '20px',
                }}
              >
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {whatsIncludedItems.map((item, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <FileText size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Audience Fit & Technical Specs */}
          <div>
            {/* Who It's For & NOT For */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '16px' }}>
                Audience Calibration
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    padding: '16px 20px',
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#14532D', marginBottom: '6px' }}>
                    ✓ Designed For:
                  </div>
                  <p style={{ fontSize: '0.86rem', color: '#166534', margin: 0, lineHeight: 1.5 }}>
                    Performance media buyers, growth founders, digital marketing leads, and consultants who need deterministic systems, kill-switches, and tested SOPs without sitting through 20-hour video courses.
                  </p>
                </div>

                <div
                  style={{
                    padding: '16px 20px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#991B1B', marginBottom: '6px' }}>
                    ✕ NOT Designed For:
                  </div>
                  <p style={{ fontSize: '0.86rem', color: '#B91C1C', margin: 0, lineHeight: 1.5 }}>
                    People looking for get-rich-quick hacks, automated bot software, or generic motivational content. This is rigorous, operational knowledge that requires active execution.
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Specifications Table */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '16px' }}>
                Product Specifications
              </h3>
              <div
                style={{
                  border: '1px solid var(--border-main)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-surface)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.86rem' }}>
                  <span style={{ width: '140px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Format:</span>
                  <span style={{ fontWeight: 500 }}>{product.format}</span>
                </div>
                {product.pageCount && (
                  <div style={{ display: 'flex', padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.86rem' }}>
                    <span style={{ width: '140px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Length:</span>
                    <span style={{ fontWeight: 500 }}>{product.pageCount} Pages</span>
                  </div>
                )}
                {product.fileSize && (
                  <div style={{ display: 'flex', padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.86rem' }}>
                    <span style={{ width: '140px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>File Size:</span>
                    <span style={{ fontWeight: 500 }}>{product.fileSize}</span>
                  </div>
                )}
                <div style={{ display: 'flex', padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.86rem' }}>
                  <span style={{ width: '140px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Level:</span>
                  <span style={{ fontWeight: 500 }}>{product.level || 'All Levels'}</span>
                </div>
                <div style={{ display: 'flex', padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.86rem' }}>
                  <span style={{ width: '140px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Delivery:</span>
                  <span style={{ fontWeight: 500 }}>Instant 256-bit signed token download</span>
                </div>
                <div style={{ display: 'flex', padding: '12px 18px', fontSize: '0.86rem' }}>
                  <span style={{ width: '140px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>License:</span>
                  <span style={{ fontWeight: 500 }}>Single-Operator Lifetime License</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product FAQs */}
        {faqItems.length > 0 && (
          <div style={{ maxWidth: '780px', margin: '0 auto 64px auto' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', marginBottom: '20px', textAlign: 'center' }}>
              Frequently Asked Questions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {faqItems.map((f, idx) => (
                <details key={idx} name="product-faq" className="editorial-accordion" open={idx === 0}>
                  <summary>{f.q}</summary>
                  <div className="accordion-body">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Purchase Anchor Banner */}
        <div
          style={{
            backgroundColor: '#121417',
            color: '#FFFFFF',
            borderRadius: '6px',
            padding: '36px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            marginBottom: '80px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF' }}>
              Instant Digital Access
            </div>
            <h3 style={{ color: '#FFFFFF', margin: '4px 0 6px 0', fontSize: '1.4rem' }}>
              Ready to execute {product.title}?
            </h3>
            <p style={{ color: '#9CA3AF', margin: 0, fontSize: '0.88rem' }}>
              Single-operator license · Instant download on payment · Lifetime re-access
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF' }}>₹{product.price}</div>
              <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Zero recurring charges</div>
            </div>
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="btn btn-primary btn-lg"
              style={{ backgroundColor: '#F59E0B', color: '#121417', borderColor: '#F59E0B', fontWeight: 700 }}
            >
              <span>Buy & Download</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>Complementary Knowledge Products</h3>
              <Link href="/store" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                View all in Store →
              </Link>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px',
              }}
            >
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  slug={p.slug}
                  title={p.title}
                  category={p.category}
                  tagline={p.tagline}
                  description={p.description}
                  price={p.price}
                  compareAtPrice={p.compareAtPrice}
                  format={p.format}
                  pageCount={p.pageCount}
                  level={p.level}
                  isBestseller={p.isBestseller}
                  isFeatured={p.isFeatured}
                  previewPages={p.previewPages}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Global Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        product={{
          id: product.id,
          title: product.title,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          slug: product.slug,
          format: product.format,
        }}
      />

      {/* Product Sample Preview Modal */}
      <ProductPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        productTitle={product.title}
        productSlug={product.slug}
        previewPagesJson={product.previewPages}
        price={product.price}
        onBuy={() => {
          setIsPreviewOpen(false);
          setIsCheckoutOpen(true);
        }}
      />
    </div>
  );
}
