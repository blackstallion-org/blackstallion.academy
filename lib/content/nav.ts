export type NavItem = { label: string; href: string };

/** Primary navigation. Routes are planned; most don't exist yet (see CLAUDE.md). */
export const primaryNav: NavItem[] = [
  { label: "The Legend", href: "/legend" },
  { label: "Curriculum", href: "/curriculum" },
  { label: "Campuses", href: "/hubs" },
  { label: "The Fleet", href: "/fleet" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "About", href: "/about" },
];

export const navCta: NavItem = { label: "Book a campus visit", href: "/contact" };

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "The Academy",
    items: [
      { label: "The Legend", href: "/legend" },
      { label: "Curriculum", href: "/curriculum" },
      { label: "The Fleet", href: "/fleet" },
      { label: "The Sovereign Mandate", href: "/about" },
    ],
  },
  {
    title: "For schools",
    items: [
      { label: "Campus configurator", href: "/hubs" },
      { label: "Request an MOU", href: "/mou-request" },
      { label: "Tournaments", href: "/tournaments" },
      { label: "Command AI", href: "/command-ai" },
    ],
  },
  {
    title: "For parents",
    items: [
      { label: "Verify a passport", href: "/verify" },
      { label: "Pay fees", href: "/pay" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export const legalNav: NavItem[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];
