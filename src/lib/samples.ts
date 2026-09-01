import type { ArchitectureBrief } from "./types";

export const INDUSTRIES = [
  "Enterprise technology",
  "Healthcare",
  "Financial services",
  "Insurance",
  "Retail",
  "Public sector",
  "Manufacturing",
  "Other",
] as const;

export const SCALES = [
  "Pilot / MVP",
  "Business unit",
  "Enterprise",
  "Multi-region / global",
] as const;

export const ARCHITECTURE_STYLES = [
  {
    id: "recommend",
    label: "Recommend for this intent",
    hint: "The AI model picks the best application architecture style",
  },
  {
    id: "layered",
    label: "Layered / N-tier",
    hint: "Presentation, API, domain, and data stacked",
  },
  {
    id: "modular-monolith",
    label: "Modular monolith",
    hint: "One deployable app with hard module boundaries",
  },
  {
    id: "hexagonal",
    label: "Hexagonal (ports & adapters)",
    hint: "Domain core with UI and integration adapters",
  },
  {
    id: "microservices",
    label: "Microservices",
    hint: "Independently deployable application services",
  },
  {
    id: "event-driven",
    label: "Event-driven",
    hint: "Commands, events, and async application flow",
  },
  {
    id: "cqrs",
    label: "CQRS + read models",
    hint: "Separate write and query application paths",
  },
  {
    id: "serverless",
    label: "Serverless",
    hint: "Functions, managed data, and event triggers",
  },
  {
    id: "lcnc-runtime",
    label: "Low-code application runtime",
    hint: "Studio, catalog, and governed app host",
  },
] as const;

export const CONSTRAINT_OPTIONS = [
  "Cloud-first",
  "Low-code / no-code",
  "Generative AI",
  "Zero trust",
  "Data residency",
  "Cost-sensitive",
  "High availability",
  "Real-time",
  "SAP / Salesforce integration",
  "Audit & governance",
] as const;

export type SampleBrief = ArchitectureBrief & {
  id: string;
  label: string;
  summary: string;
};

export const SAMPLE_BRIEFS: SampleBrief[] = [
  {
    id: "governed-architecture-studio",
    label: "Governed architecture studio",
    summary: "A shared intake and review space that turns business intent into approved architecture packages.",
    title: "Enterprise Architecture Decision Studio",
    industry: "Enterprise technology",
    scale: "Enterprise",
    constraints: [
      "Low-code / no-code",
      "Generative AI",
      "Audit & governance",
      "Cloud-first",
      "SAP / Salesforce integration",
    ],
    existingSystems: "SAP S/4HANA, Salesforce Service Cloud, Azure AD / Entra ID, existing API gateway, ServiceNow.",
    architectureStyle: "lcnc-runtime",
    businessContext: `We need a governed architecture studio where business stakeholders and solution architects describe an outcome in natural language. The product must turn that intent into functional requirements, measurable quality attributes, and one recommended application blueprint.\n\nSpecialist agents should pass work from intent analysis through requirements and architecture design to a governance review. A human architect must review and approve the proposal before the package is marked ready for export.\n\nThe first release needs SSO-ready design, audit-friendly review evidence, integration with SAP and Salesforce, and a practical way to export an approved architecture package.\n\nSuccess means reducing solution-design cycle time from weeks to hours without sacrificing traceability, security, or architectural quality.`,
  },
  {
    id: "claims-modernization",
    label: "Healthcare claims",
    summary: "Regional insurer replacing a batch claims portal with a digital-first platform.",
    title: "Digital Claims Experience",
    industry: "Insurance",
    scale: "Business unit",
    constraints: ["Cloud-first", "High availability", "Audit & governance", "Data residency"],
    existingSystems: "Legacy AS/400 claims core, on-prem document store, member portal, call-center desktop.",
    architectureStyle: "layered",
    businessContext: `A regional health insurer wants to replace its paper-heavy claims intake with a digital claims experience for members, providers, and adjusters.\n\nMembers should submit claims with photos and documents from mobile. Providers need status APIs. Adjusters need a workbench with AI-assisted coding suggestions, fraud flags, and straight-through processing for low-risk claims.\n\nPeak volume is 40k claims/day. Claims data is sensitive health information and must remain in-region. The legacy core cannot be replaced in the first wave, so the new platform must coexist and gradually strangle the AS/400 batch interface.\n\nLeadership wants a 9-month first release that proves faster cycle time and fewer call-center contacts.`,
  },
  {
    id: "field-saas",
    label: "Field service SaaS",
    summary: "Multi-tenant product for technicians, dispatch, and parts across 200 customers.",
    title: "Field Service Cloud",
    industry: "Enterprise technology",
    scale: "Multi-region / global",
    constraints: ["Cloud-first", "Real-time", "Cost-sensitive", "Zero trust"],
    existingSystems: "Customer ERPs via REST/SFTP, Stripe billing, SendGrid, existing React admin.",
    architectureStyle: "modular-monolith",
    businessContext: `We are building a multi-tenant SaaS for mid-market field service companies. Dispatchers schedule jobs, technicians work from a mobile app offline, and customers track arrival windows.\n\nEach tenant brings their own parts catalog and SLA rules. We need isolation between tenants, near-real-time location updates during active jobs, and an integration hub for QuickBooks, SAP Business One, and Salesforce.\n\nThe product must launch in US and EU with data residency options. We have a small platform team, so operational burden and cost per tenant matter as much as feature velocity.`,
  },
  {
    id: "retail-inventory",
    label: "Retail inventory",
    summary: "Omnichannel stock truth across stores, DC, and marketplace for a national retailer.",
    title: "Omnichannel Inventory Fabric",
    industry: "Retail",
    scale: "Enterprise",
    constraints: ["Real-time", "High availability", "Cost-sensitive", "Cloud-first"],
    existingSystems: "Manhattan WMS, store POS, Shopify plus marketplace feeds, IBM MQ, Snowflake.",
    architectureStyle: "cqrs",
    businessContext: `A national retailer needs a single inventory truth across 420 stores, 6 DCs, web, and marketplaces. Oversells and phantom stock are creating refunds and lost trust.\n\nStore associates need handheld reservation. Web needs sub-second ATP. Marketplaces need scheduled feeds. Replenishment planners need projected availability, not just on-hand.\n\nThe current landscape is overnight batch files plus a brittle MQ bridge. We cannot rip out Manhattan WMS. The architecture must absorb store POS events, DC updates, and channel reservations with clear conflict rules.\n\nTarget: 99.95% ATP availability and <300ms p95 for availability checks during holiday peaks.`,
  },
];
