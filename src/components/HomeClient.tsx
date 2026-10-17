'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  FileText,
  BookOpen,
  Layers,
  BarChart3,
  Terminal,
  Download,
  HelpCircle,
} from 'lucide-react';
import { ProductCard } from './ProductCard';
import { ProductCover } from './ProductCover';
import { BundleCard } from './BundleCard';
import { CheckoutModal } from './CheckoutModal';
import { ProductPreviewModal } from './ProductPreviewModal';

interface ProductItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  format: string;
  pageCount: number | null;
  fileSize: string | null;
  level: string | null;
  isBestseller: boolean;
  isFeatured: boolean;
  previewPages: string;
}

interface HomeClientProps {
  featuredProducts: ProductItem[];
  allProducts: ProductItem[];
  bundles: ProductItem[];
}

export function HomeClient({ featuredProducts, allProducts, bundles }: HomeClientProps) {
  // Modal states
  const [checkoutProduct, setCheckoutProduct] = useState<{
    id: string;
    title: string;
    price: number;
    compareAtPrice?: number | null;
    slug?: string;
    format?: string;
  } | null>(null);

  const [previewData, setPreviewData] = useState<{
    slug: string;
    title: string;
    previewPages: string;
    price?: number;
  } | null>(null);

  const mainBundle = bundles[0];

  return (
    <>
      {/* 1. HERO SECTION */}
      <section
        style={{
          position: 'relative',
          borderBottom: '1px solid var(--border-main)',
          paddingTop: '72px',
          paddingBottom: '88px',
          backgroundColor: 'var(--bg-page)',
          overflow: 'hidden',
        }}
      >
        <div className="ambient-glow-indigo" />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: '56px',
              alignItems: 'center',
            }}
          >
            {/* Left: Headline & Editorial Positioning */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-sm)',
                  marginBottom: '22px',
                }}
              >
                <span style={{ color: 'var(--brand-primary)' }}>●</span>
                <span>The Growth Archive</span>
                <span style={{ color: 'var(--border-strong)' }}>|</span>
                <span style={{ color: 'var(--text-muted)' }}>2026 Field Library</span>
              </div>

              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  lineHeight: 1.15,
                  marginBottom: '20px',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.025em',
                }}
              >
                Practical digital marketing knowledge, without the fluff.
              </h1>

              <p
                style={{
                  fontSize: '1.12rem',
                  lineHeight: 1.65,
                  color: 'var(--text-secondary)',
                  marginBottom: '32px',
                  maxWidth: '560px',
                }}
              >
                Notes, playbooks, operational templates, and unfiltered case studies built from hands-on marketing experiments. No artificial fluff, no generic theory — only battle-tested frameworks that drive CAC efficiency.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                <Link href="/store" className="btn btn-accent btn-lg" style={{ textDecoration: 'none' }}>
                  <span>Explore the Library</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/products/digital-marketing-fundamentals"
                  className="btn btn-secondary btn-lg"
                  style={{ textDecoration: 'none' }}
                >
                  <span>Start with Essentials (₹99)</span>
                </Link>
              </div>

              {/* Sub-hero trust signals */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '20px',
                  marginTop: '36px',
                  paddingTop: '24px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={15} style={{ color: 'var(--status-success)' }} />
                  Server-verified Razorpay checkout
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={15} />
                  Instant tokenized file delivery
                </span>
                <span>No recurring subscription</span>
              </div>
            </div>

            {/* Right: Editorial Document Stack Visual */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  position: 'relative',
                }}
              >
                {/* Background Angled Layer (Dossier Stack effect) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    right: '-16px',
                    bottom: '-16px',
                    background: '#1A202C',
                    borderRadius: '4px',
                    opacity: 0.15,
                    transform: 'rotate(3deg)',
                    zIndex: 1,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    right: '-8px',
                    bottom: '-8px',
                    background: '#2D3748',
                    borderRadius: '4px',
                    opacity: 0.25,
                    transform: 'rotate(-2deg)',
                    zIndex: 2,
                  }}
                />

                {/* Foreground Hero Cover */}
                <div style={{ position: 'relative', zIndex: 3 }}>
                  <ProductCover
                    title="Meta Ads Playbook: 2026 Edition"
                    category="PLAYBOOKS"
                    tagline="Consolidated Campaign Architecture, Creative Sandboxes & Algorithmic Scaling"
                    format="PDF · 104 pages"
                    level="Intermediate"
                    variant="hero"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST & VALUE STATEMENT */}
      <section
        style={{
          borderBottom: '1px solid var(--border-main)',
          padding: '48px 0',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '32px',
            }}
          >
            <div style={{ borderLeft: '2px solid var(--text-primary)', paddingLeft: '18px' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Zero Fluff Guarantee
              </h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
                Every paragraph is distilled operational knowledge. No filler pages, no bloated video transcripts, and zero theoretical posturing.
              </p>
            </div>

            <div style={{ borderLeft: '2px solid var(--text-primary)', paddingLeft: '18px' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Field-Tested Architectures
              </h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
                Synthesized from managing ₹2.5Cr+ in live campaign spend. You receive the exact testing sandboxes, scripts, and attribution models used today.
              </p>
            </div>

            <div style={{ borderLeft: '2px solid var(--text-primary)', paddingLeft: '18px' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Instant Cryptographic Delivery
              </h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
                Files are stored privately and delivered via 256-bit secure signed tokens immediately upon payment verification. Always re-downloadable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS */}
      <section style={{ padding: '80px 0', borderBottom: '1px solid var(--border-main)' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '40px',
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
                Curated Releases
              </span>
              <h2 style={{ fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
                Featured Knowledge Products
              </h2>
            </div>
            <Link
              href="/store"
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-primary)',
              }}
            >
              <span>View all 10 products</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Grid of featured items */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {featuredProducts.map((p) => (
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
                onQuickBuy={(prod) =>
                  setCheckoutProduct({
                    id: prod.id,
                    title: prod.title,
                    price: prod.price,
                    compareAtPrice: p.compareAtPrice,
                    slug: prod.slug,
                    format: p.format,
                  })
                }
                onPreview={(prod) =>
                  setPreviewData({
                    slug: prod.slug,
                    title: prod.title,
                    previewPages: prod.previewPages,
                    price: p.price,
                  })
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. PRODUCT CATEGORIES BREAKDOWN */}
      <section
        style={{
          padding: '80px 0',
          backgroundColor: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-main)',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px auto' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
              }}
            >
              Information Architecture
            </span>
            <h2 style={{ fontFamily: 'var(--font-serif)', marginTop: '4px', marginBottom: '12px' }}>
              Structured for Immediate Execution
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Different challenges require different formats. We organize our publishing into five distinct categories designed to solve specific operational bottlenecks.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Notes */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                padding: '24px',
                borderRadius: '4px',
              }}
            >
              <div style={{ marginBottom: '14px', color: '#1A202C' }}>
                <BookOpen size={24} />
              </div>
              <h4 style={{ marginBottom: '8px' }}>Master Notes</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                Dense, reference-grade summaries covering fundamentals, SEO ranking signals, and attribution equations.
              </p>
              <Link href="/store?category=NOTES" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Browse Notes →
              </Link>
            </div>

            {/* Guides */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                padding: '24px',
                borderRadius: '4px',
              }}
            >
              <div style={{ marginBottom: '14px', color: '#166534' }}>
                <FileText size={24} />
              </div>
              <h4 style={{ marginBottom: '8px' }}>Tactical Guides</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                Step-by-step implementation walkthroughs for content engines, conversion funnels, and wireframes.
              </p>
              <Link href="/store?category=GUIDES" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Browse Guides →
              </Link>
            </div>

            {/* Playbooks */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                padding: '24px',
                borderRadius: '4px',
              }}
            >
              <div style={{ marginBottom: '14px', color: '#121417' }}>
                <Terminal size={24} />
              </div>
              <h4 style={{ marginBottom: '8px' }}>Action Playbooks</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                Comprehensive campaign architectures, deterministic kill-switches, and scaling SOPs for Meta and Google.
              </p>
              <Link href="/store?category=PLAYBOOKS" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Browse Playbooks →
              </Link>
            </div>

            {/* Templates */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                padding: '24px',
                borderRadius: '4px',
              }}
            >
              <div style={{ marginBottom: '14px', color: '#9A3412' }}>
                <Layers size={24} />
              </div>
              <h4 style={{ marginBottom: '8px' }}>Operational Templates</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                Ready-to-duplicate Notion workspaces, budget forecast models, and 45+ proven ad creative scripts.
              </p>
              <Link href="/store?category=TEMPLATES" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Browse Templates →
              </Link>
            </div>

            {/* Case Studies */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                padding: '24px',
                borderRadius: '4px',
              }}
            >
              <div style={{ marginBottom: '14px', color: '#1E293B' }}>
                <BarChart3 size={24} />
              </div>
              <h4 style={{ marginBottom: '8px' }}>Real Experiments</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                Unedited post-mortems: ₹0 to ₹50L/mo scaling breakdowns, failed ad tests, and exact financial pivots.
              </p>
              <Link href="/store?category=CASE_STUDIES" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Browse Case Studies →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. AUTHOR AUTHORITY & METHODOLOGY */}
      <section style={{ padding: '80px 0', borderBottom: '1px solid var(--border-main)' }}>
        <div className="container-narrow">
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-main)',
              borderRadius: '6px',
              padding: '48px',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--text-muted)',
                marginBottom: '12px',
              }}
            >
              Author & Publishing Philosophy
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2rem',
                lineHeight: 1.2,
                marginBottom: '20px',
              }}
            >
              Why I Built The Growth Archive
            </h2>

            <div style={{ fontSize: '0.98rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              <p>
                Most digital marketing information on the internet is optimized for algorithmic engagement rather than operational utility. Video courses stretch 20 minutes of real insight across 15 hours of meandering lecture. Thread summaries regurgitate shallow advice without touching unit economics or attribution reality.
              </p>

              <p>
                I built <strong>The Growth Archive</strong> as a permanent publishing house for pure, operational knowledge. Every guide, note, and playbook in this library represents systems refined over years of hands-on campaign execution across e-commerce, B2B lead generation, and performance search.
              </p>

              <p style={{ marginBottom: 0 }}>
                These are the exact documents I hand to senior growth leads and media buyers on day one. You can open any dossier, understand the algorithmic mechanics, and apply the checklist immediately to your ad accounts and landing pages.
              </p>
            </div>

            <div
              style={{
                marginTop: '28px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  The Growth Archive Editorial
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Independent Digital Marketing Publishing House
                </div>
              </div>
              <Link href="/about" className="btn btn-secondary btn-sm">
                Read Full Stance & Background →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BUNDLE / BEST VALUE SECTION */}
      {mainBundle && (
        <section style={{ padding: '80px 0', borderBottom: '1px solid var(--border-main)' }}>
          <div className="container">
            <BundleCard
              id={mainBundle.id}
              slug={mainBundle.slug}
              title={mainBundle.title}
              tagline={mainBundle.tagline}
              price={mainBundle.price}
              compareAtPrice={mainBundle.compareAtPrice || 1360}
              includedItems={[
                'Meta Ads Playbook (104 Pages)',
                'SEO Master Notes (82 Pages)',
                'Digital Marketing Fundamentals (64 Pages)',
                'Scaling to ₹50L/mo Case Study (52 Pages)',
                'Organic Content Engine Guide (74 Pages)',
                'High-Converting Funnel Guide (90 Pages)',
                'Google Search & PMax Playbook (88 Pages)',
                'Analytics & Attribution Notes (58 Pages)',
                'Marketer’s OS Templates (12 Assets)',
                'Ad Creative Swipe File & Briefs (45 Pages)',
              ]}
              format={mainBundle.format}
              onQuickBuy={(prod) =>
                setCheckoutProduct({
                  id: prod.id,
                  title: prod.title,
                  price: prod.price,
                  compareAtPrice: mainBundle.compareAtPrice,
                  slug: prod.slug,
                  format: mainBundle.format,
                })
              }
            />
          </div>
        </section>
      )}

      {/* 7. HOW IT WORKS */}
      <section
        style={{
          padding: '80px 0',
          borderBottom: '1px solid var(--border-main)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 48px auto' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
              }}
            >
              Frictionless Experience
            </span>
            <h2 style={{ fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
              How Digital Delivery Works
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '32px',
            }}
          >
            <div>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  marginBottom: '16px',
                  color: 'var(--text-primary)',
                }}
              >
                01
              </div>
              <h4 style={{ marginBottom: '8px' }}>Select & Preview</h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Browse the catalog and inspect multi-page watermarked samples to verify depth and quality before purchasing.
              </p>
            </div>

            <div>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  marginBottom: '16px',
                  color: 'var(--text-primary)',
                }}
              >
                02
              </div>
              <h4 style={{ marginBottom: '8px' }}>Simple Checkout</h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Enter your email address and complete standard Razorpay payment via UPI, Cards, NetBanking, or Wallets.
              </p>
            </div>

            <div>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  marginBottom: '16px',
                  color: 'var(--text-primary)',
                }}
              >
                03
              </div>
              <h4 style={{ marginBottom: '8px' }}>Instant Token Download</h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Your order is verified server-side immediately. Download your high-res PDFs and spreadsheets right on the confirmation screen.
              </p>
            </div>

            <div>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  marginBottom: '16px',
                  color: 'var(--text-primary)',
                }}
              >
                04
              </div>
              <h4 style={{ marginBottom: '8px' }}>Lifetime Re-Access</h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                A permanent receipt is sent to your inbox. You can always recover and re-download your files via the My Purchases portal anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. EDITORIAL FAQ SECTION */}
      <section style={{ padding: '80px 0' }}>
        <div className="container-text">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
              }}
            >
              Frequently Asked Questions
            </span>
            <h2 style={{ fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
              Clear Answers
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <details name="homepage-faq" className="editorial-accordion" open>
              <summary>What format do the products come in?</summary>
              <div className="accordion-body">
                All notes, playbooks, and guides are delivered as high-resolution, DRM-free PDF dossiers formatted for reading on desktop, iPad, or mobile. Templates are delivered as packaged ZIP archives containing Notion workspaces, Excel/Google Sheets budget models, and wireframes.
              </div>
            </details>

            <details name="homepage-faq" className="editorial-accordion">
              <summary>Is this a subscription or a one-time purchase?</summary>
              <div className="accordion-body">
                Every purchase is strictly a one-time payment. There are zero recurring monthly fees, subscriptions, or hidden charges. Once purchased, you own the single-operator license for life.
              </div>
            </details>

            <details name="homepage-faq" className="editorial-accordion">
              <summary>How do I access my products after payment?</summary>
              <div className="accordion-body">
                Immediately after your payment is verified by our server, you are redirected to the order confirmation page with 1-click download buttons. A complete receipt and download access details are also delivered to your email inbox.
              </div>
            </details>

            <details name="homepage-faq" className="editorial-accordion">
              <summary>What if I switch laptops or lose my files?</summary>
              <div className="accordion-body">
                You can recover your purchases at any time. Simply navigate to the &quot;My Purchases&quot; page, enter your purchase email address, and receive an instant recovery code to regenerate fresh download tokens.
              </div>
            </details>

            <details name="homepage-faq" className="editorial-accordion">
              <summary>What is your refund policy on digital downloads?</summary>
              <div className="accordion-body">
                Because our digital products are instantly downloadable upon payment, all sales are generally final. However, if you experience a technical defect or duplicate charge, our support team will resolve it within 24 business hours. Please review our complete Refund Policy for details.
              </div>
            </details>

            <details name="homepage-faq" className="editorial-accordion">
              <summary>Do I get future updates and revisions?</summary>
              <div className="accordion-body">
                Yes. All 2026 edition revisions and errata updates are provided free of charge to existing purchasers of that product.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Global Modals */}
      <CheckoutModal
        isOpen={Boolean(checkoutProduct)}
        onClose={() => setCheckoutProduct(null)}
        product={checkoutProduct}
      />

      <ProductPreviewModal
        isOpen={Boolean(previewData)}
        onClose={() => setPreviewData(null)}
        productTitle={previewData?.title || ''}
        productSlug={previewData?.slug}
        previewPagesJson={previewData?.previewPages}
        price={previewData?.price}
        onBuy={() => {
          if (previewData) {
            const matched = allProducts.find((p) => p.slug === previewData.slug);
            if (matched) {
              setCheckoutProduct({
                id: matched.id,
                title: matched.title,
                price: matched.price,
                compareAtPrice: matched.compareAtPrice,
                slug: matched.slug,
                format: matched.format,
              });
            }
          }
        }}
      />
    </>
  );
}
