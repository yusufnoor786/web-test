'use client';

import React from 'react';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export interface FilterState {
  category: string;
  level: string;
  sortBy: string;
  searchQuery: string;
}

interface FilterSortBarProps {
  currentFilters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  totalProductsCount: number;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Products' },
  { id: 'NOTES', label: 'Notes' },
  { id: 'GUIDES', label: 'Guides' },
  { id: 'PLAYBOOKS', label: 'Playbooks' },
  { id: 'TEMPLATES', label: 'Templates' },
  { id: 'CASE_STUDIES', label: 'Case Studies' },
  { id: 'BUNDLES', label: 'Bundles' },
];

const LEVELS = [
  { id: 'ALL', label: 'All Levels' },
  { id: 'BEGINNER', label: 'Beginner' },
  { id: 'INTERMEDIATE', label: 'Intermediate' },
  { id: 'ADVANCED', label: 'Advanced' },
];

const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured First' },
  { id: 'price_asc', label: 'Price: Low → High' },
  { id: 'price_desc', label: 'Price: High → Low' },
  { id: 'newest', label: 'Newest Releases' },
];

export function FilterSortBar({ currentFilters, onFilterChange, totalProductsCount }: FilterSortBarProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-main)',
        borderRadius: 'var(--radius-sm)',
        padding: '16px 20px',
        marginBottom: '32px',
      }}
    >
      {/* Category Tabs Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-subtle)',
          scrollbarWidth: 'none',
        }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = currentFilters.category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onFilterChange({ category: cat.id })}
              style={{
                padding: '6px 14px',
                fontSize: '0.84rem',
                fontFamily: 'var(--font-sans)',
                fontWeight: isActive ? 600 : 400,
                borderRadius: 'var(--radius-full)',
                border: isActive ? '1px solid var(--text-primary)' : '1px solid var(--border-main)',
                backgroundColor: isActive ? 'var(--text-primary)' : 'transparent',
                color: isActive ? 'var(--bg-surface)' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Secondary Controls: Level + Sort + Count */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          paddingTop: '12px',
        }}
      >
        {/* Level Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <SlidersHorizontal size={13} />
            Level:
          </span>
          <select
            value={currentFilters.level}
            onChange={(e) => onFilterChange({ level: e.target.value })}
            style={{
              padding: '4px 8px',
              fontSize: '0.82rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-main)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            {LEVELS.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                {lvl.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort & Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {totalProductsCount} {totalProductsCount === 1 ? 'Product' : 'Products'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
            <ArrowUpDown size={13} style={{ color: 'var(--text-muted)' }} />
            <select
              value={currentFilters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value })}
              style={{
                padding: '4px 8px',
                fontSize: '0.82rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-main)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
