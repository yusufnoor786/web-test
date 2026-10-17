'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, BookOpen, ArrowRight } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { FilterSortBar, FilterState } from './FilterSortBar';
import { CheckoutModal } from './CheckoutModal';
import { ProductPreviewModal } from './ProductPreviewModal';

interface StoreProduct {
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
  sortOrder: number;
  createdAt: Date;
}

interface StoreClientProps {
  initialProducts: StoreProduct[];
}

function StoreClientContent({ initialProducts }: StoreClientProps) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'ALL';

  const [filters, setFilters] = useState<FilterState>({
    category: initialCategory,
    level: 'ALL',
    sortBy: 'featured',
    searchQuery: '',
  });

  // Sync category if URL param changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setFilters((prev) => ({ ...prev, category: cat.toUpperCase() }));
    }
  }, [searchParams]);

  // Modals state
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

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((p) => {
        // Category (robust singular/plural matching)
        if (filters.category !== 'ALL') {
          const catFilter = filters.category.toUpperCase().replace(/S$/, '');
          const pCat = p.category.toUpperCase().replace(/S$/, '');
          if (pCat !== catFilter && !pCat.includes(catFilter) && !catFilter.includes(pCat)) {
            return false;
          }
        }

        // Level
        if (filters.level !== 'ALL') {
          if (!p.level || !p.level.toUpperCase().includes(filters.level)) {
            return false;
          }
        }

        // Search Query
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchTagline = p.tagline.toLowerCase().includes(q);
          const matchCategory = p.category.toLowerCase().includes(q);
          if (!matchTitle && !matchTagline && !matchCategory) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'price_asc') return a.price - b.price;
        if (filters.sortBy === 'price_desc') return b.price - a.price;
        if (filters.sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        // default: featured
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return a.sortOrder - b.sortOrder;
      });
  }, [initialProducts, filters]);

  return (
    <div style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      <div className="container">
        {/* Page Header */}
        <div style={{ maxWidth: '640px', marginBottom: '36px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--text-muted)',
            }}
          >
            Digital Publishing Archive
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              marginTop: '4px',
              marginBottom: '10px',
            }}
          >
            The Complete Knowledge Library
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
            Structured marketing master notes, action playbooks, operational templates, wireframe guides, and real spend post-mortems. Single-operator license with instant cryptographic delivery.
          </p>
        </div>

        {/* Live Search Bar */}
        <div
          style={{
            position: 'relative',
            marginBottom: '24px',
            maxWidth: '480px',
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="search"
            placeholder="Search by keyword, topic, or objective..."
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
            className="input-field"
            style={{ paddingLeft: '38px', borderRadius: 'var(--radius-sm)' }}
          />
        </div>

        {/* Filter and Sort Toolbar */}
        <FilterSortBar
          currentFilters={filters}
          onFilterChange={handleFilterChange}
          totalProductsCount={filteredProducts.length}
        />

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-main)',
              borderRadius: 'var(--radius-sm)',
              padding: '60px 20px',
              textAlign: 'center',
            }}
          >
            <BookOpen size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>No products match your filters</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Try adjusting your category selection or clearing the search query.
            </p>
            <button
              type="button"
              onClick={() =>
                setFilters({
                  category: 'ALL',
                  level: 'ALL',
                  sortBy: 'featured',
                  searchQuery: '',
                })
              }
              className="btn btn-secondary"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {filteredProducts.map((p) => (
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
        )}
      </div>

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
        previewPagesJson={previewData?.previewPages}
        price={previewData?.price}
        onBuy={() => {
          if (previewData) {
            const matched = initialProducts.find((p) => p.slug === previewData.slug);
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
    </div>
  );
}

export function StoreClient({ initialProducts }: StoreClientProps) {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 0' }}><div className="skeleton" style={{ height: '300px' }} /></div>}>
      <StoreClientContent initialProducts={initialProducts} />
    </Suspense>
  );
}
