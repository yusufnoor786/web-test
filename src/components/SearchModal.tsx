'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Search, X, ArrowRight, BookOpen, Layers } from 'lucide-react';

interface SearchResultItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  tagline: string;
  price: number;
  format: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [allProducts, setAllProducts] = useState<SearchResultItem[]>([]);
  const [isPending, startTransition] = useTransition();

  // Load catalog on first open for instant client search
  useEffect(() => {
    if (isOpen && allProducts.length === 0) {
      fetch('/api/products')
        .then((res) => res.json())
        .then((data) => {
          if (data.products) {
            setAllProducts(data.products);
          }
        })
        .catch((e) => console.error('Error preloading search products:', e));
    }
  }, [isOpen, allProducts.length]);

  // Filter products on query change
  useEffect(() => {
    startTransition(() => {
      if (!query.trim()) {
        setResults(allProducts.slice(0, 5));
        return;
      }

      const q = query.toLowerCase().trim();
      const filtered = allProducts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
      setResults(filtered);
    });
  }, [query, allProducts]);

  // Lock body scroll and close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '620px',
          width: '95%',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '8px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-main)',
            gap: '12px',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <Search size={20} style={{ color: 'var(--text-muted)' }} />
          <input
            id="search-modal-title"
            type="search"
            autoFocus
            placeholder="Search notes, playbooks, guides, templates, keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
              fontSize: '1.05rem',
              color: 'var(--text-primary)',
              backgroundColor: 'transparent',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            aria-label="Close search"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Results / Quick Suggestions */}
        <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '12px 16px' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '8px 8px 12px 8px' }}>
            {query.trim() ? `Search Results (${results.length})` : 'Popular Knowledge Products'}
          </div>

          {results.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>No products found</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Try another keyword or browse all products in the store.
              </p>
              <Link
                href="/store"
                onClick={onClose}
                className="btn btn-outline btn-sm"
                style={{ marginTop: '16px' }}
              >
                Browse All Products →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {results.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.slug}`}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {item.category === 'BUNDLES' ? <Layers size={16} /> : <BookOpen size={16} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {item.category.replace('_', ' ')} · {item.format}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      ₹{item.price}
                    </span>
                    <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--border-main)',
            backgroundColor: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>Press ESC to close</span>
          <Link href="/store" onClick={onClose} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            View Full Catalog →
          </Link>
        </div>
      </div>
    </div>
  );
}
