import React from 'react';
import Link from 'next/link';
import { Layers, ArrowRight, Check, Sparkles } from 'lucide-react';

interface BundleCardProps {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  price: number;
  compareAtPrice: number;
  includedItems: string[];
  format: string;
  pageCount?: number | null;
  onQuickBuy?: (product: { id: string; title: string; price: number; slug: string }) => void;
}

export function BundleCard({
  id,
  slug,
  title,
  tagline,
  price,
  compareAtPrice,
  includedItems,
  format,
  onQuickBuy,
}: BundleCardProps) {
  const savings = Math.max(0, compareAtPrice - price);
  const savingsPercent = Math.round((savings / compareAtPrice) * 100);

  return (
    <div
      style={{
        backgroundColor: '#121417',
        color: '#FAF9F6',
        borderRadius: '6px',
        border: '1px solid #2A2F37',
        padding: '36px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.4)',
      }}
    >
      {/* Decorative Gold Corner Stamp */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          backgroundColor: '#B45309',
          color: '#FFFFFF',
          fontSize: '0.68rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '6px 14px',
          borderBottomLeftRadius: '6px',
        }}
      >
        Best Value · Save {savingsPercent}%
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '36px',
          alignItems: 'center',
        }}
      >
        {/* Left Column: Title & Breakdown */}
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#F59E0B',
              marginBottom: '10px',
            }}
          >
            <Sparkles size={13} />
            <span>Curated Complete Library</span>
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.9rem',
              color: '#FFFFFF',
              fontWeight: 600,
              lineHeight: 1.18,
              marginBottom: '12px',
            }}
          >
            {title}
          </h3>

          <p style={{ color: '#9CA3AF', fontSize: '0.92rem', lineHeight: 1.55, marginBottom: '20px' }}>
            {tagline}
          </p>

          <div style={{ fontSize: '0.78rem', color: '#D1D5DB', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            What’s Included in This Vault:
          </div>

          <ul
            style={{
              listStyle: 'none',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px',
              marginBottom: '8px',
            }}
          >
            {includedItems.map((item, idx) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '0.84rem',
                  color: '#E5E7EB',
                }}
              >
                <Check size={14} style={{ color: '#22C55E', flexShrink: 0, marginTop: '3px' }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Pricing & 1-Click CTA */}
        <div
          style={{
            backgroundColor: '#1A1E24',
            border: '1px solid #2B303A',
            borderRadius: '6px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem', color: '#9CA3AF' }}>
            <span>Total Individual Value:</span>
            <span style={{ textDecoration: 'line-through' }}>₹{compareAtPrice}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.88rem', color: '#22C55E', fontWeight: 600 }}>
            <span>Instant Bundle Savings:</span>
            <span>-₹{savings} ({savingsPercent}% Off)</span>
          </div>

          <div
            style={{
              borderTop: '1px solid #2B303A',
              paddingTop: '16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>
                One-Time Payment
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
                ₹{price}
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
              Lifetime single-operator access
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {onQuickBuy ? (
              <button
                type="button"
                onClick={() => onQuickBuy({ id, title, price, slug })}
                className="btn btn-primary btn-lg"
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#121417',
                  borderColor: '#F59E0B',
                  fontWeight: 700,
                  width: '100%',
                }}
              >
                <span>Get the Complete Vault — ₹{price}</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <Link
                href={`/products/${slug}`}
                className="btn btn-primary btn-lg"
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#121417',
                  borderColor: '#F59E0B',
                  fontWeight: 700,
                  width: '100%',
                  textDecoration: 'none',
                }}
              >
                <span>Get the Complete Vault — ₹{price}</span>
                <ArrowRight size={16} />
              </Link>
            )}

            <Link
              href={`/products/${slug}`}
              style={{
                textAlign: 'center',
                fontSize: '0.82rem',
                color: '#9CA3AF',
                textDecoration: 'underline',
                marginTop: '4px',
              }}
            >
              View detailed bundle breakdown & sample pages
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
