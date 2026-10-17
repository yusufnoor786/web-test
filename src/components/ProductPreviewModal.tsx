'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Lock, ShieldCheck } from 'lucide-react';

export interface PreviewPageItem {
  page: number;
  title: string;
  content: string;
}

interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  previewPagesJson?: string;
  onBuy?: () => void;
  price?: number;
}

export function ProductPreviewModal({
  isOpen,
  onClose,
  productTitle,
  previewPagesJson,
  onBuy,
  price,
}: ProductPreviewModalProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  let pages: PreviewPageItem[] = [];
  try {
    if (previewPagesJson) {
      pages = JSON.parse(previewPagesJson);
    }
  } catch (e) {
    console.error('Failed to parse previewPagesJson:', e);
  }

  // Fallback if no preview pages configured
  if (pages.length === 0) {
    pages = [
      {
        page: 1,
        title: 'Document Preface & Executive Summary',
        content:
          'This proprietary digital resource contains distilled field notes, systematic campaign architectures, and proven operating procedures. Every framework has been audited for clarity and real-world utility.',
      },
      {
        page: 2,
        title: 'Core Methodologies & Operating Principles',
        content:
          'Detailed breakdown of deterministic testing rules, allocation guidelines, and high-margin conversion benchmarks. The full edition contains step-by-step checklists and downloadable spreadsheets.',
      },
    ];
  }

  // Lock body scroll and close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activePage = pages[currentPageIndex] || pages[0];

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '680px',
          width: '95%',
          maxHeight: 'min(90vh, 90dvh)',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          backgroundColor: '#FCFAF7',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Interactive Document Sample
            </div>
            <h4 id="preview-title" style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              {productTitle}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '6px',
              borderRadius: '4px',
            }}
            aria-label="Close preview"
          >
            <X size={20} />
          </button>
        </div>

        {/* Page Selector Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            backgroundColor: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            overflowX: 'auto',
          }}
        >
          {pages.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentPageIndex(idx)}
              style={{
                background: currentPageIndex === idx ? 'var(--bg-surface)' : 'transparent',
                border: currentPageIndex === idx ? '1px solid var(--border-main)' : '1px solid transparent',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: currentPageIndex === idx ? 600 : 400,
                color: currentPageIndex === idx ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Page {p.page || idx + 1}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Showing {currentPageIndex + 1} of {pages.length} sample pages
          </span>
        </div>

        {/* Paper Sheet Preview Area with Watermark */}
        <div
          style={{
            flex: 1,
            padding: '36px',
            overflowY: 'auto',
            position: 'relative',
            backgroundColor: '#FFFDF9',
            fontFamily: 'Georgia, serif',
            minHeight: '280px',
          }}
        >
          {/* Diagonal Watermark */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              userSelect: 'none',
              opacity: 0.06,
              transform: 'rotate(-25deg)',
              fontSize: '2.4rem',
              fontWeight: 800,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.15em',
              textAlign: 'center',
              lineHeight: 1.5,
              color: '#121417',
            }}
          >
            THE GROWTH ARCHIVE<br />SAMPLE PREVIEW ONLY
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #EAE5DC',
                paddingBottom: '12px',
                marginBottom: '24px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-sans)',
                color: '#8A857A',
                letterSpacing: '0.05em',
              }}
            >
              <span>THE GROWTH ARCHIVE — CONFIDENTIAL DOSSIER</span>
              <span>SAMPLE EXCERPT</span>
            </div>

            <h2
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#1A202C',
                marginBottom: '16px',
                lineHeight: 1.25,
              }}
            >
              {activePage.title}
            </h2>

            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: '#2D3748',
                whiteSpace: 'pre-line',
              }}
            >
              {activePage.content}
            </div>

            {/* Teaser of locked next chapter */}
            <div
              style={{
                marginTop: '32px',
                padding: '16px',
                border: '1px dashed #DCD6CC',
                borderRadius: '4px',
                backgroundColor: 'rgba(244, 239, 234, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Lock size={18} style={{ color: 'var(--text-muted)' }} />
              <div>
                <strong>Next Section Locked:</strong> Full campaign templates, spreadsheets, and comprehensive checklists are included in the complete download.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Navigation & Buy CTA */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-main)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              disabled={currentPageIndex === 0}
              onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
              className="btn btn-secondary btn-sm"
              aria-label="Previous preview page"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={currentPageIndex >= pages.length - 1}
              onClick={() => setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
              className="btn btn-secondary btn-sm"
              aria-label="Next preview page"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} style={{ color: 'var(--status-success)' }} />
              Instant Download
            </span>
            {onBuy && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBuy();
                }}
                className="btn btn-primary btn-sm"
              >
                <span>Buy & Download {price ? `— ₹${price}` : ''}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
