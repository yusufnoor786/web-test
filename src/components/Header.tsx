'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Download, Menu, X, ArrowRight } from 'lucide-react';
import { SearchModal } from './SearchModal';

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'rgba(251, 249, 245, 0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--border-main)',
          transition: 'border-color 0.2s ease',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '70px',
          }}
        >
          {/* Logo & Monogram */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              href="/"
              style={{
                display: 'flex',
                flexDirection: 'column',
                textDecoration: 'none',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  color: 'var(--text-primary)',
                  lineHeight: 1.1,
                  textTransform: 'uppercase',
                }}
              >
                The Growth Archive
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.62rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                Field-Tested Digital Products
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '26px',
            }}
            className="desktop-nav"
          >
            <Link
              href="/store"
              style={{
                fontSize: '0.88rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
              }}
            >
              All Products
            </Link>
            <Link
              href="/store?category=NOTES"
              style={{
                fontSize: '0.88rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
              }}
            >
              Notes
            </Link>
            <Link
              href="/store?category=GUIDES"
              style={{
                fontSize: '0.88rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
              }}
            >
              Guides
            </Link>
            <Link
              href="/store?category=PLAYBOOKS"
              style={{
                fontSize: '0.88rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
              }}
            >
              Playbooks
            </Link>
            <Link
              href="/store?category=TEMPLATES"
              style={{
                fontSize: '0.88rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
              }}
            >
              Templates
            </Link>
            <Link
              href="/about"
              style={{
                fontSize: '0.88rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
              }}
            >
              About
            </Link>
          </nav>

          {/* Right Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Search Trigger Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-main)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.82rem',
              }}
              aria-label="Open search"
            >
              <Search size={15} />
              <span className="search-hotkey-label" style={{ color: 'var(--text-muted)' }}>
                Search...
              </span>
            </button>

            {/* Purchases / Downloads Link */}
            <Link
              href="/purchases"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                padding: '7px 10px',
              }}
              title="Access your purchases and downloads"
            >
              <Download size={15} />
              <span className="purchases-label">My Purchases</span>
            </Link>

            {/* Primary CTA */}
            <Link
              href="/store"
              className="btn btn-primary btn-sm desktop-cta"
              style={{ textDecoration: 'none' }}
            >
              <span>Explore Library</span>
              <ArrowRight size={13} />
            </Link>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '6px',
              }}
              className="mobile-menu-toggle"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div
            style={{
              padding: '16px 24px 24px 24px',
              backgroundColor: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-main)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
            className="mobile-drawer"
          >
            <Link
              href="/store"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ fontSize: '1rem', fontWeight: 600, textDecoration: 'none', color: 'var(--text-primary)' }}
            >
              All Products
            </Link>
            <Link
              href="/store?category=NOTES"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              Notes
            </Link>
            <Link
              href="/store?category=GUIDES"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              Guides
            </Link>
            <Link
              href="/store?category=PLAYBOOKS"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              Playbooks
            </Link>
            <Link
              href="/store?category=TEMPLATES"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              Templates
            </Link>
            <Link
              href="/store?category=CASE_STUDIES"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              Case Studies
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              About the Author
            </Link>
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                href="/purchases"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                <Download size={16} />
                <span>My Purchases & Downloads</span>
              </Link>
              <Link
                href="/store"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <span>Browse All Products</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
