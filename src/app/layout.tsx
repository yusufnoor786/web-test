import type { Metadata } from 'next';
import Script from 'next/script';
import '@/styles/globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: {
    default: 'The Growth Archive — Practical Digital Marketing Notes, Guides & Playbooks',
    template: '%s | The Growth Archive',
  },
  description:
    'Field-tested digital marketing notes, tactical playbooks, operating system templates, and real growth experiment post-mortems. Built from real campaign spend and battle-tested execution.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  keywords: [
    'Digital Marketing Notes',
    'Meta Ads Playbook',
    'Google Ads Playbook',
    'SEO Notes',
    'Marketing Templates',
    'Growth Case Studies',
    'Performance Marketing',
  ],
  authors: [{ name: 'The Growth Archive Editorial' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'The Growth Archive',
    title: 'The Growth Archive — Practical Digital Marketing Knowledge',
    description:
      'Field-tested digital marketing notes, tactical playbooks, operational templates, and growth experiments.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Growth Archive — Digital Marketing Products',
    description:
      'Field-tested digital marketing notes, tactical playbooks, operational templates, and growth experiments.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />

        {/* Razorpay Standard Checkout Script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
