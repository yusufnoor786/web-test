'use client';

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Lock, ShieldCheck, FileText, ListFilter, Loader2, Sparkles } from 'lucide-react';

export interface PreviewPageItem {
  page: number;
  title: string;
  content: string;
}

interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  productSlug?: string;
  previewPagesJson?: string;
  onBuy?: () => void;
  price?: number;
}

export function ProductPreviewModal({
  isOpen,
  onClose,
  productTitle,
  productSlug,
  previewPagesJson,
  onBuy,
  price,
}: ProductPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'outline'>('pdf');
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Parse text preview pages if provided
  let textPages: PreviewPageItem[] = [];
  try {
    if (previewPagesJson) {
      const parsed = JSON.parse(previewPagesJson);
      if (Array.isArray(parsed)) {
        textPages = parsed.map((item, idx) => {
          if (typeof item === 'string') {
            return {
              page: idx + 1,
              title: `Section ${idx + 1}`,
              content: item,
            };
          }
          return item;
        });
      }
    }
  } catch (e) {
    console.error('Failed to parse previewPagesJson:', e);
  }

  // Fallback outline if text pages empty
  if (textPages.length === 0) {
    textPages = [
      {
        page: 1,
        title: 'Executive Summary & Operating Framework',
        content:
          'Comprehensive distilled operating procedures, tactical checklists, and structured methodologies ready for direct implementation.',
      },
      {
        page: 2,
        title: 'Tactical Execution Protocols',
        content:
          'Step-by-step battle-tested frameworks audited for clarity and real-world utility across campaign setups and testing cycles.',
      },
    ];
  }

  // Reset tab and loading state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('pdf');
      setIsPdfLoading(true);
      setPdfLoadError(false);
      setCurrentPageIndex(0);
    }
  }, [isOpen, productSlug]);

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

  const pdfPreviewUrl = productSlug
    ? `/api/products/${productSlug}/preview#toolbar=0&navpanes=0&view=FitH`
    : null;
  const rawPreviewUrl = productSlug ? `/api/products/${productSlug}/preview` : null;

  const activePage = textPages[currentPageIndex] || textPages[0];

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
      style={{
        zIndex: 9999,
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '920px',
          width: '100%',
          height: 'min(92vh, 880px)',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '8px',
          border: '1px solid var(--border-main)',
          boxShadow: 'var(--shadow-xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginBottom: '2px',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'var(--accent-primary-light, rgba(235, 94, 40, 0.1))',
                  color: 'var(--accent-primary, #EB5E28)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                }}
              >
                <Sparkles size={11} />
                Live PDF Sample
              </span>
              <span>•</span>
              <span>Pages 1–3 Preview</span>
            </div>
            <h4
              id="preview-title"
              style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {productTitle}
            </h4>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {rawPreviewUrl && (
              <a
                href={rawPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                title="Open sample PDF in a full-screen browser tab"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  padding: '6px 12px',
                }}
              >
                <ExternalLink size={13} />
                <span>Open in Tab</span>
              </a>
            )}

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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Selector & Notice Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 20px',
            backgroundColor: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              style={{
                background: activeTab === 'pdf' ? 'var(--bg-surface)' : 'transparent',
                border: activeTab === 'pdf' ? '1px solid var(--border-main)' : '1px solid transparent',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '0.8rem',
                fontWeight: activeTab === 'pdf' ? 700 : 500,
                color: activeTab === 'pdf' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FileText size={14} />
              <span>Interactive PDF Sample</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('outline')}
              style={{
                background: activeTab === 'outline' ? 'var(--bg-surface)' : 'transparent',
                border: activeTab === 'outline' ? '1px solid var(--border-main)' : '1px solid transparent',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '0.8rem',
                fontWeight: activeTab === 'outline' ? 700 : 500,
                color: activeTab === 'outline' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ListFilter size={14} />
              <span>Overview & Outline</span>
            </button>
          </div>

          <div
            style={{
              fontSize: '0.73rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Lock size={12} />
            <span>Watermarked Sample · Remaining pages locked until purchase</span>
          </div>
        </div>

        {/* Content Body */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#2A2B2E',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {activeTab === 'pdf' && pdfPreviewUrl && !pdfLoadError ? (
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {isPdfLoading && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(26, 27, 30, 0.85)',
                    color: '#FFFFFF',
                    gap: '12px',
                    zIndex: 5,
                  }}
                >
                  <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent-primary, #EB5E28)' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Loading sample pages from document...</span>
                </div>
              )}

              <iframe
                src={pdfPreviewUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: '#323639',
                }}
                title={`Sample preview of ${productTitle}`}
                onLoad={() => setIsPdfLoading(false)}
                onError={() => {
                  setIsPdfLoading(false);
                  setPdfLoadError(true);
                }}
              />
            </div>
          ) : (
            /* Outline / Fallback View */
            <div
              style={{
                flex: 1,
                padding: '36px',
                overflowY: 'auto',
                backgroundColor: '#FFFDF9',
                position: 'relative',
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
                  opacity: 0.05,
                  transform: 'rotate(-25deg)',
                  fontSize: '2.5rem',
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

              <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px', margin: '0 auto' }}>
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
                  <span>DOCUMENT HIGHLIGHTS</span>
                  <span>SAMPLE EXCERPT</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  {textPages.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentPageIndex(idx)}
                      style={{
                        background: currentPageIndex === idx ? 'var(--text-primary)' : '#EAE5DC',
                        color: currentPageIndex === idx ? '#FFFFFF' : 'var(--text-secondary)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Section {idx + 1}
                    </button>
                  ))}
                </div>

                <h2
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '1.4rem',
                    fontWeight: 600,
                    color: '#1A202C',
                    marginBottom: '16px',
                    lineHeight: 1.3,
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

                {/* Locked notice */}
                <div
                  style={{
                    marginTop: '32px',
                    padding: '16px',
                    border: '1px dashed #DCD6CC',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(244, 239, 234, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Lock size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <div>
                    <strong>Complete Document Protected:</strong> The full comprehensive edition contains all chapters, actionable operating playbooks, and resource links.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Buy CTA */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-main)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
              }}
            >
              <ShieldCheck size={15} style={{ color: 'var(--status-success, #2A9D8F)' }} />
              <span>Instant Download & Single-Operator License</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ padding: '8px 16px' }}
            >
              Close
            </button>

            {onBuy && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBuy();
                }}
                className="btn btn-primary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 20px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                }}
              >
                <Lock size={14} />
                <span>Buy & Download {price ? `— ₹${price}` : ''}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
