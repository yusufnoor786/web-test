export interface CatalogProduct {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  category: string;
  priceInPaise: number;
  compareAtInPaise: number | null;
  currency: string;
  format: string;
  pageCount: number | null;
  fileSize: string | null;
  level: string | null;
  description: string;
  tags: string[];
  whatYouLearn: string[];
  whatsIncluded: string[];
  faq: Array<{ question: string; answer: string }>;
  previewPages: string[];
  storageKey: string;
  isPublished: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_PRODUCTS: CatalogProduct[] = [
  {
    id: 'prod_digital_fundamentals',
    slug: 'digital-marketing-fundamentals',
    title: 'Digital Marketing Fundamentals: Growth Architecture',
    category: 'GUIDE',
    tagline: 'The foundational operating manual for unit economics, acquisition math, and retention.',
    description:
      'An essential, high-density primer for marketers, founders, and growth leads. Covers the foundational mathematics of growth: LTV:CAC ratios, payback periods, blended MER vs platform metrics, testing frameworks, and retention acceleration systems.',
    priceInPaise: 9900,
    compareAtInPaise: 19900,
    currency: 'INR',
    format: 'PDF · 1.2 MB',
    pageCount: 32,
    fileSize: '1.2 MB',
    level: 'Foundational to Intermediate',
    tags: ['Fundamentals', 'Unit Economics', 'CAC', 'LTV', 'Growth Architecture'],
    whatYouLearn: [
      'Master the core math of sustainable growth: LTV:CAC ratios and 60-day payback modeling.',
      'How to calculate true Blended MER across paid and organic acquisition channels.',
      'Deterministic A/B testing protocols to eliminate false positives in marketing experiments.',
      'First-7-days retention architecture to slash churn and accelerate customer lifetime value.',
    ],
    whatsIncluded: [
      'Comprehensive high-resolution PDF Playbook.',
      'Unit Economics & Payback Period Calculator (Spreadsheet).',
      'Single-operator lifetime commercial license.',
      'Instant access & unlimited re-downloads from customer portal.',
    ],
    faq: [
      {
        question: 'Is this suitable for beginners?',
        answer: 'Yes, it breaks down complex growth mathematics and unit economics into clear, actionable operating procedures.',
      },
    ],
    previewPages: [
      'Module 1: The Unit Economics of Growth & Payback Period modeling.',
      'Module 2: Retention, RFM segmentation, and lifetime value acceleration.',
    ],
    storageKey: 'products/digital-marketing-fundamentals.pdf',
    isPublished: true,
    isFeatured: true,
    isBestseller: false,
    sortOrder: 1,
    createdAt: new Date('2026-03-20'),
    updatedAt: new Date('2026-03-20'),
  },
  {
    id: 'cmvc968mz0000ryd8uw7rm8vv',
    slug: 'projectmistos-audit',
    title: 'Projectmistos Audit',
    category: 'PLAYBOOK',
    tagline: 'the test audit',
    description: 'xyz test audit with data base',
    priceInPaise: 19900,
    compareAtInPaise: 39900,
    currency: 'INR',
    format: 'PDF · 2.3 MB',
    pageCount: null,
    fileSize: '2.3 MB',
    level: 'All Levels',
    tags: ['PLAYBOOK', 'Digital Marketing', 'Growth'],
    whatYouLearn: [
      'Practical frameworks and step-by-step methodologies.',
      'Battle-tested operating procedures for consistent execution.',
      'Tactical checklists and resource guides.',
    ],
    whatsIncluded: [
      'PDF · 2.3 MB',
      'Single-operator commercial license.',
      'Instant access & unlimited re-downloads from customer portal.',
    ],
    faq: [
      {
        question: 'How do I download my product?',
        answer: 'Immediately after checkout you will receive a secure tokenized download link and customer portal access.',
      },
    ],
    previewPages: [
      'Overview & executive briefing from Projectmistos Audit.',
      'Core strategic models, testing principles, and execution protocols.',
    ],
    storageKey: 'products/projectmistos-audit.pdf',
    isPublished: true,
    isFeatured: true,
    isBestseller: true,
    sortOrder: 0,
    createdAt: new Date('2026-03-20'),
    updatedAt: new Date('2026-03-20'),
  },
  {
    id: 'prod_meta_ads',
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
    tags: ['Meta Ads', 'Paid Social', 'Media Buying', 'ROAS', 'Creative Strategy', 'CAPI'],
    whatYouLearn: [
      'How to transition from fragmented ad sets to a high-liquidity, 3-tier campaign architecture.',
      'The exact 7-day creative testing sandbox used to identify winning hooks before scaling spend.',
      'Deterministic kill-switch rules: when to cut losing ads without prematurely choking the algorithm.',
      'How to set up Conversions API (CAPI) and verify server-side event deduplication.',
      'Bid cap and cost cap scaling strategies for high-volume sales days and seasonal spikes.',
    ],
    whatsIncluded: [
      '104-page high-resolution PDF Playbook with annotated screenshots.',
      'Creative Testing Scorecard (Google Sheets template).',
      'CAPI & Pixel Diagnostic Checklist.',
      'Ad Copy Angle Matrix (40 fill-in-the-blank hook formulas).',
      'Lifetime free updates for all 2026 revisions.',
    ],
    faq: [
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
    ],
    previewPages: [
      'Executive Briefing: The historical playbook of hyper-targeting 50 interest ad sets is dead. Meta’s auction rewards liquidity above all else.',
      'The 3-Tier Sandbox Architecture: We isolate spending into three distinct buckets: Sandbox, Scaling, and Retention.',
      'Deterministic Cut & Scale Decision Tree: Never rely on emotional gut feelings. Use deterministic thresholds for thumb-stop and CTR.',
    ],
    storageKey: 'products/meta-ads-playbook.pdf',
    isPublished: true,
    isFeatured: true,
    isBestseller: true,
    sortOrder: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'prod_seo_notes',
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
    tags: ['SEO', 'Technical SEO', 'Topical Authority', 'Schema', 'Information Architecture'],
    whatYouLearn: [
      'Building hierarchical topic clusters that build reciprocal internal link equity.',
      'Configuring JSON-LD schema entity graphs to claim Knowledge Graph ownership.',
      'Preventing crawl budget waste on large dynamic catalogs and faceted navigation.',
      'Reverse-engineering competitor ranking signals with deterministic content delta audits.',
    ],
    whatsIncluded: [
      '68-page reference PDF with syntax diagrams and code samples.',
      'JSON-LD Schema Template Library (Organization, Product, Article, FAQPage).',
      'Topical Cluster Mapping Notion Board template.',
    ],
    faq: [
      {
        question: 'Are these notes focused on algorithmic search or generative engines (GEO)?',
        answer: 'Both. The notes focus on semantic entity optimization, which forms the underlying knowledge structure parsed by both Google Search and LLM answer engines.',
      },
    ],
    previewPages: [
      'Entity Graphs vs Keywords: Modern search engines rank entities and relationships, not isolated keyword densities.',
      'Hierarchical Topic Modeling: The mathematical structure of tier-1 hubs and tier-2 spokes.',
    ],
    storageKey: 'products/seo-master-notes.pdf',
    isPublished: true,
    isFeatured: true,
    isBestseller: false,
    sortOrder: 2,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'prod_cro_landing',
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
    tags: ['CRO', 'Landing Pages', 'Copywriting', 'Design Systems', 'Figma', 'UX'],
    whatYouLearn: [
      'The 5-second clarity test for above-the-fold headline and visual alignment.',
      'How to arrange trust badges, social proof, and comparison tables for maximum impact.',
      'Mobile-first layout hygiene: sticky CTAs, tap target ergonomics, and form friction removal.',
    ],
    whatsIncluded: [
      '82-page illustrated conversion guide.',
      'Figma UI Kit containing 18 ready-to-use landing page section wireframes.',
      'Copywriting swipe file with 50 high-converting headline templates.',
    ],
    faq: [
      {
        question: 'Do I need Figma experience to use this?',
        answer: 'No. The PDF guide explains all psychological and architectural principles independently. The Figma kit is an optional bonus for designers and builders.',
      },
    ],
    previewPages: [
      'Above-the-Fold Psychology: Why visitors bounce before scrolling and the exact 4 elements required in the primary viewport.',
      'Social Proof Placement Dynamics: Positioning testimonial quotes alongside objection triggers.',
    ],
    storageKey: 'products/high-converting-landing-page-guide.pdf',
    isPublished: true,
    isFeatured: false,
    isBestseller: true,
    sortOrder: 3,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'prod_b2b_growth',
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
    tags: ['B2B', 'Demand Gen', 'Outbound', 'Pipeline', 'Cold Email', 'LinkedIn'],
    whatYouLearn: [
      'Scoring target accounts based on job postings, tech stack changes, and hiring intent.',
      'Designing 4-touch personalized outreach sequences that generate 12%+ positive reply rates.',
      'Aligning SDR prospecting with marketing-driven content syndication.',
    ],
    whatsIncluded: [
      '96-page comprehensive tactical playbook.',
      'HubSpot & Salesforce pipeline stage configuration blueprints.',
      '15 proven B2B cold email sequence templates.',
    ],
    faq: [
      {
        question: 'Is this focused on enterprise or mid-market?',
        answer: 'The strategies are optimized for deal sizes ranging from ₹3L to ₹50L Annual Contract Value (ACV).',
      },
    ],
    previewPages: [
      'Intent Trigger Mapping: Spotting buying signals before competitors reach out.',
      'Multi-Threaded Outreach Workflows: Coordinating touchpoints across executive decision makers.',
    ],
    storageKey: 'products/b2b-growth-engine-playbook.pdf',
    isPublished: true,
    isFeatured: false,
    isBestseller: false,
    sortOrder: 4,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'prod_marketing_analytics',
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
    tags: ['Analytics', 'Attribution', 'GA4', 'Server-Side GTM', 'Tracking', 'UTM'],
    whatYouLearn: [
      'Setting up Server-Side GTM on Cloud Run to bypass ad blockers cleanly and legally.',
      'Creating a resilient UTM taxonomy across all organic and paid channels.',
      'Calculating Blended CAC and Marketing Efficiency Ratio (MER) without platform bias.',
    ],
    whatsIncluded: [
      '58-page technical manual with architectural diagrams.',
      'UTM Builder & Tracking Governance Spreadsheet.',
      'GTM Web and Server Container export JSONs.',
    ],
    faq: [
      {
        question: 'Do I need developer skills to implement server-side tracking?',
        answer: 'Basic understanding of DNS and cloud containers is helpful; the guide provides step-by-step terminal commands and cloud configurations.',
      },
    ],
    previewPages: [
      'The Illusion of Platform ROAS: Why adding platform metrics together produces fictional revenue.',
      'Server-Side Event Architecture: Routing payloads directly to Meta CAPI and GA4.',
    ],
    storageKey: 'products/marketing-analytics-attribution-notes.pdf',
    isPublished: true,
    isFeatured: false,
    isBestseller: false,
    sortOrder: 5,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'prod_growth_os',
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
    tags: ['Notion', 'Growth OS', 'Experimentation', 'ICE Scoring', 'Agile Marketing'],
    whatYouLearn: [
      'Implementing the weekly growth sprint rhythm used by elite growth teams.',
      'Formulating falsifiable hypotheses with clear statistical success metrics.',
      'Cataloging learnings so failed experiments still build institutional knowledge.',
    ],
    whatsIncluded: [
      '1-Click Duplicate Notion Workspace with relational databases.',
      '42-page implementation manual explaining sprint ceremonies.',
      '50 pre-loaded marketing experiment cards with execution blueprints.',
    ],
    faq: [
      {
        question: 'Does this require a paid Notion plan?',
        answer: 'No. The workspace works 100% on the free personal Notion tier.',
      },
    ],
    previewPages: [
      'The ICE Prioritization Engine: Scoring Impact, Confidence, and Ease objectively.',
      'Experiment Card Anatomy: Hypotheses, variables, metrics, and documentation standards.',
    ],
    storageKey: 'products/growth-experiment-operating-system.pdf',
    isPublished: true,
    isFeatured: true,
    isBestseller: true,
    sortOrder: 6,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'prod_email_vault',
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
    tags: ['Email Marketing', 'Retention', 'Klaviyo', 'Copywriting', 'Lifecycle', 'LTV'],
    whatYouLearn: [
      'Structuring non-spammy abandoned checkout flows that recover 8-14% of lost carts.',
      'Building dynamic post-purchase educational onboarding that slashes refund rates.',
      'Maintaining pristine domain deliverability and warming fresh sender IPs.',
    ],
    whatsIncluded: [
      '76-page tactical lifecycle manual.',
      '32 complete email copy templates with subject line variants.',
      'Visual flow diagrams for Klaviyo, MailerLite, and ActiveCampaign.',
    ],
    faq: [
      {
        question: 'Can I use this with any email service provider (ESP)?',
        answer: 'Yes. The trigger logic, timing delays, and copy templates can be implemented in any modern ESP.',
      },
    ],
    previewPages: [
      'The 4-Stage Welcome Flow: Moving subscribers from curious observers to first-time buyers.',
      'Dynamic Discount Laddering: Preserving profit margins during checkout recovery.',
    ],
    storageKey: 'products/email-marketing-automation-vault.pdf',
    isPublished: true,
    isFeatured: false,
    isBestseller: false,
    sortOrder: 7,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'prod_dtc_case_study',
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
    tags: ['Case Study', 'DTC', 'Scaling', 'Unit Economics', 'Real Data', 'Ad Spend'],
    whatYouLearn: [
      'How unit economics evolved as ad spend scaled from ₹20,000/day to ₹1,50,000/day.',
      'The exact creative fatigue timeline and how creative production was streamlined.',
      'Cash flow management principles for funding inventory during rapid scaling.',
    ],
    whatsIncluded: [
      '52-page deep-dive report with financial statements and performance graphs.',
      'Monthly P&L model spreadsheet with contribution margin calculations.',
    ],
    faq: [
      {
        question: 'Is the brand identity disclosed?',
        answer: 'Specific brand name is anonymized under NDA, but all metrics, numbers, ad creatives, and financials are 100% authentic and unrounded.',
      },
    ],
    previewPages: [
      'Unit Economics at Scale: Understanding contribution margin dollars versus platform ROAS.',
      'The Creative Fatigue Cliff: Why ad formats that won at ₹10L spend failed at ₹30L spend.',
    ],
    storageKey: 'products/dtc-brand-scaling-case-study.pdf',
    isPublished: true,
    isFeatured: false,
    isBestseller: false,
    sortOrder: 8,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'prod_google_ads',
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
    tags: ['Google Ads', 'PMax', 'Search Ads', 'PPC', 'Scripts', 'Intent'],
    whatYouLearn: [
      'Single-theme ad group structure that preserves keyword relevance and quality score.',
      'How to prevent Performance Max from cannibalizing your brand search traffic.',
      'Automated Google Ads Scripts for budget pacing and broken URL monitoring.',
    ],
    whatsIncluded: [
      '88-page illustrated playbook.',
      'Master Negative Keyword List (over 1,200 commercial junk search terms).',
      'Google Ads Script pack for PMax channel spend transparency.',
    ],
    faq: [
      {
        question: 'Does this cover Lead Generation or E-commerce Shopping?',
        answer: 'Both. Sections 3-5 focus on search ad intent for services/B2B; sections 6-8 cover Merchant Center and product feed optimizations.',
      },
    ],
    previewPages: [
      'Controlling the Black Box: Extracting placement data from Performance Max campaigns.',
      'Negative Keyword Architecture: Protecting search budgets from non-commercial search intent.',
    ],
    storageKey: 'products/google-search-pmax-playbook.pdf',
    isPublished: true,
    isFeatured: false,
    isBestseller: false,
    sortOrder: 9,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'prod_ad_creative',
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
    tags: ['Swipe File', 'Ad Copy', 'Creative Angles', 'Hooks', 'Direct Response'],
    whatYouLearn: [
      'The 5 universal hook formulas that stop the mobile scroll consistently.',
      'Structuring direct-response video scripts that handle objections within 30 seconds.',
      'How to design high-converting comparison graphics and feature teardowns.',
    ],
    whatsIncluded: [
      '45-page annotated PDF swipe file.',
      'Editable copy templates for static and video ads.',
    ],
    faq: [
      {
        question: 'Can I copy these angles directly?',
        answer: 'Yes, the framework provides fill-in-the-blank structures tailored to fit your specific product or service.',
      },
    ],
    previewPages: [
      'The Scroll-Stopping Hook Framework: Hooking viewers within the first 3 seconds.',
      'Direct-Response Comparison Visuals: Framing product alternatives effectively.',
    ],
    storageKey: 'products/ad-creative-swipe-briefs.pdf',
    isPublished: true,
    isFeatured: false,
    isBestseller: false,
    sortOrder: 10,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

export const DEFAULT_BUNDLES: CatalogProduct[] = [
  {
    id: 'bundle_complete_vault',
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
    tags: ['Bundle', 'Complete Library', 'All Products', 'VIP', 'Best Value'],
    whatYouLearn: [
      'Master the full growth stack: Paid Acquisition (Meta & Google), SEO, Analytics, Funnels, and Content.',
      'Access all operational templates, budget models, and creative swipe files.',
      'Study genuine growth experiments with raw data and spend breakdowns.',
      'Receive all future revisions and additions at no extra cost.',
    ],
    whatsIncluded: [
      'Instant access to all 10 individual products and their bonus files.',
      'Individual download links in your customer portal.',
      'Priority email Q&A support for implementation questions.',
      'Free lifetime access to all future editions and updates.',
    ],
    faq: [
      {
        question: 'Do I get all 10 products immediately?',
        answer: 'Yes, as soon as payment is confirmed, your download portal will unlock access to every product in the library.',
      },
      {
        question: 'Do I get future products added to the store?',
        answer: 'Yes, all future updates and additions to existing products are included forever.',
      },
    ],
    previewPages: [
      'The Complete Vault Index: Unifies tactical execution across paid media, SEO, retention, and analytics.',
    ],
    storageKey: 'products/complete-vault-archive.zip',
    isPublished: true,
    isFeatured: true,
    isBestseller: true,
    sortOrder: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'bundle_paid_triad',
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
    tags: ['Bundle', 'Paid Ads', 'Meta Ads', 'Google Ads', 'Analytics'],
    whatYouLearn: [
      'Run modern consolidated Meta Ads campaigns and creative testing sandboxes.',
      'Capture high-intent search traffic with negative keyword lists and structured PMax.',
      'Measure Blended CAC and eliminate tracking blind spots with first-party attribution.',
    ],
    whatsIncluded: [
      'Meta Ads Playbook (104 pages + 3 Spreadsheets).',
      'Google Search & PMax Playbook (88 pages + Negative Keyword Stack).',
      'Performance Analytics Notes (58 pages + Event Schema).',
    ],
    faq: [
      {
        question: 'Are the spreadsheets included in this bundle?',
        answer: 'Yes, all bonus templates and spreadsheets from the three individual products are included.',
      },
    ],
    previewPages: [
      'The Paid Acquisition Triad: Demand generation on Meta, demand capture on Google Search, and attribution truth.',
    ],
    storageKey: 'products/paid-acquisition-triad.zip',
    isPublished: true,
    isFeatured: true,
    isBestseller: false,
    sortOrder: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

export const ALL_DEFAULT_ITEMS: CatalogProduct[] = [...DEFAULT_BUNDLES, ...DEFAULT_PRODUCTS];

export function getDefaultProducts(): CatalogProduct[] {
  return DEFAULT_PRODUCTS;
}

export function getDefaultBundles(): CatalogProduct[] {
  return DEFAULT_BUNDLES;
}

export function getDefaultFeaturedProducts(): CatalogProduct[] {
  return DEFAULT_PRODUCTS.filter((p) => p.isFeatured);
}

export function getDefaultProductBySlug(slug: string): CatalogProduct | null {
  return ALL_DEFAULT_ITEMS.find((p) => p.slug === slug) || null;
}
