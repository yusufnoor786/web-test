import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Digital Product License Agreement | The Growth Archive',
  description: 'Single-operator licensing terms for The Growth Archive digital products.',
};

export default function LicensePage() {
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
          Licensing Terms
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 3.5vw, 2.6rem)',
            marginTop: '6px',
            marginBottom: '24px',
          }}
        >
          Single-Operator Product License
        </h1>

        <div style={{ fontSize: '0.98rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          <p>
            When you purchase any dossier, playbook, template, or bundle from The Growth Archive, you are granted a non-exclusive, non-transferable, revocable single-operator license.
          </p>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '32px', marginBottom: '12px', color: 'var(--text-primary)' }}>
            What You ARE Permitted to Do:
          </h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
            <li>Store and read the digital files across your personal computers, tablets, and phones.</li>
            <li>Apply the frameworks, spreadsheets, and SOPs directly to manage campaigns for your own company or active client retainers.</li>
            <li>Customize the provided templates (Notion, Google Sheets, Briefs) for your internal workflows.</li>
          </ul>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '32px', marginBottom: '12px', color: 'var(--text-primary)' }}>
            What You Are NOT Permitted to Do:
          </h3>
          <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
            <li>You may not redistribute, resell, sub-license, leak, or share access links publicly or in private communities/drives.</li>
            <li>You may not repackage the text, frameworks, or spreadsheets into derivative digital products, paid courses, or public blog posts.</li>
            <li>You may not bypass or share private download tokens. Each token is monitored for automated scrapers and excessive IP dispersion.</li>
          </ul>

          <p>
            If you represent an agency or enterprise team requiring multi-seat company licensing for more than 5 operators, please reach out via our{' '}
            <Link href="/contact" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>
              Contact Page
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
