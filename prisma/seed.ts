import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { hashPassword } from '../src/lib/auth/crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Cleaning existing records in relational order...');
  await prisma.downloadEvent.deleteMany({});
  await prisma.downloadGrant.deleteMany({});
  await prisma.downloadEntitlement.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.refundRecord.deleteMany({});
  await prisma.emailOutbox.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customerSession.deleteMany({});
  await prisma.customerMagicLink.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.bundleItem.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.rateLimitBucket.deleteMany({});
  await prisma.adminSession.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.adminUser.deleteMany({});
  await prisma.contactInquiry.deleteMany({});

  console.log('[Seed] Seeding 10 core digital marketing products...');

  const productsData = [
    {
      slug: 'meta-ads-playbook',
      title: 'Meta Ads Playbook: 2026 Campaign Architecture & Scaling',
      category: 'PLAYBOOK',
      tagline: 'The consolidated campaign framework for scaling profitably in the modern algorithmic auction.',
      description:
        'A comprehensive, tactical playbook for media buyers, growth leads, and founders spending between ₹50,000 and ₹20,00,000/month on Meta. Learn how to structure broad Advantage+ campaigns, systematically isolate and scale creative winners, configure conversion tracking via CAPI, and calculate true blended acquisition costs.',
      priceInPaise: 19900,
      compareAtInPaise: 39900,
      currency: 'INR',
      format: 'PDF Dossier + 3 Spreadsheets',
      pageCount: 104,
      fileSize: '24.2 MB',
      level: 'Intermediate to Advanced',
      tags: JSON.stringify(['Meta Ads', 'Paid Social', 'Media Buying', 'ROAS', 'Creative Strategy', 'CAPI']),
      whatYouLearn: JSON.stringify([
        'How to transition from fragmented ad sets to a high-liquidity, 3-tier campaign architecture.',
        'The exact 7-day creative testing sandbox used to identify winning hooks before scaling spend.',
        'Deterministic kill-switch rules: when to cut losing ads without prematurely choking the algorithm.',
        'How to set up Conversions API (CAPI) and verify server-side event deduplication.',
        'Bid cap and cost cap scaling strategies for high-volume sales days and seasonal spikes.',
      ]),
      whatsIncluded: JSON.stringify([
        '104-page high-resolution PDF Playbook with annotated screenshots.',
        'Creative Testing Scorecard (Google Sheets template).',
        'CAPI & Pixel Diagnostic Checklist.',
        'Ad Copy Angle Matrix (40 fill-in-the-blank hook formulas).',
        'Lifetime free updates for all 2026 revisions.',
      ]),
      faq: JSON.stringify([
        {
          question: 'Is this suitable for e-commerce or lead generation?',
          answer: 'Both. The consolidated account architecture applies to any objective, with dedicated chapters detailing lead gen forms and DTC purchase optimizations.',
        },
        {
          question: 'Does this cover Advantage+ Shopping Campaigns (ASC)?',
          answer: 'Yes. Chapter 4 is entirely devoted to ASC budgeting, existing customer bid caps, and asset group diversification.',
        },
        {
          question: 'How will I receive this product?',
          answer: 'Immediately after successful checkout, you will receive access in your customer portal with secure on-demand download tokens.',
        },
      ]),
      previewPages: JSON.stringify([
        'Executive Briefing: The historical playbook of hyper-targeting 50 interest ad sets is dead. Meta’s auction rewards liquidity above all else.',
        'The 3-Tier Sandbox Architecture: We isolate spending into three distinct buckets: Sandbox, Scaling, and Retention.',
        'Deterministic Cut & Scale Decision Tree: Never rely on emotional gut feelings. Use deterministic thresholds for thumb-stop and CTR.',
      ]),
      storageKey: 'products/meta-ads-playbook.pdf',
      checksumSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      isPublished: true,
      isFeatured: true,
      isBestseller: true,
      sortOrder: 1,
    },
    {
      slug: 'seo-master-notes',
      title: 'SEO Master Notes: Information Architecture & Ranking Signals',
      category: 'NOTE',
      tagline: 'Structured, no-fluff technical and editorial notes on building defensible topical authority.',
      description:
        'A dense, reference-grade notebook covering modern organic search. From schema entity graphs and crawl budget management to programmatic SEO architectures and topic cluster mapping, these notes serve as an everyday handbook for serious search practitioners.',
      priceInPaise: 14900,
      compareAtInPaise: 29900,
      currency: 'INR',
      format: 'PDF Notebook',
      pageCount: 68,
      fileSize: '14.8 MB',
      level: 'Advanced',
      tags: JSON.stringify(['SEO', 'Technical SEO', 'Topical Authority', 'Schema', 'Information Architecture']),
      whatYouLearn: JSON.stringify([
        'Building hierarchical topic clusters that build reciprocal internal link equity.',
        'Configuring JSON-LD schema entity graphs to claim Knowledge Graph ownership.',
        'Preventing crawl budget waste on large dynamic catalogs and faceted navigation.',
        'Reverse-engineering competitor ranking signals with deterministic content delta audits.',
      ]),
      whatsIncluded: JSON.stringify([
        '68-page reference PDF with syntax diagrams and code samples.',
        'JSON-LD Schema Template Library (Organization, Product, Article, FAQPage).',
        'Topical Cluster Mapping Notion Board template.',
      ]),
      faq: JSON.stringify([
        {
          question: 'Are these notes focused on algorithmic search or generative engines (GEO)?',
          answer: 'Both. The notes focus on semantic entity optimization, which forms the underlying knowledge structure parsed by both Google Search and LLM answer engines.',
        },
      ]),
      previewPages: JSON.stringify([
        'Entity Graphs vs Keywords: Modern search engines rank entities and relationships, not isolated keyword densities.',
        'Hierarchical Topic Modeling: The mathematical structure of tier-1 hubs and tier-2 spokes.',
      ]),
      storageKey: 'products/seo-master-notes.pdf',
      checksumSha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      isPublished: true,
      isFeatured: true,
      isBestseller: false,
      sortOrder: 2,
    },
    {
      slug: 'high-converting-landing-page-guide',
      title: 'High-Converting Landing Pages: Visual Hierarchy & Copy Systems',
      category: 'GUIDE',
      tagline: 'The wireframe and copywriting framework for turning paid clicks into paying customers.',
      description:
        'A comprehensive guide to conversion rate optimization (CRO) built around 18 proven structural archetypes. Learn how to craft above-the-fold value propositions, write objection-crushing microcopy, and optimize mobile load speed for maximum conversion yield.',
      priceInPaise: 12900,
      compareAtInPaise: 24900,
      currency: 'INR',
      format: 'PDF Guide + Figma Wireframe Kit',
      pageCount: 82,
      fileSize: '32.1 MB',
      level: 'All Levels',
      tags: JSON.stringify(['CRO', 'Landing Pages', 'Copywriting', 'Design Systems', 'Figma', 'UX']),
      whatYouLearn: JSON.stringify([
        'The 5-second clarity test for above-the-fold headline and visual alignment.',
        'How to arrange trust badges, social proof, and comparison tables for maximum impact.',
        'Mobile-first layout hygiene: sticky CTAs, tap target ergonomics, and form friction removal.',
      ]),
      whatsIncluded: JSON.stringify([
        '82-page illustrated conversion guide.',
        'Figma UI Kit containing 18 ready-to-use landing page section wireframes.',
        'Copywriting swipe file with 50 high-converting headline templates.',
      ]),
      faq: JSON.stringify([
        {
          question: 'Do I need Figma experience to use this?',
          answer: 'No. The PDF guide explains all psychological and architectural principles independently. The Figma kit is an optional bonus for designers and builders.',
        },
      ]),
      previewPages: JSON.stringify([
        'Above-the-Fold Psychology: Why visitors bounce before scrolling and the exact 4 elements required in the primary viewport.',
        'Social Proof Placement Dynamics: Positioning testimonial quotes alongside objection triggers.',
      ]),
      storageKey: 'products/high-converting-landing-page-guide.pdf',
      checksumSha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      isPublished: true,
      isFeatured: false,
      isBestseller: true,
      sortOrder: 3,
    },
    {
      slug: 'b2b-growth-engine-playbook',
      title: 'B2B Growth Engine: Outbound Systems & Pipeline Velocity',
      category: 'PLAYBOOK',
      tagline: 'The blueprint for predictable enterprise pipeline generation without spamming.',
      description:
        'A rigorous operating manual for B2B founders, revenue leaders, and demand generation managers. Covers account identification, warm intent triggers, multi-threaded LinkedIn and email orchestration, and sales enablement handoffs.',
      priceInPaise: 17900,
      compareAtInPaise: 34900,
      currency: 'INR',
      format: 'PDF Playbook + CRM Setup Schema',
      pageCount: 96,
      fileSize: '19.4 MB',
      level: 'Intermediate to Advanced',
      tags: JSON.stringify(['B2B', 'Demand Gen', 'Outbound', 'Pipeline', 'Cold Email', 'LinkedIn']),
      whatYouLearn: JSON.stringify([
        'Scoring target accounts based on job postings, tech stack changes, and hiring intent.',
        'Designing 4-touch personalized outreach sequences that generate 12%+ positive reply rates.',
        'Aligning SDR prospecting with marketing-driven content syndication.',
      ]),
      whatsIncluded: JSON.stringify([
        '96-page comprehensive tactical playbook.',
        'HubSpot & Salesforce pipeline stage configuration blueprints.',
        '15 proven B2B cold email sequence templates.',
      ]),
      faq: JSON.stringify([
        {
          question: 'Is this focused on enterprise or mid-market?',
          answer: 'The strategies are optimized for deal sizes ranging from ₹3L to ₹50L Annual Contract Value (ACV).',
        },
      ]),
      previewPages: JSON.stringify([
        'Intent Trigger Mapping: Spotting buying signals before competitors reach out.',
        'Multi-Threaded Outreach Workflows: Coordinating touchpoints across executive decision makers.',
      ]),
      storageKey: 'products/b2b-growth-engine-playbook.pdf',
      checksumSha256: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
      isPublished: true,
      isFeatured: false,
      isBestseller: false,
      sortOrder: 4,
    },
    {
      slug: 'marketing-analytics-attribution-notes',
      title: 'Marketing Analytics & Attribution: The First-Party Data Handbook',
      category: 'NOTE',
      tagline: 'Technical notes on server-side tracking, blended metrics, and attribution reality.',
      description:
        'A field manual for resolving the tracking chaos caused by privacy updates and browser tracking restrictions. Detailed technical notes covering Google Tag Manager Server-Side, UTM governance, Blended CAC calculation, and Marketing Mix Modeling (MMM) basics.',
      priceInPaise: 16900,
      compareAtInPaise: 29900,
      currency: 'INR',
      format: 'PDF Technical Dossier',
      pageCount: 58,
      fileSize: '11.2 MB',
      level: 'Advanced',
      tags: JSON.stringify(['Analytics', 'Attribution', 'GA4', 'Server-Side GTM', 'Tracking', 'UTM']),
      whatYouLearn: JSON.stringify([
        'Setting up Server-Side GTM on Cloud Run to bypass ad blockers cleanly and legally.',
        'Creating a resilient UTM taxonomy across all organic and paid channels.',
        'Calculating Blended CAC and Marketing Efficiency Ratio (MER) without platform bias.',
      ]),
      whatsIncluded: JSON.stringify([
        '58-page technical manual with architectural diagrams.',
        'UTM Builder & Tracking Governance Spreadsheet.',
        'GTM Web and Server Container export JSONs.',
      ]),
      faq: JSON.stringify([
        {
          question: 'Do I need developer skills to implement server-side tracking?',
          answer: 'Basic understanding of DNS and cloud containers is helpful; the guide provides step-by-step terminal commands and cloud configurations.',
        },
      ]),
      previewPages: JSON.stringify([
        'The Illusion of Platform ROAS: Why adding platform metrics together produces fictional revenue.',
        'Server-Side Event Architecture: Routing payloads directly to Meta CAPI and GA4.',
      ]),
      storageKey: 'products/marketing-analytics-attribution-notes.pdf',
      checksumSha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
      isPublished: true,
      isFeatured: false,
      isBestseller: false,
      sortOrder: 5,
    },
    {
      slug: 'growth-experiment-operating-system',
      title: 'The Growth Experiment OS: Notion Workspace & Prioritization System',
      category: 'TEMPLATE',
      tagline: 'The battle-tested Notion operating system for managing rapid marketing experimentation.',
      description:
        'Stop managing marketing in chaotic spreadsheets. This turnkey Notion operating system brings rigorous scientific method to your marketing team. Features automated ICE scoring, backlog grooming, hypothesis documentation, and post-mortem analysis dashboards.',
      priceInPaise: 14900,
      compareAtInPaise: 29900,
      currency: 'INR',
      format: 'Notion Workspace + Walkthrough PDF',
      pageCount: 42,
      fileSize: '8.6 MB',
      level: 'All Levels',
      tags: JSON.stringify(['Notion', 'Growth OS', 'Experimentation', 'ICE Scoring', 'Agile Marketing']),
      whatYouLearn: JSON.stringify([
        'Implementing the weekly growth sprint rhythm used by elite growth teams.',
        'Formulating falsifiable hypotheses with clear statistical success metrics.',
        'Cataloging learnings so failed experiments still build institutional knowledge.',
      ]),
      whatsIncluded: JSON.stringify([
        '1-Click Duplicate Notion Workspace with relational databases.',
        '42-page implementation manual explaining sprint ceremonies.',
        '50 pre-loaded marketing experiment cards with execution blueprints.',
      ]),
      faq: JSON.stringify([
        {
          question: 'Does this require a paid Notion plan?',
          answer: 'No. The workspace works 100% on the free personal Notion tier.',
        },
      ]),
      previewPages: JSON.stringify([
        'The ICE Prioritization Engine: Scoring Impact, Confidence, and Ease objectively.',
        'Experiment Card Anatomy: Hypotheses, variables, metrics, and documentation standards.',
      ]),
      storageKey: 'products/growth-experiment-operating-system.pdf',
      checksumSha256: 'b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1',
      isPublished: true,
      isFeatured: true,
      isBestseller: true,
      sortOrder: 6,
    },
    {
      slug: 'email-marketing-automation-vault',
      title: 'Email Marketing & Retention Vault: Flow Architectures & Lifecycle Copy',
      category: 'PLAYBOOK',
      tagline: 'The complete automated customer lifecycle playbook for recurring revenue.',
      description:
        'A comprehensive teardown of high-converting retention sequences. Includes detailed copy, trigger logic, and delay recommendations for Welcome series, Abandoned Checkout, Browse Abandonment, Customer Win-Back, and Post-Purchase onboarding flows.',
      priceInPaise: 15900,
      compareAtInPaise: 29900,
      currency: 'INR',
      format: 'PDF Dossier + Klaviyo/MailerLite Flow Maps',
      pageCount: 76,
      fileSize: '16.5 MB',
      level: 'All Levels',
      tags: JSON.stringify(['Email Marketing', 'Retention', 'Klaviyo', 'Copywriting', 'Lifecycle', 'LTV']),
      whatYouLearn: JSON.stringify([
        'Structuring non-spammy abandoned checkout flows that recover 8-14% of lost carts.',
        'Building dynamic post-purchase educational onboarding that slashes refund rates.',
        'Maintaining pristine domain deliverability and warming fresh sender IPs.',
      ]),
      whatsIncluded: JSON.stringify([
        '76-page tactical lifecycle manual.',
        '32 complete email copy templates with subject line variants.',
        'Visual flow diagrams for Klaviyo, MailerLite, and ActiveCampaign.',
      ]),
      faq: JSON.stringify([
        {
          question: 'Can I use this with any email service provider (ESP)?',
          answer: 'Yes. The trigger logic, timing delays, and copy templates can be implemented in any modern ESP.',
        },
      ]),
      previewPages: JSON.stringify([
        'The 4-Stage Welcome Flow: Moving subscribers from curious observers to first-time buyers.',
        'Dynamic Discount Laddering: Preserving profit margins during checkout recovery.',
      ]),
      storageKey: 'products/email-marketing-automation-vault.pdf',
      checksumSha256: 'c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2',
      isPublished: true,
      isFeatured: false,
      isBestseller: false,
      sortOrder: 7,
    },
    {
      slug: 'dtc-brand-scaling-case-study',
      title: 'Case Study: Scaling a Direct-to-Consumer Brand from Zero to ₹50L/Month',
      category: 'CASE_STUDY',
      tagline: 'An unvarnished, data-rich post-mortem of unit economics, paid media, and creative velocity.',
      description:
        'An exhaustive breakdown of how an Indian consumer brand scaled spend profitably over 14 months. Includes raw ad spend screenshots, monthly P&L statements, creative evolution timelines, and the painful operational mistakes made along the way.',
      priceInPaise: 9900,
      compareAtInPaise: 19900,
      currency: 'INR',
      format: 'PDF Case Study Report',
      pageCount: 52,
      fileSize: '21.0 MB',
      level: 'All Levels',
      tags: JSON.stringify(['Case Study', 'DTC', 'Scaling', 'Unit Economics', 'Real Data', 'Ad Spend']),
      whatYouLearn: JSON.stringify([
        'How unit economics evolved as ad spend scaled from ₹20,000/day to ₹1,50,000/day.',
        'The exact creative fatigue timeline and how creative production was streamlined.',
        'Cash flow management principles for funding inventory during rapid scaling.',
      ]),
      whatsIncluded: JSON.stringify([
        '52-page deep-dive report with financial statements and performance graphs.',
        'Monthly P&L model spreadsheet with contribution margin calculations.',
      ]),
      faq: JSON.stringify([
        {
          question: 'Is the brand identity disclosed?',
          answer: 'Specific brand name is anonymized under NDA, but all metrics, numbers, ad creatives, and financials are 100% authentic and unrounded.',
        },
      ]),
      previewPages: JSON.stringify([
        'Unit Economics at Scale: Understanding contribution margin dollars versus platform ROAS.',
        'The Creative Fatigue Cliff: Why ad formats that won at ₹10L spend failed at ₹30L spend.',
      ]),
      storageKey: 'products/dtc-brand-scaling-case-study.pdf',
      checksumSha256: 'd4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3',
      isPublished: true,
      isFeatured: false,
      isBestseller: false,
      sortOrder: 8,
    },
    {
      slug: 'google-search-pmax-playbook',
      title: 'Google Ads Masterclass: High-Intent Search & Performance Max Architecture',
      category: 'PLAYBOOK',
      tagline: 'How to capture commercial intent efficiently and rein in Performance Max waste.',
      description:
        'A comprehensive guide to dominating Google Ads in 2026. Learn how to structure phrase/exact match search campaigns to capture high-intent buyers, how to audit and control PMax spend with negative keyword scripts, and how to optimize for value-based conversions.',
      priceInPaise: 18900,
      compareAtInPaise: 34900,
      currency: 'INR',
      format: 'PDF Playbook + Script Library',
      pageCount: 88,
      fileSize: '22.8 MB',
      level: 'Intermediate to Advanced',
      tags: JSON.stringify(['Google Ads', 'PMax', 'Search Ads', 'PPC', 'Scripts', 'Intent']),
      whatYouLearn: JSON.stringify([
        'Single-theme ad group structure that preserves keyword relevance and quality score.',
        'How to prevent Performance Max from cannibalizing your brand search traffic.',
        'Automated Google Ads Scripts for budget pacing and broken URL monitoring.',
      ]),
      whatsIncluded: JSON.stringify([
        '88-page illustrated playbook.',
        'Master Negative Keyword List (over 1,200 commercial junk search terms).',
        'Google Ads Script pack for PMax channel spend transparency.',
      ]),
      faq: JSON.stringify([
        {
          question: 'Does this cover Lead Generation or E-commerce Shopping?',
          answer: 'Both. Sections 3-5 focus on search ad intent for services/B2B; sections 6-8 cover Merchant Center and product feed optimizations.',
        },
      ]),
      previewPages: JSON.stringify([
        'Controlling the Black Box: Extracting placement data from Performance Max campaigns.',
        'Negative Keyword Architecture: Protecting search budgets from non-commercial search intent.',
      ]),
      storageKey: 'products/google-search-pmax-playbook.pdf',
      checksumSha256: 'e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4',
      isPublished: true,
      isFeatured: false,
      isBestseller: false,
      sortOrder: 9,
    },
    {
      slug: 'ad-creative-swipe-briefs',
      title: 'Ad Creative Swipe File: 40 High-Performing Direct Response Briefs',
      category: 'TEMPLATE',
      tagline: 'Deconstructed static and video ad formulas that consistently stop the scroll.',
      description:
        'Never stare at a blank creative brief again. This collection breaks down 40 proven ad formats across DTC, B2B, and SaaS. Each brief includes visual storyboard references, psychological hook formulas, script outlines, and call-to-action variants.',
      priceInPaise: 11900,
      compareAtInPaise: 19900,
      currency: 'INR',
      format: 'PDF Swipe Dossier',
      pageCount: 45,
      fileSize: '15.7 MB',
      level: 'All Levels',
      tags: JSON.stringify(['Swipe File', 'Ad Copy', 'Creative Angles', 'Hooks', 'Direct Response']),
      whatYouLearn: JSON.stringify([
        'The 5 universal hook formulas that stop the mobile scroll consistently.',
        'Structuring direct-response video scripts that handle objections within 30 seconds.',
        'How to design high-converting comparison graphics and feature teardowns.',
      ]),
      whatsIncluded: JSON.stringify([
        '45-page annotated PDF swipe file.',
        'Editable copy templates for static and video ads.',
      ]),
      faq: JSON.stringify([
        {
          question: 'Can I copy these angles directly?',
          answer: 'Yes, the framework provides fill-in-the-blank structures tailored to fit your specific product or service.',
        },
      ]),
      previewPages: JSON.stringify([
        'The Scroll-Stopping Hook Framework: Hooking viewers within the first 3 seconds.',
        'Direct-Response Comparison Visuals: Framing product alternatives effectively.',
      ]),
      storageKey: 'products/ad-creative-swipe-briefs.pdf',
      checksumSha256: 'f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5',
      isPublished: true,
      isFeatured: false,
      isBestseller: false,
      sortOrder: 10,
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const created = await prisma.product.create({
      data: {
        ...p,
      },
    });
    createdProducts.push(created);
    console.log(`[Seed] Created product: ${created.title} (${created.id})`);
  }

  // Seed the 2 Curated Bundles using relational BundleItem records
  console.log('[Seed] Seeding curated bundles with relational BundleItems...');

  // Bundle 1: Complete Growth Marketing Vault (All 10 products)
  const completeVault = await prisma.product.create({
    data: {
      slug: 'complete-growth-marketing-library',
      title: 'The Complete Growth Marketing Vault (All 10 Products)',
      category: 'BUNDLE',
      tagline: 'The entire digital knowledge archive. All notes, playbooks, guides, templates, and case studies in one package.',
      description:
        'Gain instant, lifetime access to the entire library of 10 digital marketing products. Includes all Master Notes, Tactical Playbooks, Operating System Templates, Wireframe Guides, and Real-world Case Studies. A ₹1,490 total individual value bundled at an accessible single investment.',
      priceInPaise: 49900,
      compareAtInPaise: 149000,
      currency: 'INR',
      format: 'Complete Digital Vault · 10 Products · 620+ Pages',
      pageCount: 620,
      fileSize: '185 MB',
      level: 'All Levels',
      tags: JSON.stringify(['Bundle', 'Complete Library', 'All Products', 'VIP', 'Best Value']),
      whatYouLearn: JSON.stringify([
        'Master the full growth stack: Paid Acquisition (Meta & Google), SEO, Analytics, Funnels, and Content.',
        'Access all operational templates, budget models, and creative swipe files.',
        'Study genuine growth experiments with raw data and spend breakdowns.',
        'Receive all future revisions and additions at no extra cost.',
      ]),
      whatsIncluded: JSON.stringify([
        'Instant access to all 10 individual products and their bonus files.',
        'Individual download links in your customer portal.',
        'Priority email Q&A support for implementation questions.',
        'Free lifetime access to all future editions and updates.',
      ]),
      faq: JSON.stringify([
        {
          question: 'Do I get all 10 products immediately?',
          answer: 'Yes, as soon as payment is confirmed, your download portal will unlock access to every product in the library.',
        },
        {
          question: 'Do I get future products added to the store?',
          answer: 'Yes, all future updates and additions to existing products are included forever.',
        },
      ]),
      previewPages: JSON.stringify([
        'The Complete Vault Index: Unifies tactical execution across paid media, SEO, retention, and analytics.',
      ]),
      storageKey: 'products/complete-vault-archive.zip',
      checksumSha256: '0718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6',
      isPublished: true,
      isFeatured: true,
      isBestseller: true,
      sortOrder: 0,
    },
  });

  // Link all 10 products to the Complete Vault via BundleItem junction table
  for (let i = 0; i < createdProducts.length; i++) {
    await prisma.bundleItem.create({
      data: {
        bundleId: completeVault.id,
        productId: createdProducts[i].id,
        sortOrder: i,
      },
    });
  }
  console.log(`[Seed] Linked 10 items to bundle: ${completeVault.title}`);

  // Bundle 2: Paid Acquisition Triad (Meta + Google + Analytics)
  const paidTriadProducts = createdProducts.filter((p) =>
    ['meta-ads-playbook', 'google-search-pmax-playbook', 'marketing-analytics-attribution-notes'].includes(p.slug)
  );

  const paidBundle = await prisma.product.create({
    data: {
      slug: 'paid-acquisition-mastery-bundle',
      title: 'Paid Acquisition Mastery Bundle (Meta + Google + Analytics)',
      category: 'BUNDLE',
      tagline: 'The complete performance marketing triad: Meta Ads, Google Ads & First-Party Attribution.',
      description:
        'Everything needed to profitably acquire customers across paid social and paid search while maintaining accurate first-party measurement. Combines the Meta Ads Playbook, Google Search & PMax Playbook, and Performance Analytics Notes at 42% savings.',
      priceInPaise: 29900,
      compareAtInPaise: 55700,
      currency: 'INR',
      format: 'Triad Bundle · 3 Comprehensive Playbooks',
      pageCount: 250,
      fileSize: '57 MB',
      level: 'Intermediate to Advanced',
      tags: JSON.stringify(['Bundle', 'Paid Ads', 'Meta Ads', 'Google Ads', 'Analytics']),
      whatYouLearn: JSON.stringify([
        'Run modern consolidated Meta Ads campaigns and creative testing sandboxes.',
        'Capture high-intent search traffic with negative keyword lists and structured PMax.',
        'Measure Blended CAC and eliminate tracking blind spots with first-party attribution.',
      ]),
      whatsIncluded: JSON.stringify([
        'Meta Ads Playbook (104 pages + 3 Spreadsheets).',
        'Google Search & PMax Playbook (88 pages + Negative Keyword Stack).',
        'Performance Analytics Notes (58 pages + Event Schema).',
      ]),
      faq: JSON.stringify([
        {
          question: 'Are the spreadsheets included in this bundle?',
          answer: 'Yes, all bonus templates and spreadsheets from the three individual products are included.',
        },
      ]),
      previewPages: JSON.stringify([
        'The Paid Acquisition Triad: Demand generation on Meta, demand capture on Google Search, and attribution truth.',
      ]),
      storageKey: 'products/paid-acquisition-triad.zip',
      checksumSha256: '18293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f607',
      isPublished: true,
      isFeatured: true,
      isBestseller: false,
      sortOrder: 1,
    },
  });

  for (let i = 0; i < paidTriadProducts.length; i++) {
    await prisma.bundleItem.create({
      data: {
        bundleId: paidBundle.id,
        productId: paidTriadProducts[i].id,
        sortOrder: i,
      },
    });
  }
  console.log(`[Seed] Linked 3 items to bundle: ${paidBundle.title}`);

  // Seed standard promotional coupons with atomic reservation support
  console.log('[Seed] Seeding promotional coupons with atomic reservation fields...');
  await prisma.coupon.createMany({
    data: [
      {
        code: 'LAUNCH20',
        discountType: 'PERCENTAGE',
        discountValue: 20, // 20%
        minOrderInPaise: 0,
        maxUses: 100,
        usedCount: 0,
        reservedCount: 0,
        isActive: true,
      },
      {
        code: 'GROWTH500',
        discountType: 'FIXED',
        discountValue: 5000, // ₹50.00
        minOrderInPaise: 14900, // ₹149.00
        maxUses: 50,
        usedCount: 0,
        reservedCount: 0,
        isActive: true,
      },
      {
        code: 'VIP100',
        discountType: 'FIXED',
        discountValue: 10000, // ₹100.00
        minOrderInPaise: 29900, // ₹299.00
        maxUses: null, // Unlimited
        usedCount: 0,
        reservedCount: 0,
        isActive: true,
      },
    ],
  });

  // Seed default Admin User with scrypt password hashing
  console.log('[Seed] Provisioning initial scrypt admin user...');
  const adminPasswordHash = hashPassword('GrowthArchiveAdmin2026!#');
  await prisma.adminUser.create({
    data: {
      email: 'admin@thegrowtharchive.com',
      name: 'Archive Administrator',
      passwordHash: adminPasswordHash,
      role: 'OWNER',
      isActive: true,
    },
  });

  // Seed sample verified customer, paid order, and download entitlement
  console.log('[Seed] Seeding sample verified customer, paid order, and entitlement...');
  const sampleCustomer = await prisma.customer.create({
    data: {
      email: 'alex.growth@example.com',
      name: 'Alex Thompson',
    },
  });

  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'GA-20260915-1001',
      customerId: sampleCustomer.id,
      status: 'PAID',
      currency: 'INR',
      subtotalInPaise: 19900,
      discountInPaise: 0,
      totalInPaise: 19900,
      razorpayOrderId: 'order_mock_1001',
      razorpayPaymentId: 'pay_mock_1001',
      razorpaySignature: 'sig_mock_1001',
      paidAt: new Date(),
      items: {
        create: [
          {
            productId: createdProducts[0].id, // Meta Ads Playbook
            priceInPaise: 19900,
          },
        ],
      },
    },
  });

  // Create permanent DownloadEntitlement
  const sampleEntitlement = await prisma.downloadEntitlement.create({
    data: {
      orderId: sampleOrder.id,
      productId: createdProducts[0].id,
      customerId: sampleCustomer.id,
      maxDownloads: 5,
      downloadCount: 1,
      isRevoked: false,
    },
  });

  // Create sample single-use DownloadGrant (demonstrating new decoupled grant structure)
  const rawGrantToken = crypto.randomBytes(32).toString('hex');
  const grantTokenHash = crypto.createHash('sha256').update(rawGrantToken).digest('hex');

  const sampleGrant = await prisma.downloadGrant.create({
    data: {
      entitlementId: sampleEntitlement.id,
      tokenHash: grantTokenHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      usedAt: new Date(), // Already used once for the event below
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
  });

  await prisma.downloadEvent.create({
    data: {
      entitlementId: sampleEntitlement.id,
      grantId: sampleGrant.id,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      downloadedAt: new Date(),
    },
  });

  // Ensure local storage assets exist for all products in storage/products/
  console.log('[Seed] Ensuring mock digital binary assets exist in storage/products/...');
  const storageDir = path.resolve(process.cwd(), 'storage/products');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const assetFiles = [
    'meta-ads-playbook.pdf',
    'seo-master-notes.pdf',
    'high-converting-landing-page-guide.pdf',
    'b2b-growth-engine-playbook.pdf',
    'marketing-analytics-attribution-notes.pdf',
    'growth-experiment-operating-system.pdf',
    'email-marketing-automation-vault.pdf',
    'dtc-brand-scaling-case-study.pdf',
    'google-search-pmax-playbook.pdf',
    'ad-creative-swipe-briefs.pdf',
    'complete-vault-archive.zip',
    'paid-acquisition-triad.zip',
  ];

  for (const filename of assetFiles) {
    const filePath = path.join(storageDir, filename);
    if (!fs.existsSync(filePath)) {
      const dummyContent = Buffer.from(
        `%PDF-1.4\n1 0 obj\n<< /Title (${filename}) /Author (The Growth Archive) /Creator (The Growth Archive Publishing Engine) >>\nendobj\n%%EOF\n`
      );
      fs.writeFileSync(filePath, dummyContent);
      console.log(`[Seed] Created private asset: ${filename}`);
    }
  }

  console.log('[Seed] Database successfully seeded with full canonical catalog and initial scrypt admin!');
}

main()
  .catch((e) => {
    console.error('[Seed] Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
