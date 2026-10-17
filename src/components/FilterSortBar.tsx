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
  { id: 'PLAYBOOK', label: 'Playbooks' },
  { id: 'NOTE', label: 'Notes' },
  { id: 'GUIDE', label: 'Guides' },
  { id: 'TEMPLATE', label: 'Templates' },
  { id: 'CASE_STUDY', label: 'Case Studies' },
  { id: 'BUNDLE', label: 'Bundles' },
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
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        marginBottom: '32px',
        boxShadow: 'var(--shadow-sm)',
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
                padding: '7px 16px',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-sans)',
                fontWeight: isActive ? 700 : 500,
                borderRadius: 'var(--radius-full)',
                border: isActive ? '1px solid var(--brand-primary)' : '1px solid var(--border-main)',
                backgroundColor: isActive ? 'var(--brand-primary)' : 'var(--bg-surface)',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 2px 8px rgba(79, 70, 229, 0.28)' : 'var(--shadow-sm)',
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
