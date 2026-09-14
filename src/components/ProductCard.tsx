import React from 'react';
import Link from 'next/link';
import { ProductCover } from './ProductCover';
import { ArrowUpRight, Eye } from 'lucide-react';

export interface ProductCardProps {
  id: string;
  slug: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  currency?: string;
  format: string;
  pageCount?: number | null;
  level?: string | null;
  isBestseller?: boolean;
  isFeatured?: boolean;
  onQuickBuy?: (product: { id: string; title: string; price: number; slug: string }) => void;
  onPreview?: (product: { slug: string; title: string; previewPages: string }) => void;
  previewPages?: string;
}

export function ProductCard({
  id,
  slug,
  title,
  category,
  tagline,
  price,
  compareAtPrice,
  format,
  level,
  isBestseller,
  isFeatured,
  onQuickBuy,
  onPreview,
  previewPages,
}: ProductCardProps) {
  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  return (
    <article
      className="product-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-main)',
        borderRadius: 'var(--radius-sm)',
        padding: '20px',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        position: 'relative',
        height: '100%',
      }}
    >
      {/* Top Cover Visual */}
      <div style={{ position: 'relative', marginBottom: '18px' }}>
        <Link href={`/products/${slug}`} tabIndex={-1} aria-label={`View ${title}`}>
          <ProductCover
            title={title}
            category={category}
            tagline={tagline}
            format={format}
            level={level}
            variant="card"
          />
        </Link>

        {/* Floating status badge */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px', zIndex: 4 }}>
          {isBestseller && <span className="badge badge-bestseller">Bestseller</span>}
          {isFeatured && !isBestseller && <span className="badge badge-featured">Featured</span>}
        </div>
      </div>

      {/* Content Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
            }}
          >
            {category.replace('_', ' ')}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {format}
          </span>
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.25rem',
            lineHeight: 1.25,
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          <Link href={`/products/${slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {title}
          </Link>
        </h3>

        <p
          style={{
            fontSize: '0.86rem',
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            marginBottom: '18px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {tagline}
        </p>
      </div>

      {/* Bottom Pricing & Actions */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '14px',
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
              ₹{price}
            </span>
            {compareAtPrice && compareAtPrice > price && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                ₹{compareAtPrice}
              </span>
            )}
            {discountPercent && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--status-success)',
                  backgroundColor: 'var(--accent-forest-bg)',
                  padding: '2px 6px',
                  borderRadius: '2px',
                }}
              >
                -{discountPercent}%
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
            Instant digital access
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {onPreview && previewPages && (
            <button
              type="button"
              onClick={() => onPreview({ slug, title, previewPages })}
              className="btn btn-secondary btn-sm"
              title="Preview sample pages"
              aria-label={`Preview ${title}`}
            >
              <Eye size={14} />
              <span>Preview</span>
            </button>
          )}

          {onQuickBuy ? (
            <button
              type="button"
              onClick={() => onQuickBuy({ id, title, price, slug })}
              className="btn btn-primary btn-sm"
              aria-label={`Buy ${title} for ₹${price}`}
            >
              <span>Buy</span>
              <ArrowUpRight size={14} />
            </button>
          ) : (
            <Link href={`/products/${slug}`} className="btn btn-primary btn-sm">
              <span>View</span>
              <ArrowUpRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
