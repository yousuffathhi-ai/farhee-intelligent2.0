import { BusinessReportData } from '../lib/exporters';

export interface DocumentTemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  badge: string;
  recommendedFormat: 'xlsx' | 'pdf' | 'pptx' | 'docx';
  data: BusinessReportData;
}

export const PROFESSIONAL_DOCUMENT_TEMPLATES: DocumentTemplateItem[] = [
  {
    id: 'annual-report',
    name: 'Annual Report & Fiscal Review',
    category: 'Corporate Finance',
    description: 'Comprehensive year-end performance review with consolidated P&L, global operating margins, and executive governance overview.',
    badge: 'Executive Standard',
    recommendedFormat: 'pdf',
    data: {
      title: 'FY2025 Annual Corporate Performance & Fiscal Review',
      author: 'Office of the Chief Financial Officer',
      company: 'OmniSphere Global Enterprises',
      executiveSummary:
        'Throughout Fiscal Year 2025, OmniSphere demonstrated exceptional balance sheet resilience and structural margin expansion. Consolidated net revenue expanded 31.4% YoY to $3.48M across all operating territories. Strategic investments in AI infrastructure automation compressed operational overhead by 420 basis points, while enterprise renewal rates hit a record 99.1%. Cash flow from operations grew 38.2%, fully self-funding our multi-region data sovereignty expansions.',
      financialMetrics: [
        { month: 'Q1 Jan-Feb', revenue: 480000, cogs: 135000, grossProfit: 345000, opex: 160000, netIncome: 185000, marginPct: 38.5 },
        { month: 'Q1 March', revenue: 520000, cogs: 142000, grossProfit: 378000, opex: 168000, netIncome: 210000, marginPct: 40.4 },
        { month: 'Q2 Apr-May', revenue: 565000, cogs: 151000, grossProfit: 414000, opex: 174000, netIncome: 240000, marginPct: 42.5 },
        { month: 'Q2 June', revenue: 610000, cogs: 158000, grossProfit: 452000, opex: 182000, netIncome: 270000, marginPct: 44.3 },
        { month: 'Q3 Jul-Sep', revenue: 645000, cogs: 164000, grossProfit: 481000, opex: 190000, netIncome: 291000, marginPct: 45.1 },
        { month: 'Q4 Oct-Dec', revenue: 660000, cogs: 168000, grossProfit: 492000, opex: 195000, netIncome: 297000, marginPct: 45.0 },
      ],
      regionalData: [
        { region: 'North America Enterprise', revenue: 1420000, growthPct: 29.4, marketSharePct: 44.5, headcount: 210 },
        { region: 'EMEA Technology Hub', revenue: 980000, growthPct: 24.8, marketSharePct: 28.2, headcount: 145 },
        { region: 'Asia-Pacific Digital Nodes', revenue: 820000, growthPct: 41.2, marketSharePct: 20.8, headcount: 120 },
        { region: 'Latin America Operations', revenue: 260000, growthPct: 32.6, marketSharePct: 6.5, headcount: 48 },
      ],
      recommendations: [
        'Deploy dedicated regional capital reserves into localized Tier-4 sovereign AI data centers.',
        'Accelerate enterprise multi-year subscription conversions with automated governance guarantees.',
        'Maintain gross margin discipline by expanding automated self-healing cloud pipelines.',
        'Sustain dividend and reinvestment program based on compounding free cash flow yield.',
      ],
    },
  },
  {
    id: 'project-proposal',
    name: 'Strategic Project Proposal',
    category: 'Business Development',
    description: 'Structured initiative charter detailing project objectives, capital budget allocation, milestone schedules, and expected return on investment (ROI).',
    badge: 'Proposal & RFP',
    recommendedFormat: 'docx',
    data: {
      title: 'Project Horizon: Next-Generation Enterprise AI & Telemetry Modernization',
      author: 'farhee Architecture & Solutions Group',
      company: 'Nexis Systems International',
      executiveSummary:
        'Project Horizon establishes a decentralized, zero-trust enterprise telemetry and autonomous workflow mesh across all core operational divisions. Designed for zero-downtime integration over a 6-month deployment sprint, the architecture consolidates fragmented legacy databases into an encrypted, real-time event pipeline projected to eliminate $780,000 in recurring manual audit overhead and reduce data latency by 85%.',
      financialMetrics: [
        { month: 'Phase 1 Setup', revenue: 95000, cogs: 28000, grossProfit: 67000, opex: 34000, netIncome: 33000, marginPct: 34.7 },
        { month: 'Phase 2 Architecture', revenue: 165000, cogs: 42000, grossProfit: 123000, opex: 48000, netIncome: 75000, marginPct: 45.5 },
        { month: 'Phase 3 Core Mesh', revenue: 210000, cogs: 51000, grossProfit: 159000, opex: 56000, netIncome: 103000, marginPct: 49.0 },
        { month: 'Phase 4 Security & E2EE', revenue: 240000, cogs: 55000, grossProfit: 185000, opex: 60000, netIncome: 125000, marginPct: 52.1 },
        { month: 'Phase 5 Global Rollout', revenue: 290000, cogs: 62000, grossProfit: 228000, opex: 68000, netIncome: 160000, marginPct: 55.2 },
        { month: 'Phase 6 Steady State', revenue: 330000, cogs: 66000, grossProfit: 264000, opex: 72000, netIncome: 192000, marginPct: 58.2 },
      ],
      regionalData: [
        { region: 'Primary Cloud Infrastructure', revenue: 540000, growthPct: 48.0, marketSharePct: 40.5, headcount: 52 },
        { region: 'Branch Site Edge Clusters', revenue: 380000, growthPct: 36.5, marketSharePct: 28.5, headcount: 38 },
        { region: 'Mobile & Field Workforce', revenue: 260000, growthPct: 42.0, marketSharePct: 19.5, headcount: 26 },
        { region: 'Partner API Integrations', revenue: 150000, growthPct: 55.0, marketSharePct: 11.5, headcount: 14 },
      ],
      recommendations: [
        'Secure executive sponsorship and finalize sign-off across SecOps and Compliance steering committees.',
        'Execute weekly automated regression testing with synthetic workloads prior to production cutover.',
        'Establish 24/7 hypercare support during the first 45 days of regional telemetry onboarding.',
        'Publish internal developer documentation and interactive SDKs to spur grassroots internal adoption.',
      ],
    },
  },
  {
    id: 'financial-audit',
    name: 'Financial Performance & Audit Dossier',
    category: 'Audit & Compliance',
    description: 'Detailed unit-economics audit evaluating COGS breakdown, operational leverage, cash-burn velocity, and risk mitigation strategies.',
    badge: 'Auditor Approved',
    recommendedFormat: 'xlsx',
    data: {
      title: 'Q3/Q4 Forensic Financial Performance & Operating Leverage Audit',
      author: 'Internal Audit & Forensic Accounting Directorate',
      company: 'Apex Financial Holdings',
      executiveSummary:
        'This comprehensive audit examines capital efficiency, gross margin retention, and operational expenditure across all four reporting divisions. Audit verification confirms full reconciliation across all general ledger entries with zero unhedged liquidity exposure. Year-to-date operating margin reached an audited 44.8%, beating initial internal guidance by 230 basis points.',
      financialMetrics: [
        { month: 'July', revenue: 195000, cogs: 56000, grossProfit: 139000, opex: 54000, netIncome: 85000, marginPct: 43.6 },
        { month: 'August', revenue: 208000, cogs: 58000, grossProfit: 150000, opex: 56000, netIncome: 94000, marginPct: 45.2 },
        { month: 'September', revenue: 224000, cogs: 61000, grossProfit: 163000, opex: 58000, netIncome: 105000, marginPct: 46.9 },
        { month: 'October', revenue: 236000, cogs: 63000, grossProfit: 173000, opex: 60000, netIncome: 113000, marginPct: 47.9 },
        { month: 'November', revenue: 248000, cogs: 65000, grossProfit: 183000, opex: 62000, netIncome: 121000, marginPct: 48.8 },
        { month: 'December', revenue: 275000, cogs: 68000, grossProfit: 207000, opex: 65000, netIncome: 142000, marginPct: 51.6 },
      ],
      regionalData: [
        { region: 'Core Banking Operations', revenue: 580000, growthPct: 18.2, marketSharePct: 42.0, headcount: 85 },
        { region: 'Wealth & Asset Management', revenue: 410000, growthPct: 27.5, marketSharePct: 29.5, headcount: 54 },
        { region: 'Digital Payment Processing', revenue: 295000, growthPct: 39.1, marketSharePct: 21.0, headcount: 46 },
        { region: 'Institutional Treasury Desk', revenue: 101000, growthPct: 12.4, marketSharePct: 7.5, headcount: 18 },
      ],
      recommendations: [
        'Enforce automated transaction signing and dual-control approvals for treasury transfers above $100k.',
        'Consolidate multi-currency hedging contracts to minimize cross-border currency volatility.',
        'Migrate legacy ledger logging to immutable append-only cryptographic event stores.',
        'Conduct semi-annual tabletop disaster recovery simulations across all cloud failure domains.',
      ],
    },
  },
  {
    id: 'product-gtm',
    name: 'Product Launch & Go-To-Market Strategy',
    category: 'Product & Marketing',
    description: 'Executive commercialization roadmap with TAM/SAM analysis, customer acquisition funnels, multi-channel pricing models, and slide deck outline.',
    badge: 'Executive GTM',
    recommendedFormat: 'pptx',
    data: {
      title: 'Commercial Go-To-Market Launch Strategy: OmniAgent 2.0 Enterprise',
      author: 'Global Product Marketing & Commercialization Team',
      company: 'Vanguard Cognitive Labs',
      executiveSummary:
        'The commercial rollout of OmniAgent 2.0 represents our flagship expansion into the $42B enterprise workflow intelligence market. Leveraging our proprietary low-latency neural routing stack and client-side zero-knowledge security, this go-to-market plan targets 450 tier-one enterprise accounts across finance, healthcare, and logistics, aiming for $2.4M ARR within the initial 180 days of general availability.',
      financialMetrics: [
        { month: 'M1 Private Alpha', revenue: 60000, cogs: 22000, grossProfit: 38000, opex: 45000, netIncome: -7000, marginPct: -11.7 },
        { month: 'M2 Public Beta', revenue: 125000, cogs: 35000, grossProfit: 90000, opex: 58000, netIncome: 32000, marginPct: 25.6 },
        { month: 'M3 GA Launch', revenue: 240000, cogs: 52000, grossProfit: 188000, opex: 75000, netIncome: 113000, marginPct: 47.1 },
        { month: 'M4 Expansion', revenue: 330000, cogs: 65000, grossProfit: 265000, opex: 88000, netIncome: 177000, marginPct: 53.6 },
        { month: 'M5 Enterprise Tier', revenue: 410000, cogs: 78000, grossProfit: 332000, opex: 96000, netIncome: 236000, marginPct: 57.5 },
        { month: 'M6 Full Scale', revenue: 520000, cogs: 92000, grossProfit: 428000, opex: 110000, netIncome: 318000, marginPct: 61.2 },
      ],
      regionalData: [
        { region: 'Enterprise Direct Sales (US)', revenue: 780000, growthPct: 65.0, marketSharePct: 46.0, headcount: 45 },
        { region: 'Global Systems Integrators (EU)', revenue: 490000, growthPct: 52.0, marketSharePct: 29.0, headcount: 32 },
        { region: 'High-Growth Tech Startups (APAC)', revenue: 310000, growthPct: 78.0, marketSharePct: 18.0, headcount: 22 },
        { region: 'Self-Service Developer Tier', revenue: 105000, growthPct: 92.0, marketSharePct: 7.0, headcount: 12 },
      ],
      recommendations: [
        'Ignite organic developer advocacy with an open-source sandbox and interactive code recipes.',
        'Offer white-glove migration services for Fortune 500 legacy installations to drive 6-figure ACVs.',
        'Co-market with cloud marketplace partners (AWS, GCP, Azure) for rapid enterprise procurement.',
        'Establish an advisory board of customer CIOs to guide quarterly enterprise feature priorities.',
      ],
    },
  },
  {
    id: 'consulting-sow',
    name: 'Consulting Scope of Work & SLA',
    category: 'Professional Services',
    description: 'Formal consulting agreement detailing technical milestones, billable workstreams, governance structure, and Service Level Agreements (SLAs).',
    badge: 'Legal & SOW',
    recommendedFormat: 'docx',
    data: {
      title: 'Master Consulting Scope of Work & Technical Advisory Agreement',
      author: 'Principal Advisory Practice Lead',
      company: 'Strategic Horizons Advisory LLC',
      executiveSummary:
        'This Scope of Work (SOW) outlines the strategic advisory, architectural blueprinting, and implementation oversight delivered by Strategic Horizons Advisory. The engagement centers on modernizing core database infrastructure, establishing zero-trust encryption boundaries, and upskilling in-house engineering squads over a 24-week collaborative roadmap with defined milestones and SLAs.',
      financialMetrics: [
        { month: 'Discovery & Audit', revenue: 85000, cogs: 24000, grossProfit: 61000, opex: 22000, netIncome: 39000, marginPct: 45.8 },
        { month: 'Architectural Design', revenue: 140000, cogs: 36000, grossProfit: 104000, opex: 30000, netIncome: 74000, marginPct: 52.8 },
        { month: 'Prototype Build', revenue: 180000, cogs: 44000, grossProfit: 136000, opex: 38000, netIncome: 98000, marginPct: 54.4 },
        { month: 'Security Verification', revenue: 195000, cogs: 48000, grossProfit: 147000, opex: 40000, netIncome: 107000, marginPct: 54.8 },
        { month: 'Staff Enablement', revenue: 160000, cogs: 40000, grossProfit: 120000, opex: 35000, netIncome: 85000, marginPct: 53.1 },
        { month: 'Handover & Governance', revenue: 130000, cogs: 32000, grossProfit: 98000, opex: 28000, netIncome: 70000, marginPct: 53.8 },
      ],
      regionalData: [
        { region: 'On-Site Technical Advisors', revenue: 420000, growthPct: 22.0, marketSharePct: 47.0, headcount: 16 },
        { region: 'Remote Engineering Squads', revenue: 290000, growthPct: 35.0, marketSharePct: 32.5, headcount: 24 },
        { region: 'Security & Pen-Testing Team', revenue: 120000, growthPct: 18.5, marketSharePct: 13.5, headcount: 8 },
        { region: 'Executive Advisory Council', revenue: 60000, growthPct: 10.0, marketSharePct: 7.0, headcount: 4 },
      ],
      recommendations: [
        'Conduct bi-weekly sprint reviews with joint engineering leads to ensure continuous SLA tracking.',
        'Tie progress billing milestones to tangible code deliverables and automated compliance checks.',
        'Implement an internal knowledge transfer repository with recorded deep-dive architectural walkthroughs.',
        'Establish a post-handover 90-day technical warranty for all custom infrastructure components.',
      ],
    },
  },
];
