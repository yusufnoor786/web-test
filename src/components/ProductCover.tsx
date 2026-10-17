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
  // Theme color and styling based on editorial category (supports singular and plural)
  const cat = (category || '').toUpperCase().trim();

  let themeClass = 'cover-theme-playbook';
  let badgeLabel = 'PLAYBOOK';
  let titleColor = '#FFFFFF';
  let accentColor = '#A5B4FC';
  let taglineColor = 'rgba(248, 250, 252, 0.88)';
  let borderColor = 'rgba(165, 180, 252, 0.35)';

  if (cat.includes('NOTE')) {
    themeClass = 'cover-theme-notes';
    badgeLabel = 'FIELD NOTE';
    titleColor = '#78350F';
    accentColor = '#B45309';
    taglineColor = '#92400E';
    borderColor = 'rgba(180, 83, 9, 0.35)';
  } else if (cat.includes('GUIDE')) {
    themeClass = 'cover-theme-guide';
    badgeLabel = 'OPERATOR GUIDE';
    titleColor = '#FFFFFF';
    accentColor = '#6EE7B7';
    taglineColor = 'rgba(236, 253, 245, 0.9)';
    borderColor = 'rgba(110, 231, 183, 0.35)';
  } else if (cat.includes('TEMPLATE')) {
    themeClass = 'cover-theme-template';
    badgeLabel = 'SYSTEM TEMPLATE';
    titleColor = '#FFFFFF';
    accentColor = '#C4B5FD';
    taglineColor = 'rgba(245, 243, 255, 0.9)';
    borderColor = 'rgba(196, 181, 253, 0.35)';
  } else if (cat.includes('CASE')) {
    themeClass = 'cover-theme-casestudy';
    badgeLabel = 'CASE STUDY';
    titleColor = '#FFFFFF';
    accentColor = '#FDA4AF';
    taglineColor = 'rgba(255, 241, 242, 0.9)';
    borderColor = 'rgba(253, 164, 175, 0.35)';
  } else if (cat.includes('BUNDLE')) {
    themeClass = 'cover-theme-bundle';
    badgeLabel = 'COMPLETE VAULT';
    titleColor = '#FDE68A';
    accentColor = '#F59E0B';
    taglineColor = 'rgba(254, 243, 199, 0.92)';
    borderColor = 'rgba(245, 158, 11, 0.4)';
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
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: isHero
          ? '0 25px 50px -12px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.12)'
          : '0 10px 25px -5px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.08)',
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
          width: isThumb ? '6px' : '12px',
          background: 'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.18) 35%, rgba(0,0,0,0.2) 100%)',
          zIndex: 2,
        }}
      />

      {/* Glossy Sheen Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.18) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Top Section: Header & Volume Info */}
      <div style={{ zIndex: 3, position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${borderColor}`,
            paddingBottom: isThumb ? '4px' : '8px',
            color: accentColor,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: isThumb ? '0.55rem' : '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {badgeLabel}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: isThumb ? '0.55rem' : '0.68rem',
              letterSpacing: '0.06em',
              fontWeight: 600,
            }}
          >
            ED. 2026
          </span>
        </div>

        <div
          style={{
            marginTop: isThumb ? '6px' : '14px',
            fontSize: isThumb ? '0.55rem' : '0.7rem',
            fontFamily: 'var(--font-sans)',
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            fontWeight: 700,
            color: accentColor,
            opacity: 0.85,
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
            fontSize: isThumb ? '0.98rem' : isHero ? '2.25rem' : '1.4rem',
            lineHeight: 1.15,
            fontWeight: 700,
            marginBottom: isThumb ? '4px' : '8px',
            letterSpacing: '-0.025em',
            color: titleColor,
            textShadow: titleColor === '#FFFFFF' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
          }}
        >
          {title}
        </h3>

        {!isThumb && tagline && (
          <p
            style={{
              fontSize: isHero ? '0.96rem' : '0.8rem',
              lineHeight: 1.45,
              color: taglineColor,
              display: '-webkit-box',
              WebkitLineClamp: isHero ? 3 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              margin: 0,
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
            borderTop: `1px solid ${borderColor}`,
            paddingTop: isThumb ? '4px' : '8px',
            fontSize: isThumb ? '0.55rem' : '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: accentColor,
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
              fontSize: '0.62rem',
              color: accentColor,
              opacity: 0.75,
              letterSpacing: '0.06em',
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
