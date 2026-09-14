import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About the Author & Methodology | The Growth Archive',
  description:
    'The philosophy, real-world campaign background, and editorial principles behind The Growth Archive.',
};

export default function AboutPage() {
  return (
    <div style={{ paddingTop: '56px', paddingBottom: '96px' }}>
      <div className="container-text">
        <span
          style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
          }}
        >
          Editorial Dossier
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.2rem, 4vw, 3rem)',
            marginTop: '6px',
            marginBottom: '24px',
            lineHeight: 1.15,
          }}
        >
          Built in the Ad Accounts, Not in a Lecture Hall
        </h1>

        <div style={{ fontSize: '1.05rem', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
          <p>
            <strong>The Growth Archive</strong> was created to solve a singular problem: the overwhelming noise and superficial advice dominating modern digital marketing.
          </p>

          <p>
            Between YouTube gurus selling drop-shipping fantasies, agencies guarding internal playbooks behind ₹3,00,000/month retainers, and endless social media threads offering recycled platitudes, practical execution knowledge has become rare.
          </p>

          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', marginTop: '40px', marginBottom: '16px', color: 'var(--text-primary)' }}>
            The Ground Rules of This Archive
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <CheckCircle2 size={20} style={{ color: 'var(--status-success)', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>First-Hand Verification Only:</strong> No framework is published unless it has been deployed and measured across live ad spend with verifiable ROAS, CPA, and customer retention.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <CheckCircle2 size={20} style={{ color: 'var(--status-success)', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Zero Filler Pages:</strong> We do not artificially pad documents to hit arbitrary page counts. If a framework requires 40 pages of dense, annotated screenshots, it is 40 pages. If it requires 100 pages, it is 100 pages.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <CheckCircle2 size={20} style={{ color: 'var(--status-success)', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Deterministic Rules:</strong> We replace gut feel with mathematical decision trees. When to turn off an ad set, how to allocate testing budgets, and how to verify attribution deduplication.
              </div>
            </div>
          </div>

          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', marginTop: '40px', marginBottom: '16px', color: 'var(--text-primary)' }}>
            The Author’s Stance
          </h2>

          <p>
            I am a performance marketer and growth operator. Over the past six years, I have managed over ₹2.5 Crores in blended digital advertising spend across Meta, Google Search, and performance affiliate networks. I have scaled direct-to-consumer businesses from scratch to ₹50L/month in top-line revenue, and I have made costly mistakes along the way.
          </p>

          <p>
            The case studies and playbooks published here document both sides of the coin: the winning scaling architectures that delivered 4x blended returns, and the failed tests that burned budget so you don’t have to repeat them.
          </p>

          <div
            style={{
              marginTop: '48px',
              padding: '28px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-main)',
              borderRadius: '6px',
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '8px' }}>
              Ready to explore the field notes?
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Browse the complete catalog of notes, playbooks, and templates.
            </p>
            <Link href="/store" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              <span>Browse Catalog</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
