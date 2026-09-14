import fs from 'node:fs';
import path from 'node:path';

function createMinimalPdf(title: string, subtitle: string, sections: { heading: string; lines: string[] }[]): Buffer {
  const objects: string[] = [];
  const offsets: number[] = [];

  // Helper to escape PDF text
  const escapePdfText = (str: string) => str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  // 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

  // We will create 3 pages for each document to provide real multi-page reading
  const pageCount = 3;
  const pageObjIds = [3, 6, 9];

  // 2: Pages container
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>\nendobj`);

  // Font object (shared)
  const fontObjId = 12;

  // Page 1: Cover & Intro
  const page1Stream = `BT
/F1 24 Tf
50 720 Td
(${escapePdfText(title)}) Tj
/F1 14 Tf
0 -30 Td
(${escapePdfText(subtitle)}) Tj
/F1 10 Tf
0 -40 Td
(THE GROWTH ARCHIVE  |  FIELD KNOWLEDGE EDITION 2026) Tj
0 -20 Td
(CONFIDENTIAL & PROPRIETARY  |  LICENSED FOR SINGLE-OPERATOR USE) Tj
0 -40 Td
/F1 16 Tf
(EXECUTIVE BRIEFING & METHODOLOGY) Tj
/F1 11 Tf
0 -25 Td
(This digital resource synthesizes production experiments, campaign architecture,) Tj
0 -18 Td
(and battle-tested systems deployed across high-scale performance marketing campaigns.) Tj
0 -18 Td
(Every framework included here was verified against measurable CAC, ROAS, and retention.) Tj
0 -30 Td
/F1 14 Tf
(CORE OBJECTIVES) Tj
/F1 10 Tf
0 -20 Td
(1. Eliminate guesswork from campaign setup and scale with deterministic rules.) Tj
0 -18 Td
(2. Optimize unit economics, attribution models, and conversion rates.) Tj
0 -18 Td
(3. Execute standard operating procedures without relying on fragile hacks.) Tj
ET`;

  objects.push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 ${fontObjId} 0 R >> >> >>\nendobj`);
  objects.push(`4 0 obj\n<< /Length ${Buffer.byteLength(page1Stream)} >>\nstream\n${page1Stream}\nendstream\nendobj`);

  // Page 2: Detailed Frameworks
  const s1 = sections[0] || { heading: 'STRATEGIC FRAMEWORK', lines: ['Execution principle 1', 'Execution principle 2'] };
  let page2Ops = `BT
/F1 18 Tf
50 720 Td
(${escapePdfText(s1.heading)}) Tj
/F1 10 Tf
0 -30 Td
`;
  s1.lines.forEach((line) => {
    page2Ops += `(${escapePdfText(line)}) Tj\n0 -18 Td\n`;
  });
  page2Ops += `ET`;

  objects.push(`6 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 7 0 R /Resources << /Font << /F1 ${fontObjId} 0 R >> >> >>\nendobj`);
  objects.push(`7 0 obj\n<< /Length ${Buffer.byteLength(page2Ops)} >>\nstream\n${page2Ops}\nendstream\nendobj`);

  // Page 3: SOPs & Checklist
  const s2 = sections[1] || { heading: 'OPERATIONAL CHECKLIST & AUDIT', lines: ['Action item 1', 'Action item 2'] };
  let page3Ops = `BT
/F1 18 Tf
50 720 Td
(${escapePdfText(s2.heading)}) Tj
/F1 10 Tf
0 -30 Td
`;
  s2.lines.forEach((line) => {
    page3Ops += `(${escapePdfText(line)}) Tj\n0 -18 Td\n`;
  });
  page3Ops += `0 -30 Td
/F1 9 Tf
(The Growth Archive - Verified Knowledge Products - All Rights Reserved) Tj
ET`;

  objects.push(`9 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 10 0 R /Resources << /Font << /F1 ${fontObjId} 0 R >> >> >>\nendobj`);
  objects.push(`10 0 obj\n<< /Length ${Buffer.byteLength(page3Ops)} >>\nstream\n${page3Ops}\nendstream\nendobj`);

  // Shared font object
  objects.push(`${fontObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);

  // Assemble PDF with exact byte offsets
  let header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  let body = '';
  let currentOffset = Buffer.byteLength(header);

  // We need offset for each object index 1..12
  const sortedOffsets: { id: number; offset: number }[] = [];

  for (const obj of objects) {
    const idMatch = obj.match(/^(\d+)\s+0\s+obj/);
    if (idMatch) {
      const id = parseInt(idMatch[1], 10);
      sortedOffsets.push({ id, offset: currentOffset });
    }
    const chunk = obj + '\n';
    body += chunk;
    currentOffset += Buffer.byteLength(chunk);
  }

  const maxId = Math.max(...sortedOffsets.map((o) => o.id));
  const offsetMap: { [k: number]: number } = {};
  sortedOffsets.forEach((o) => {
    offsetMap[o.id] = o.offset;
  });

  let xref = `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= maxId; i++) {
    const off = offsetMap[i] || 0;
    const padded = off.toString().padStart(10, '0');
    xref += `${padded} 00000 n \n`;
  }

  const startXref = currentOffset;
  const trailer = `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(header + body + xref + trailer);
}

const productsToGenerate = [
  {
    fileName: 'meta-ads-playbook.pdf',
    title: 'Meta Ads Playbook (2026 Edition)',
    subtitle: 'Campaign Architecture, Creative Sandbox, and Scaling Workflows',
    sections: [
      {
        heading: 'SECTION 1: THE CONSOLIDATED CAMPAIGN MODEL',
        lines: [
          'Modern Meta bidding algorithms require maximum liquidity and minimal ad set fragmentation.',
          'Broad targeting paired with creative-level demographic segregation outperforms micro-audiences.',
          'Implement a 3-tier structure: Sandbox (testing), Scaling (proven winners), and Retention (LTV).',
          'Set bid caps strategically only when scaling spend exceeds 3x target daily budget.',
          'Creative diversity is the real targeting lever: static hooks, UGC problem-aware, and comparison charts.',
        ],
      },
      {
        heading: 'SECTION 2: CREATIVE TESTING PROTOCOL & METRICS',
        lines: [
          'Rule 1: Never edit a winning ad set; spawn duplicates with updated dynamic creative pools.',
          'Rule 2: Measure thumb-stop ratio (3-second views / impressions) target > 35%.',
          'Rule 3: Measure outbound click-through-rate (CTR) target > 1.8% for cold traffic.',
          'Rule 4: Kill losers at 1.5x target CPA if outbound ROAS is below break-even threshold.',
          'Audit cadence: Weekly budget reallocation based on 7-day trailing blended CAC.',
        ],
      },
    ],
  },
  {
    fileName: 'seo-master-notes.pdf',
    title: 'SEO Master Notes: Information Architecture & Ranking Signals',
    subtitle: 'Comprehensive Reference Notes on Crawl Budgets, Semantic Entities & Topic Clusters',
    sections: [
      {
        heading: 'CHAPTER 1: SEMANTIC ENTITY MAPPING',
        lines: [
          'Search engines rank topical authority clusters, not isolated keyword matches.',
          'Structure your information architecture using pillar pages linked to tightly focused satellite articles.',
          'Include schema.org structured data (Article, FAQPage, BreadcrumbList) on every URL.',
          'Internal anchor text must be descriptive and varied; avoid generic click-here anchors.',
          'Prioritize natural language entity co-occurrence in headers (H2, H3) and opening paragraphs.',
        ],
      },
      {
        heading: 'CHAPTER 2: TECHNICAL CRAWLABILITY & CWV CHECKLIST',
        lines: [
          'Ensure server response time (TTFB) is below 300ms across all cached endpoints.',
          'Eliminate redirect chains and clean orphan URLs using periodic XML sitemap audits.',
          'Target Largest Contentful Paint (LCP) < 2.0s, Cumulative Layout Shift (CLS) < 0.05.',
          'Utilize canonical tags strictly on duplicate and paginated parameter variations.',
          'Monitor Google Search Console Index Coverage weekly for soft 404s and noindex leaks.',
        ],
      },
    ],
  },
  {
    fileName: 'digital-marketing-fundamentals.pdf',
    title: 'Digital Marketing Fundamentals: Growth Architecture',
    subtitle: 'Core Foundations of Modern Acquisition, Attribution, and Retention',
    sections: [
      {
        heading: 'MODULE 1: THE UNIT ECONOMICS OF GROWTH',
        lines: [
          'Understanding LTV:CAC ratios: A sustainable small business operates at 3:1 or higher.',
          'Payback period: Strive to recoup customer acquisition cost within 30 to 60 days.',
          'Blended CAC vs Platform CAC: Always monitor MER (Marketing Efficiency Ratio).',
          'A/B testing statistical significance: Test one variable at a time with sufficient power.',
          'Building high-converting landing pages: Hierarchy, proof, clarity, and reduced friction.',
        ],
      },
      {
        heading: 'MODULE 2: RETENTION & LIFETIME VALUE ACCELERATION',
        lines: [
          'The first 7 days define churn: Design an automated email onboarding sequence.',
          'Segment customers by purchase frequency and average order value (RFM Analysis).',
          'Re-engagement campaigns: Time win-back incentives to the average reorder interval.',
          'Customer feedback loops: Review zero-party survey data to refine value propositions.',
          'Net Promoter Score (NPS) tracking: Actively mobilize promoters for word-of-mouth growth.',
        ],
      },
    ],
  },
  {
    fileName: 'growth-experiments-case-study.pdf',
    title: 'Scaling D2C to 50L/mo: Field Experiments & Post-Mortem',
    subtitle: 'What Worked, What Burned Budget, and Exact Campaign Iterations',
    sections: [
      {
        heading: 'CASE STUDY: 12 MONTHS OF CONTINUOUS EXPERIMENTS',
        lines: [
          'Experiment 1 (Landing Page Redesign): Removing navigation bar lifted checkout rate by 22.4%.',
          'Experiment 2 (Offer Bundling): Introducing a 3-item tier increased AOV from Rs 850 to Rs 1,420.',
          'Experiment 3 (Failed Advantage+ Campaign): Broad lookalikes cannibalized existing search traffic.',
          'Experiment 4 (Founder Video Ads): Raw, unedited phone footage delivered 41% lower CPA than studio ads.',
          'Experiment 5 (Post-Purchase One-Click Upsell): Added Rs 3.8L net profit with zero ad spend.',
        ],
      },
      {
        heading: 'KEY LESSONS & REPRODUCIBLE FRAMEWORKS',
        lines: [
          'Never scale ad budget more than 20% every 48 hours to preserve algorithmic stability.',
          'Creative fatigue arrives faster than audience saturation: Refresh hooks weekly.',
          'Attribution lag: Customers often take 4 to 11 days to convert after initial touchpoint.',
          'Track first-party conversions using CAPI (Conversions API) to bridge Safari tracking gaps.',
          'A solid product with high reorder rate beats any ad hack every single time.',
        ],
      },
    ],
  },
  {
    fileName: 'content-engine-strategy-guide.pdf',
    title: 'Organic Content Engine & Editorial Strategy',
    subtitle: 'Systems for Producing High-Signal Articles, Case Studies, and Newsletters',
    sections: [
      {
        heading: 'PILLAR 1: EDITORIAL IDEATION & RESEARCH WORKFLOW',
        lines: [
          'Source topics from customer support tickets, sales objections, and forum questions.',
          'Structure each piece around a contrarian or counter-intuitive insight.',
          'Build reusable content blocks: summaries, actionable takeaways, and diagrams.',
          'Repurposing flywheel: 1 long-form guide -> 3 newsletter issues -> 10 social breakdowns.',
          'Maintain an editorial calendar with consistent publishing intervals.',
        ],
      },
      {
        heading: 'PILLAR 2: DISTRIBUTION & BACKLINK MAGNETS',
        lines: [
          'Original research and industry benchmarks generate 10x more organic backlinks.',
          'Direct outreach to industry newsletters and roundups with customized excerpts.',
          'Optimize for search intent before publishing: match user query depth accurately.',
          'Update decaying content every 6 months to maintain search engine freshness signals.',
          'Measure content ROI by tracking assisted conversions in multi-touch attribution.',
        ],
      },
    ],
  },
  {
    fileName: 'high-converting-funnel-guide.pdf',
    title: 'High-Converting Funnel Architecture Guide',
    subtitle: 'Step-by-Step Blueprint for Wireframing, Messaging, and Conversion Optimization',
    sections: [
      {
        heading: 'STAGE 1: HERO SECTION & VALUE PROPOSITION',
        lines: [
          'State the exact problem, the solution, and the proof within the initial viewport.',
          'Single Primary CTA: Avoid competing secondary actions that cause decision paralysis.',
          'Visual proof: Show the actual product, dashboard, or resource mockup clearly.',
          'Social proof: Place verified customer testimonials immediately below the hero fold.',
          'Page speed: Ensure mobile visual load takes less than 1.5 seconds on 4G connections.',
        ],
      },
      {
        heading: 'STAGE 2: OBJECTION HANDLING & CHECKOUT FLOW',
        lines: [
          'Systematically answer the top 5 buying objections before the pricing table.',
          'Provide transparent pricing with zero unexpected fees at checkout.',
          'Streamline checkout forms: Only request essential fields (Email and Name for digital products).',
          'Trust badges: Display secure payment gateways (Razorpay, SSL encryption, instant delivery).',
          'Include an explicit, risk-free satisfaction guarantee with clear terms.',
        ],
      },
    ],
  },
  {
    fileName: 'google-search-pmax-playbook.pdf',
    title: 'Google Ads & Performance Max Playbook',
    subtitle: 'Search Intent Architecture, Negative Keyword Stacks, and PMax Asset Groups',
    sections: [
      {
        heading: 'PART 1: SEARCH CAMPAIGN STRUCTURING',
        lines: [
          'Segregate high-intent transactional search terms from informational queries.',
          'Utilize exact match and phrase match alongside extensive account-level negative lists.',
          'Implement Value-Based Bidding (tROAS) once conversion volume exceeds 30/month.',
          'Craft responsive search ads with distinct headline variations: brand, feature, benefit, CTA.',
          'Audit search term reports bi-weekly to uncover negative keyword candidates.',
        ],
      },
      {
        heading: 'PART 2: PERFORMANCE MAX SCALING & ASSET MASTERY',
        lines: [
          'Feed high-quality first-party customer audience signals into PMax asset groups.',
          'Exclude existing customer brand searches using brand exclusion lists to avoid cannibalization.',
          'Provide high-resolution image assets across landscape, square, and portrait ratios.',
          'Monitor placement reports to prune low-quality display network and mobile game placements.',
          'Scale budgets gradually during seasonal peaks while monitoring search impression share.',
        ],
      },
    ],
  },
  {
    fileName: 'marketing-analytics-attribution-notes.pdf',
    title: 'Marketing Analytics & Attribution Notes',
    subtitle: 'First-Party Tracking, GA4 Event Modeling, and Blended CAC Measurement',
    sections: [
      {
        heading: 'CHAPTER 1: GA4 EVENT ARCHITECTURE & MEASUREMENT',
        lines: [
          'Standardize ecommerce events: view_item, add_to_cart, begin_checkout, purchase.',
          'Pass consistent transaction IDs, currency codes, and coupon metadata in purchase payloads.',
          'Configure custom dimensions for customer type (New vs Returning) and product format.',
          'Set up Server-Side GTM to eliminate ad-blocker tracking loss and ensure privacy compliance.',
          'Reconcile GA4 recorded purchases with database revenue weekly to measure attribution accuracy.',
        ],
      },
      {
        heading: 'CHAPTER 2: MULTI-TOUCH ATTRIBUTION & MER',
        lines: [
          'Why last-click attribution misleads paid social: acknowledge upper-funnel influence.',
          'Calculate Marketing Efficiency Ratio (MER): Total Revenue / Total Paid Ad Spend.',
          'Track new customer blended CAC to evaluate overall brand acquisition trajectory.',
          'Set up cohort retention retention tables to evaluate cohort profitability over 3, 6, and 12 months.',
          'Build automated alerting for sudden attribution drops or broken checkout tags.',
        ],
      },
    ],
  },
  {
    fileName: 'ad-creative-swipe-briefs.pdf',
    title: 'Ad Creative Swipe File & Production Briefs',
    subtitle: '45 Proven Hook Scripts, Wireframe Layouts, and Creative Brief Templates',
    sections: [
      {
        heading: 'SECTION 1: THE 5 HOOK ARCHETYPES',
        lines: [
          'Archetype 1: The Contrarian Truth (e.g., "Why 90% of Meta ads fail in 2026").',
          'Archetype 2: The Before & After Breakdown with real metric screenshots.',
          'Archetype 3: The System Audit ("5 things we fixed in an ad account that doubled ROAS").',
          'Archetype 4: The Direct Comparison (Old way vs Modern systematic way).',
          'Archetype 5: The Tactical Checklist ("Check these 3 settings before spending another Rupee").',
        ],
      },
      {
        heading: 'SECTION 2: CREATIVE PRODUCTION WORKFLOW',
        lines: [
          'Step 1: Define the single value proposition before writing copy or designing graphics.',
          'Step 2: Script the first 3 seconds with high visual contrast and bold headline overlays.',
          'Step 3: Keep body copy concise, scannable, and focused on customer pain points.',
          'Step 4: End with a specific, frictionless call to action that matches landing page copy.',
          'Step 5: Export high-bitrate MP4 and compressed WebP assets to ensure instant loading.',
        ],
      },
    ],
  },
];

const storageDir = path.join(process.cwd(), 'storage', 'products');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

for (const p of productsToGenerate) {
  const filePath = path.join(storageDir, p.fileName);
  const pdfBuffer = createMinimalPdf(p.title, p.subtitle, p.sections);
  fs.writeFileSync(filePath, pdfBuffer);
  console.log(`Generated ${p.fileName} (${pdfBuffer.length} bytes)`);
}

// Generate templates ZIP as well
const zipMockPath = path.join(storageDir, 'marketers-operating-system-templates.zip');
const zipMockContent = Buffer.from(
  'PK\x03\x04' +
    'The Growth Archive - Marketers Operating System Templates (Notion Workspace, Google Sheets Budget Tracker, Campaign Briefs).'
);
fs.writeFileSync(zipMockPath, zipMockContent);
console.log(`Generated marketers-operating-system-templates.zip (${zipMockContent.length} bytes)`);
console.log('All product assets successfully written to private storage.');
