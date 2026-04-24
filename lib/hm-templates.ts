/**
 * Hand-curated JD templates surfaced to HMs in /hm.
 * Pure client-side data — the whole HM flow is a vision demo; no DB writes.
 */

export interface JdDraft {
  title: string;
  role_family: string;
  team: string;
  location: string;
  compensation: string;
  about: string;
  responsibilities: string[];
  must_haves: string[];
  nice_to_haves: string[];
  benefits: string[];
  team_intro: string;
}

export interface JdTemplate {
  id: string;
  title: string;
  subtitle: string;
  role_family: string;
  accent: "eng" | "design" | "sales";
  draft: JdDraft;
}

export const JD_TEMPLATES: JdTemplate[] = [
  {
    id: "sfe",
    title: "Senior Frontend Engineer",
    subtitle: "React + TypeScript · product-facing team",
    role_family: "Engineering",
    accent: "eng",
    draft: {
      title: "Senior Frontend Engineer",
      role_family: "Engineering",
      team: "Payments",
      location: "Bangalore · Hybrid (3 days in-office)",
      compensation: "₹42–58L + equity",
      about:
        "We're looking for a senior engineer to lead the next chapter of our payments checkout experience. You'll own the frontend of flows that process millions of transactions a day, partnering closely with design, backend, and growth to ship polished, performant UIs that customers trust.",
      responsibilities: [
        "Lead frontend architecture for one of our core product surfaces",
        "Set the bar for code quality, testing discipline, and performance",
        "Partner with design to translate ambiguous problems into shipped product",
        "Mentor mid-level engineers and shape hiring standards",
        "Drive migrations (framework, tooling, design-system adoption) end-to-end",
      ],
      must_haves: [
        "5+ years shipping production React apps",
        "Strong TypeScript fluency, including library authoring",
        "Experience with Next.js or Remix at scale",
        "Comfort owning full features end-to-end — from Figma to on-call",
        "History of collaborating deeply with designers",
      ],
      nice_to_haves: [
        "Contributed to or owned a design system",
        "Payments, fintech, or high-compliance product background",
        "Core Web Vitals / performance-tuning experience",
        "Open-source maintenance or conference-speaking",
      ],
      benefits: [
        "Competitive base + meaningful equity",
        "Top-tier health insurance for you and family",
        "Flexible time off — minimum 20 days/year",
        "Annual learning budget (books, courses, conferences)",
        "Home office setup stipend",
      ],
      team_intro:
        "The Payments team is 8 engineers + 2 designers + 1 PM, based primarily in Bangalore with teammates in Singapore and Amsterdam. We ship every week and review each other's code in the open.",
    },
  },
  {
    id: "spd",
    title: "Senior Product Designer",
    subtitle: "Systems thinker · B2B SaaS",
    role_family: "Design",
    accent: "design",
    draft: {
      title: "Senior Product Designer",
      role_family: "Design",
      team: "Core Product",
      location: "Remote · IST +/- 4h preferred",
      compensation: "₹35–50L + equity",
      about:
        "You'll shape how sales teams experience our platform end-to-end. This is a systems role — you'll balance new feature design with maturing our design language, collaborating with engineering to ship work that holds up under real-world load.",
      responsibilities: [
        "Own design for a strategic product area from discovery to ship",
        "Contribute foundational patterns to our design system",
        "Partner with research to turn customer signal into product direction",
        "Mentor designers on visual and interaction craft",
        "Run design reviews and raise the team's overall bar",
      ],
      must_haves: [
        "5+ years of product design at B2B SaaS or equivalent complexity",
        "Strong portfolio showing shipped work, not just concepts",
        "Fluency in systems thinking — components, tokens, contribution workflows",
        "Experience collaborating with engineers inside a component repo",
      ],
      nice_to_haves: [
        "Prior ownership of a design system",
        "Illustration or motion-design chops",
        "Background in data-heavy or CRM-adjacent products",
      ],
      benefits: [
        "Competitive base + meaningful equity",
        "Fully remote with an optional Bangalore WeWork membership",
        "Annual team offsite (last one was in Goa)",
        "Design software stipend (Figma, Linear, etc. on us)",
      ],
      team_intro:
        "Our design team is 5 people spread across IN / NL / SG. We hold weekly critique and share work early — no solo designers locked in rooms.",
    },
  },
  {
    id: "eae",
    title: "Enterprise Account Executive",
    subtitle: "BFSI focus · India market",
    role_family: "Sales",
    accent: "sales",
    draft: {
      title: "Enterprise Account Executive",
      role_family: "Sales",
      team: "Enterprise · India",
      location: "Mumbai or Bangalore · Hybrid",
      compensation: "₹40–55L OTE (60/40 base/variable)",
      about:
        "Own the full sales cycle for our largest India accounts, primarily across BFSI and insurance. You'll work closely with Solutions Engineering to land multi-stakeholder, six-figure deals and expand them year-over-year.",
      responsibilities: [
        "Build and execute territory plans for named enterprise accounts",
        "Run discovery, demos, and commercial negotiations end-to-end",
        "Partner with SE / CS on complex proof-of-concepts and rollouts",
        "Maintain a clean, forecastable pipeline in Salesforce",
        "Represent the customer's voice back to product and leadership",
      ],
      must_haves: [
        "5+ years of enterprise SaaS sales, closing six-figure deals",
        "Track record hitting or exceeding quota two years running",
        "Experience selling into BFSI or regulated industries",
        "Comfort navigating multi-stakeholder buying committees",
      ],
      nice_to_haves: [
        "Existing relationships with India BFSI decision-makers",
        "Experience selling sales-enablement or CRM-adjacent software",
        "MBA or equivalent commercial training",
      ],
      benefits: [
        "Uncapped commission with accelerators",
        "President's Club for top quarterly performers",
        "Health insurance for family + dependents",
        "Travel budget for client entertainment",
      ],
      team_intro:
        "You'll join a team of 6 AEs across India, reporting to the VP of Enterprise Sales. Our average win cycle is 90–120 days and we pride ourselves on genuine, consultative selling.",
    },
  },
];

export function findTemplate(id: string | undefined): JdTemplate | null {
  if (!id) return null;
  return JD_TEMPLATES.find((t) => t.id === id) ?? null;
}
