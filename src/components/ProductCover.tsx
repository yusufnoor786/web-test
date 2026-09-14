import React from 'react';

interface ProductCoverProps {
  title: string;
  category: string;
  tagline?: string;
  format?: string;
  level?: string | null;
  className?: string;
  variant?: 'card' | 'hero' | 'thumb';
}

export function ProductCover({
  title,
  category,
  tagline,
  format,
  level,
  className = '',
  variant = 'card',
}: ProductCoverProps) {
  // Theme color and styling based on editorial category
  let themeClass = 'cover-theme-playbook';
  let badgeLabel = category.replace('_', ' ');

  switch (category.toUpperCase()) {
    case 'NOTES':
      themeClass = 'cover-theme-notes';
      break;
    case 'GUIDES':
      themeClass = 'cover-theme-guide';
      break;
    case 'PLAYBOOKS':
      themeClass = 'cover-theme-playbook';
      break;
    case 'TEMPLATES':
      themeClass = 'cover-theme-template';
      break;
    case 'CASE_STUDIES':
      themeClass = 'cover-theme-casestudy';
      badgeLabel = 'CASE STUDY';
      break;
    case 'BUNDLES':
      themeClass = 'cover-theme-bundle';
      badgeLabel = 'COMPLETE VAULT';
      break;
  }

  const isHero = variant === 'hero';
  const isThumb = variant === 'thumb';

  return (
    <div
      className={`product-cover ${themeClass} ${variant} ${className}`}
      style={{
        aspectRatio: '3 / 4.1',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isThumb ? '12px' : isHero ? '36px' : '22px',
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: isHero
          ? '0 20px 40px -15px rgba(18, 20, 23, 0.25), 0 0 0 1px rgba(18, 20, 23, 0.08)'
          : '0 8px 20px -8px rgba(18, 20, 23, 0.12), 0 0 0 1px rgba(18, 20, 23, 0.06)',
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
        userSelect: 'none',
      }}
    >
      {/* Decorative Book Spine Texture */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: isThumb ? '5px' : '10px',
          background: 'linear-gradient(90deg, rgba(0,0,0,0.2) 0%, rgba(255,255,255,0.1) 40%, rgba(0,0,0,0.15) 100%)',
          zIndex: 2,
        }}
      />

      {/* Top Section: Header & Volume Info */}
      <div style={{ zIndex: 3, position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid currentColor',
            paddingBottom: isThumb ? '4px' : '8px',
            opacity: 0.85,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: isThumb ? '0.55rem' : '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {badgeLabel}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: isThumb ? '0.55rem' : '0.65rem',
              letterSpacing: '0.05em',
            }}
          >
            ED. 2026
          </span>
        </div>

        <div
          style={{
            marginTop: isThumb ? '6px' : '14px',
            fontSize: isThumb ? '0.55rem' : '0.68rem',
            fontFamily: 'var(--font-sans)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            opacity: 0.65,
          }}
        >
          The Growth Archive
        </div>
      </div>

      {/* Middle Section: Title & Key Narrative */}
      <div style={{ zIndex: 3, position: 'relative', margin: isThumb ? '8px 0' : '16px 0' }}>
        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: isThumb ? '0.95rem' : isHero ? '2.1rem' : '1.35rem',
            lineHeight: 1.15,
            fontWeight: 600,
            marginBottom: isThumb ? '4px' : '8px',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h3>

        {!isThumb && tagline && (
          <p
            style={{
              fontSize: isHero ? '0.95rem' : '0.78rem',
              lineHeight: 1.45,
              opacity: 0.8,
              display: '-webkit-box',
              WebkitLineClamp: isHero ? 3 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              margin: 0,
              color: 'inherit',
            }}
          >
            {tagline}
          </p>
        )}
      </div>

      {/* Bottom Section: Technical Metadata & Publisher Seal */}
      <div style={{ zIndex: 3, position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid currentColor',
            paddingTop: isThumb ? '4px' : '8px',
            fontSize: isThumb ? '0.55rem' : '0.7rem',
            fontFamily: 'var(--font-mono)',
            opacity: 0.85,
          }}
        >
          <span>{format ? format.split('·')[0].trim() : 'Digital PDF'}</span>
          <span>{level || 'Verified'}</span>
        </div>

        {!isThumb && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '6px',
              fontSize: '0.6rem',
              opacity: 0.6,
              letterSpacing: '0.04em',
            }}
          >
            <span>OFFICIAL DOSSIER</span>
            <span>GA-REF-2026</span>
          </div>
        )}
      </div>
    </div>
  );
}
