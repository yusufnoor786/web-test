import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing records...');
  await prisma.downloadEvent.deleteMany({});
  await prisma.downloadEntitlement.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.purchaseRecoveryToken.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.contactInquiry.deleteMany({});

  console.log('Seeding products...');

  const productsData = [
    {
      slug: 'meta-ads-playbook',
      title: 'Meta Ads Playbook: 2026 Campaign Architecture & Scaling',
      category: 'PLAYBOOKS',
      tagline: 'The consolidated campaign framework for scaling profitably in the modern algorithmic auction.',
      description:
        'A comprehensive, tactical playbook for media buyers, growth leads, and founders spending between ₹50,000 and ₹20,00,000/month on Meta. Learn how to structure broad Advantage+ campaigns, systematically isolate and scale creative winners, configure conversion tracking via CAPI, and calculate true blended acquisition costs.',
      price: 199,
      compareAtPrice: 399,
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
          q: 'Is this suitable for e-commerce or lead generation?',
          a: 'Both. The consolidated account architecture applies to any objective, with dedicated chapters detailing lead gen forms and DTC purchase optimizations.',
        },
        {
          q: 'Does this cover Advantage+ Shopping Campaigns (ASC)?',
          a: 'Yes. Chapter 4 is entirely devoted to ASC budgeting, existing customer bid caps, and asset group diversification.',
        },
        {
          q: 'How will I receive this product?',
          a: 'Immediately after successful checkout, you will receive a secure tokenized download link on the confirmation page and via email.',
        },
      ]),
      previewPages: JSON.stringify([
        {
          page: 1,
          title: 'Executive Briefing & Account Liquidity',
          content:
            'The historical playbook of hyper-targeting 50 interest ad sets is dead. Meta’s auction reward liquidity above all else. This chapter outlines the mathematical proof behind account consolidation and why reducing ad set friction unlocks predictable CPM discounts.',
        },
        {
          page: 2,
          title: 'The 3-Tier Sandbox Architecture',
          content:
            'We isolate our spending into three distinct buckets: Sandbox (7-day rapid testing), Scaling (proven winners on broad targeting), and Retention (customer LTV acceleration). Here is the exact budget distribution ratio across tiers.',
        },
        {
          page: 3,
          title: 'Deterministic Cut & Scale Decision Tree',
          content:
            'Never rely on emotional gut feelings when turning ads off. Use this deterministic decision tree: If Thumb-Stop Ratio < 30% at 500 impressions, kill immediately. If Outbound CTR > 1.8% and CPA < Target, graduate to scaling tier.',
        },
      ]),
      filePath: 'meta-ads-playbook.pdf',
      isPublished: true,
      isFeatured: true,
      isBestseller: true,
      sortOrder: 1,
    },
    {
      slug: 'seo-master-notes',
      title: 'SEO Master Notes: Information Architecture & Ranking Signals',
      category: 'NOTES',
      tagline: 'Structured, no-fluff technical and editorial notes on building defensible topical authority.',
      description:
        'A dense, reference-grade notebook covering modern organic search. From schema entity graphs and crawl budget management to programmatic SEO architectures and topic cluster mapping, these notes serve as an everyday handbook for serious search practitioners.',
      price: 149,
      compareAtPrice: 299,
      currency: 'INR',
      format: 'PDF Notebook',
      pageCount: 82,
      fileSize: '18.6 MB',
      level: 'All Levels',
      tags: JSON.stringify(['SEO', 'Organic Search', 'Technical SEO', 'Information Architecture', 'Topical Authority']),
      whatYouLearn: JSON.stringify([
        'How search engines parse semantic entities and topic co-occurrence in modern ranking systems.',
        'Structuring pillar and satellite content hierarchies that pass maximum PageRank internally.',
        'Core Web Vitals remediation: reducing TTFB, LCP, and CLS without expensive engineering rewrites.',
        'How to conduct competitive content gap audits that identify low-hanging organic traffic wins.',
        'Programmatic directory architectures that scale to thousands of indexable, high-value landing pages.',
      ]),
      whatsIncluded: JSON.stringify([
        '82-page reference-formatted PDF with clean diagrams and code snippets.',
        'Technical Site Audit Checklist (54 critical inspection points).',
        'JSON-LD Schema Templates for Articles, FAQs, Products, and Local Business.',
        'Internal Link Architecture Mapping sheet.',
      ]),
      faq: JSON.stringify([
        {
          q: 'Are these notes beginner-friendly?',
          a: 'Yes. While it goes deep into technical architecture, every concept starts with foundational definitions and plain English explanations.',
        },
        {
          q: 'Is this updated for recent core algorithm updates?',
          a: 'Yes, fully updated with emphasis on first-party original data, author credentials, and entity coherence.',
        },
      ]),
      previewPages: JSON.stringify([
        {
          page: 1,
          title: 'Semantic Entity Architecture',
          content:
            'Keywords are strings; entities are things. In this opening section, we unpack how search engine knowledge graphs understand brand relationships and why co-occurring entity references outweigh repetitive keyword stuffing.',
        },
        {
          page: 2,
          title: 'The Internal Link Multiplier',
          content:
            'Most websites waste 60% of their accumulated authority due to orphan pages and generic anchor texts. We examine mathematical models for link equity distribution across multi-tier directory structures.',
        },
        {
          page: 3,
          title: 'Technical Crawl Budget Optimization',
          content:
            'A practical checklist for handling faceted navigation, parameter cleanups, and robots.txt directives to ensure bots focus crawl cycles exclusively on indexable, revenue-generating URLs.',
        },
      ]),
      filePath: 'seo-master-notes.pdf',
      isPublished: true,
      isFeatured: true,
      isBestseller: true,
      sortOrder: 2,
    },
    {
      slug: 'digital-marketing-fundamentals',
      title: 'Digital Marketing Fundamentals: Growth Architecture',
      category: 'NOTES',
      tagline: 'The essential playbook for understanding modern customer acquisition, unit economics, and retention.',
      description:
        'A comprehensive foundation designed to clear the noise in digital marketing. Covers unit economics (CAC, LTV, MER, Payback Period), multi-channel customer journey mapping, conversion rate fundamentals, and retention loops.',
      price: 99,
      compareAtPrice: 199,
      currency: 'INR',
      format: 'PDF Guide',
      pageCount: 64,
      fileSize: '14.1 MB',
      level: 'Beginner to Intermediate',
      tags: JSON.stringify(['Fundamentals', 'Unit Economics', 'Growth Strategy', 'CAC', 'LTV', 'Marketing Funnels']),
      whatYouLearn: JSON.stringify([
        'How to calculate true blended CAC and determine sustainable marketing efficiency ratios (MER).',
        'The psychology of conversion: attention, value proposition, proof, and friction reduction.',
        'Comparing channels objectively: Organic Search vs Paid Social vs Performance Search vs Email.',
        'How to build a financial growth forecast model based on real conversion benchmarks.',
        'Retention mechanics: setting up the first 30-day lifecycle to maximize repeat purchase rates.',
      ]),
      whatsIncluded: JSON.stringify([
        '64-page structured foundational PDF.',
        'Marketing Unit Economics Calculator (Excel / Google Sheets).',
        'Customer Journey Wireframing Kit.',
      ]),
      faq: JSON.stringify([
        {
          q: 'Who is this for?',
          a: 'Founders, career switchers, and junior marketers who want to understand how the business side of marketing actually works without fluffy jargon.',
        },
      ]),
      previewPages: JSON.stringify([
        {
          page: 1,
          title: 'The Real Mathematics of Growth',
          content:
            'Traffic without conversion is vanity. Conversion without margin is bankruptcy. We start by deconstructing the core financial engine: Acquisition Cost, Gross Margin, and Contribution Margin per order.',
        },
        {
          page: 2,
          title: 'The 4 Pillars of Marketing Efficiency',
          content:
            'Evaluating channel viability through the lens of intent vs interruption. How to balance demand capture (Google Search) with demand generation (Meta, YouTube, Content).',
        },
      ]),
      filePath: 'digital-marketing-fundamentals.pdf',
      isPublished: true,
      isFeatured: true,
      isBestseller: false,
      sortOrder: 3,
    },
    {
      slug: 'scaling-d2c-growth-experiments',
      title: 'Scaling to ₹50L/mo: Real Growth Experiments & Post-Mortem',
      category: 'CASE_STUDIES',
      tagline: 'Unfiltered data, spend sheets, split-test results, and painful mistakes from the trenches.',
      description:
        'An authentic, behind-the-scenes case study documenting 12 months of systematic growth experiments. Includes real ad spend breakdowns, unedited split test results, what worked, what burned ₹8 Lakhs in ad spend, and the key pivots that turned the business cash-flow positive.',
      price: 149,
      compareAtPrice: 299,
      currency: 'INR',
      format: 'PDF Case Study + Raw Data Tables',
      pageCount: 52,
      fileSize: '19.8 MB',
      level: 'All Levels',
      tags: JSON.stringify(['Case Study', 'Experiments', 'Growth Hacking', 'D2C', 'Spend Analysis', 'Real Data']),
      whatYouLearn: JSON.stringify([
        'The exact ad tests that failed and why broad lookalike audiences burned budget.',
        'How simplifying the product checkout page produced an instant 22.4% lift in completed orders.',
        'The creative format pivot: why raw phone video crushed high-budget agency productions.',
        'How introducing a post-purchase 1-click bundle lifted average order value from ₹850 to ₹1,420.',
        'The breakdown of cash flow timing: managing ad spend float vs inventory restocking cycles.',
      ]),
      whatsIncluded: JSON.stringify([
        '52-page deep-dive PDF case study with full data tables and unedited charts.',
        'Raw Experiment Log (notion template) tracking 48 individual hypotheses and outcomes.',
        'Financial Post-Mortem spreadsheet.',
      ]),
      faq: JSON.stringify([
        {
          q: 'Are the revenue numbers and data real?',
          a: 'Yes. All data is taken directly from actual ad accounts and payment gateway dashboards, with brand identifiers redacted for confidentiality.',
        },
      ]),
      previewPages: JSON.stringify([
        {
          page: 1,
          title: 'The Baseline: Stalling at ₹8L/mo',
          content:
            'In Q1, we hit a hard ceiling. Every incremental ₹10,000 in ad spend drove higher CAC with zero marginal profit. Here is the exact diagnostic audit that uncovered our creative fatigue bottleneck.',
        },
        {
          page: 2,
          title: 'Experiment #14: The Offer Overhaul',
          content:
            'Instead of discounting our hero product, we bundled it with an operational accessory and priced it at ₹1,499. Conversion rates did not drop; revenue per visitor surged 43%.',
        },
      ]),
      filePath: 'growth-experiments-case-study.pdf',
      isPublished: true,
      isFeatured: true,
      isBestseller: true,
      sortOrder: 4,
    },
    {
      slug: 'content-engine-strategy-guide',
      title: 'Organic Content Engine & Editorial Strategy',
      category: 'GUIDES',
      tagline: 'The end-to-end framework for building high-signal publishing systems that convert readers into buyers.',
      description:
        'A practical, step-by-step editorial guide for building an organic distribution engine. Learn how to discover contrarian topics, structure authoritative long-form assets, build high-leverage distribution flywheels, and capture qualified leads without spending on ads.',
      price: 149,
      compareAtPrice: 249,
      currency: 'INR',
      format: 'PDF Guide + Notion Content Hub',
      pageCount: 74,
      fileSize: '16.5 MB',
      level: 'Intermediate',
      tags: JSON.stringify(['Content Marketing', 'Editorial Strategy', 'Copywriting', 'Distribution', 'SEO Content']),
      whatYouLearn: JSON.stringify([
        'How to source high-demand topics from customer support logs, objections, and forum questions.',
        'The 5-part anatomy of a high-signal article that naturally attracts backlinks and bookmarks.',
        'How to turn one deep-dive guide into 10 multi-format social assets without sounding robotic.',
        'Newsletter growth mechanisms: structuring opt-in bribes that attract high-intent buyers.',
        'Measuring content ROI: attributing pipeline value to organic editorial articles.',
      ]),
      whatsIncluded: JSON.stringify([
        '74-page illustrated tactical guide.',
        'Editorial Calendar Notion Workspace.',
        '15 Headline & Hook Frameworks for editorial articles.',
      ]),
      faq: [
        {
          q: 'Does this guide require external paid tools?',
          a: 'No, all research and distribution methods can be executed with free tools or standard spreadsheets.',
        },
      ],
      previewPages: JSON.stringify([
        {
          page: 1,
          title: 'The Fluff Filter: What Makes Content Authoritative',
          content:
            'Most corporate blogs publish lukewarm summaries that nobody reads. Authoritative content contains three ingredients: proprietary data, contrarian opinions, and reproducible step-by-step instructions.',
        },
      ]),
      filePath: 'content-engine-strategy-guide.pdf',
      isPublished: true,
      isFeatured: false,
      isBestseller: false,
      sortOrder: 5,
    },
    {
      slug: 'high-converting-funnel-guide',
      title: 'High-Converting Funnel Architecture Guide',
      category: 'GUIDES',
      tagline: 'Wireframes, messaging frameworks, and friction-reducing checkout flows for maximum conversion.',
      description:
        'Stop losing traffic to confusing landing pages. This guide deconstructs every section of high-converting funnels: hero section formulas, objection handling matrices, social proof positioning, mobile UX design, and one-click post-purchase checkout sequences.',
      price: 179,
      compareAtPrice: 349,
      currency: 'INR',
      format: 'PDF Guide + Figma Wireframe Kit',
      pageCount: 90,
      fileSize: '21.0 MB',
      level: 'Intermediate',
      tags: JSON.stringify(['CRO', 'Landing Pages', 'Funnels', 'UX Design', 'Conversion Optimization']),
      whatYouLearn: JSON.stringify([
        'The 8 core sections every high-converting sales page must have and their exact visual hierarchy.',
        'Eliminating mobile checkout friction: form field audits, sticky CTA rules, and payment UX.',
        'How to write compelling objection-busting FAQ sections that clear doubts before the pricing table.',
        'The psychology of price anchoring and tiered offer design.',
      ]),
      whatsIncluded: JSON.stringify([
        '90-page conversion blueprint PDF.',
        'Figma wireframe templates for 3 proven page archetypes (Lead Gen, Long-form Sales, Digital Product).',
        'A/B Testing Prioritization Framework.',
      ]),
      faq: [
        {
          q: 'Will this help if I am using custom code or WordPress?',
          a: 'Yes, the principles and wireframe layouts apply regardless of your tech stack (Next.js, Shopify, Webflow, WordPress).',
        },
      ],
      previewPages: JSON.stringify([
        {
          page: 1,
          title: 'The 5-Second Attention Test',
          content:
            'When a visitor lands on your page, their subconscious evaluates three questions in under five seconds: Where am I? What can I do here? Why should I trust you? Here is how to configure the viewport.',
        },
      ]),
      filePath: 'high-converting-funnel-guide.pdf',
      isPublished: true,
      isFeatured: false,
      isBestseller: false,
      sortOrder: 6,
    },
    {
      slug: 'google-search-pmax-playbook',
      title: 'Google Search & Performance Max Playbook',
      category: 'PLAYBOOKS',
      tagline: 'Capturing high-intent buyers with clean search match types and structured PMax asset groups.',
      description:
        'A battle-tested blueprint for running Google Ads profitably. Covers transactional search keyword architectures, negative keyword filtering systems, Performance Max asset group structuring, and brand search cannibalization defense.',
      price: 189,
      compareAtPrice: 349,
      currency: 'INR',
      format: 'PDF Playbook + Audit Checklist',
      pageCount: 88,
      fileSize: '19.4 MB',
      level: 'Intermediate to Advanced',
      tags: JSON.stringify(['Google Ads', 'PMax', 'Search Marketing', 'PPC', 'High Intent']),
      whatYouLearn: JSON.stringify([
        'Structuring Search campaigns to eliminate wasteful broad search queries.',
        'How to feed high-signal first-party customer audience lists into Performance Max.',
        'Excluding brand keywords to avoid paying for traffic that would have converted organically.',
        'Setting up Value-Based Bidding (tROAS) and optimizing target margins.',
      ]),
      whatsIncluded: JSON.stringify([
        '88-page tactical PDF Playbook.',
        '1,200+ Account-Level Negative Keyword Master List.',
        'PMax Asset Group Optimization Checklist.',
      ]),
      faq: [
        {
          q: 'Is this for Lead Gen or E-commerce?',
          a: 'Both. Specific chapters detail shopping feeds for ecommerce and offline conversion import for lead generation.',
        },
      ],
      previewPages: JSON.stringify([
        {
          page: 1,
          title: 'Intent Mapping: The 3 Search Tiers',
          content:
            'We categorize search queries into Transactional Intent, Commercial Investigation, and Informational. Bidding the same on all three is the #1 reason Google Ads accounts bleed cash.',
        },
      ]),
      filePath: 'google-search-pmax-playbook.pdf',
      isPublished: true,
      isFeatured: false,
      isBestseller: false,
      sortOrder: 7,
    },
    {
      slug: 'marketing-analytics-attribution-notes',
      title: 'Performance Analytics & Attribution Notes',
      category: 'NOTES',
      tagline: 'First-party measurement, GA4 custom event schema, and multi-channel attribution models.',
      description:
        'Clear, rigorous reference notes on measuring marketing performance in a privacy-first web. Covers GA4 event naming architecture, Server-Side Tag Manager setup, Blended CAC vs Channel ROAS, and cohort retention tables.',
      price: 129,
      compareAtPrice: 249,
      currency: 'INR',
      format: 'PDF Notes + Schema Templates',
      pageCount: 58,
      fileSize: '13.2 MB',
      level: 'All Levels',
      tags: JSON.stringify(['Analytics', 'Attribution', 'GA4', 'Tracking', 'Metrics', 'CAC']),
      whatYouLearn: JSON.stringify([
        'Standardizing your ecommerce event taxonomy across web and app.',
        'Why last-click attribution misleads paid social budgets, and how to compute Blended MER.',
        'Setting up Server-Side GTM to bypass ad-blocker signal loss.',
        'Building weekly executive reporting dashboards that surface real business health.',
      ]),
      whatsIncluded: JSON.stringify([
        '58-page reference PDF notes.',
        'GA4 Event Schema Configuration Sheet.',
        'Looker Studio Executive Dashboard Template.',
      ]),
      faq: [
        {
          q: 'Do I need coding knowledge to follow this?',
          a: 'No, all concepts are explained with clear diagrams and pre-built templates that require no custom programming.',
        },
      ],
      previewPages: JSON.stringify([
        {
          page: 1,
          title: 'The Post-iOS 14 Attribution Reality',
          content:
            'In-platform ad manager numbers are directional estimates, not accounting truths. We establish the primary metric of truth: Total Revenue divided by Total Marketing Spend (MER).',
        },
      ]),
      filePath: 'marketing-analytics-attribution-notes.pdf',
      isPublished: true,
      isFeatured: false,
      isBestseller: false,
      sortOrder: 8,
    },
    {
      slug: 'marketers-operating-system-templates',
      title: "Marketer's Operating System: Templates & Briefs",
      category: 'TEMPLATES',
      tagline: '12 ready-to-deploy Notion workspaces, Google Sheets trackers, and creative brief frameworks.',
      description:
        'A comprehensive toolkit of standard operating procedures, creative brief documents, campaign launch checklists, and annual marketing budget allocation models. Download, duplicate into your tools, and execute immediately.',
      price: 149,
      compareAtPrice: 299,
      currency: 'INR',
      format: 'ZIP Resource Bundle (12 Assets)',
      pageCount: 12,
      fileSize: '35.0 MB',
      level: 'All Levels',
      tags: JSON.stringify(['Templates', 'Notion', 'Spreadsheets', 'SOPs', 'Briefs', 'Productivity']),
      whatYouLearn: JSON.stringify([
        'How to write creative briefs that copywriters and video editors understand on the first draft.',
        'Structuring an annual marketing budget tracker with built-in scenario modeling.',
        'Executing a flawless 24-point campaign launch QA checklist to prevent costly tracking errors.',
      ]),
      whatsIncluded: JSON.stringify([
        'Notion Marketing Hub workspace template.',
        'Marketing Budget & Cash Flow Forecast Sheet.',
        'Ad Creative Brief & Storyboard Template.',
        'Competitor Intelligence Swipe Database.',
      ]),
      faq: [
        {
          q: 'What software is required to use these templates?',
          a: 'Notion (free account) and Google Sheets / Excel.',
        },
      ],
      previewPages: JSON.stringify([
        {
          page: 1,
          title: 'Operating System Overview',
          content:
            'This bundle contains production-ready SOPs and templates battle-tested across client retainers and internal brands. Simply duplicate to your workspace and start organizing your marketing operations.',
        },
      ]),
      filePath: 'marketers-operating-system-templates.zip',
      isPublished: true,
      isFeatured: true,
      isBestseller: true,
      sortOrder: 9,
    },
    {
      slug: 'ad-creative-swipe-briefs',
      title: 'Ad Creative Swipe File & Production Briefs',
      category: 'TEMPLATES',
      tagline: '45 proven hook scripts, visual storyboards, and copywriting angles across paid channels.',
      description:
        'Never stare at a blank page again. A curated repository of 45 high-performing ad creative formulas across statics, carousels, and founder video scripts. Includes annotated teardowns explaining why each ad converted.',
      price: 99,
      compareAtPrice: 199,
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
      faq: [
        {
          q: 'Can I copy these angles directly?',
          a: 'Yes, the framework provides fill-in-the-blank structures tailored to fit your specific product or service.',
        },
      ],
      previewPages: JSON.stringify([
        {
          page: 1,
          title: 'The Scroll-Stopping Hook Framework',
          content:
            'The first 3 seconds dictate 80% of an ad’s performance. We analyze why high-contrast typography and curiosity-driven problem statements beat generic lifestyle visuals.',
        },
      ]),
      filePath: 'ad-creative-swipe-briefs.pdf',
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
        faq: typeof p.faq === 'string' ? p.faq : JSON.stringify(p.faq),
      },
    });
    createdProducts.push(created);
    console.log(`Created product: ${created.title} (${created.id})`);
  }

  // Now create the 2 Curated Bundles
  console.log('Seeding curated bundles...');

  const allProductIds = createdProducts.map((p) => p.id);
  const paidAcqProductIds = createdProducts
    .filter((p) =>
      ['meta-ads-playbook', 'google-search-pmax-playbook', 'marketing-analytics-attribution-notes'].includes(p.slug)
    )
    .map((p) => p.id);

  // Bundle 1: Complete Library
  await prisma.product.create({
    data: {
      slug: 'complete-growth-marketing-library',
      title: 'The Complete Growth Marketing Vault (All 10 Products)',
      category: 'BUNDLES',
      tagline: 'The entire digital knowledge archive. All notes, playbooks, guides, templates, and case studies in one package.',
      description:
        'Gain instant, lifetime access to the entire library of 10 digital marketing products. Includes all Master Notes, Tactical Playbooks, Operating System Templates, Wireframe Guides, and Real-world Case Studies. A ₹1,360 total individual value bundled at an accessible single investment.',
      price: 499,
      compareAtPrice: 1360,
      currency: 'INR',
      format: 'Complete Digital Vault · 10 Products · 620+ Pages',
      pageCount: 620,
      fileSize: '185 MB',
      level: 'All Levels',
      tags: JSON.stringify(['Bundle', 'Complete Library', 'All Products', 'VIP', 'Best Value']),
      whatYouLearn: JSON.stringify([
        'Master the full growth stack: Paid Acquisition (Meta & Google), SEO, Analytics, Funnels, and Content.',
        'Access all 12 operational templates, budget models, and creative swipe files.',
        'Study genuine ₹50L/mo growth experiments with raw data and spend breakdowns.',
        'Receive all future 2026 revisions and additions at no extra cost.',
      ]),
      whatsIncluded: JSON.stringify([
        'Instant access to all 10 individual products and their bonus files.',
        'Individual download links + single 1-click master download.',
        'Priority email Q&A support for implementation questions.',
        'Free lifetime access to all future editions and updates.',
      ]),
      faq: JSON.stringify([
        {
          q: 'Do I get all 10 products immediately?',
          a: 'Yes, as soon as payment is confirmed, your download portal will unlock download buttons for every single product in the library.',
        },
        {
          q: 'Do I get future products added to the store?',
          a: 'Yes, all future updates and additions to existing products are included forever.',
        },
      ]),
      previewPages: JSON.stringify([
        {
          page: 1,
          title: 'The Complete Vault Index',
          content:
            'This master bundle unifies tactical execution across paid acquisition, organic distribution, conversion optimization, and marketing analytics into an integrated operating system.',
        },
      ]),
      filePath: 'meta-ads-playbook.pdf', // Primary download file fallback
      bundleProductIds: JSON.stringify(allProductIds),
      isPublished: true,
      isFeatured: true,
      isBestseller: true,
      sortOrder: 0,
    },
  });

  // Bundle 2: Paid Acquisition Bundle
  await prisma.product.create({
    data: {
      slug: 'paid-acquisition-mastery-bundle',
      title: 'Paid Acquisition Mastery Bundle (Meta + Google + Analytics)',
      category: 'BUNDLES',
      tagline: 'The complete performance marketing triad: Meta Ads, Google Ads & First-Party Attribution.',
      description:
        'Everything needed to profitably acquire customers across paid social and paid search while maintaining accurate first-party measurement. Combines the Meta Ads Playbook, Google Search & PMax Playbook, and Performance Analytics Notes at 42% savings.',
      price: 299,
      compareAtPrice: 517,
      currency: 'INR',
      format: 'Triad Bundle · 3 Comprehensive Playbooks',
      pageCount: 250,
      fileSize: '57 MB',
      level: 'Intermediate to Advanced',
      tags: JSON.stringify(['Bundle', 'Paid Ads', 'Meta Ads', 'Google Ads', 'Analytics']),
      whatYouLearn: JSON.stringify([
        'Run modern consolidated Meta Ads campaigns and creative testing sandboxes.',
        'Capture high-intent search traffic with negative keyword lists and structured PMax.',
        'Measure Blended CAC and eliminate tracking blind spots with first-party GA4 modeling.',
      ]),
      whatsIncluded: JSON.stringify([
        'Meta Ads Playbook (104 pages + 3 Spreadsheets).',
        'Google Search & PMax Playbook (88 pages + Negative Keyword Stack).',
        'Performance Analytics Notes (58 pages + Event Schema).',
      ]),
      faq: JSON.stringify([
        {
          q: 'Are the spreadsheets included in this bundle?',
          a: 'Yes, all bonus templates and spreadsheets from the three individual products are included.',
        },
      ]),
      previewPages: JSON.stringify([
        {
          page: 1,
          title: 'The Paid Acquisition Triad',
          content:
            'Paid media success is a three-legged stool: demand generation on Meta, demand capture on Google Search, and attribution truth in your analytics warehouse.',
        },
      ]),
      filePath: 'meta-ads-playbook.pdf',
      bundleProductIds: JSON.stringify(paidAcqProductIds),
      isPublished: true,
      isFeatured: true,
      isBestseller: false,
      sortOrder: 1,
    },
  });

  // Seed standard promotional coupons
  console.log('Seeding coupons...');
  await prisma.coupon.createMany({
    data: [
      {
        code: 'LAUNCH20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderAmount: 0,
        isActive: true,
      },
      {
        code: 'GROWTH50',
        discountType: 'FIXED',
        discountValue: 50,
        minOrderAmount: 200,
        isActive: true,
      },
      {
        code: 'VIP100',
        discountType: 'FIXED',
        discountValue: 100,
        minOrderAmount: 400,
        isActive: true,
      },
    ],
  });

  // Seed an initial demo customer and completed order so the Admin panel has realistic metrics immediately
  console.log('Seeding initial verified customer and sample order...');
  const sampleCustomer = await prisma.customer.create({
    data: {
      email: 'alex.growth@example.com',
      name: 'Alex Thompson',
    },
  });

  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-1001',
      customerId: sampleCustomer.id,
      status: 'PAID',
      currency: 'INR',
      subtotal: 199,
      discount: 0,
      total: 199,
      razorpayOrderId: 'order_mock_1001',
      razorpayPaymentId: 'pay_mock_1001',
      razorpaySignature: 'sig_mock_1001',
      items: {
        create: [
          {
            productId: createdProducts[0].id, // Meta Ads Playbook
            price: 199,
          },
        ],
      },
    },
  });

  // Create entitlement for sample order
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.downloadEntitlement.create({
    data: {
      orderId: sampleOrder.id,
      productId: createdProducts[0].id,
      tokenHash: tokenHash,
      maxDownloads: 5,
      downloadCount: 1,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      events: {
        create: {
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
      },
    },
  });

  console.log('Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
