/**
 * The staff console's sections, in the order the sidebar lists them. The shell (AdminShell.tsx) draws them; this file holds only the
 * data, so a new section is one line here. The icon names are lucide-react components.
 */
export type AdminSection = "overview" | "leads" | "accounts" | "mou" | "qr" | "documents" | "audit" | "media";

export type SectionIcon = "overview" | "leads" | "accounts" | "mou" | "qr" | "documents" | "audit" | "media";

export const ADMIN_GROUPS: readonly { label: string; items: readonly { key: AdminSection; href: string; label: string; icon: SectionIcon; hint: string }[] }[] = [
  {
    label: "Workspace",
    items: [
      { key: "overview", href: "/admin", label: "Overview", icon: "overview", hint: "Live figures and activity" },
      { key: "leads", href: "/admin/enquiries", label: "Enquiries", icon: "leads", hint: "Every website enquiry" },
      { key: "accounts", href: "/admin/accounts", label: "Accounts", icon: "accounts", hint: "Members awaiting review" },
      { key: "mou", href: "/admin/mou", label: "MOU requests", icon: "mou", hint: "School board agreements" },
      { key: "qr", href: "/admin/qr", label: "QR captures", icon: "qr", hint: "Scans from flyers and hubs" },
    ],
  },
  {
    label: "Records",
    items: [
      { key: "documents", href: "/admin/documents", label: "Documents", icon: "documents", hint: "Generated MOU drafts" },
      { key: "audit", href: "/admin/audit", label: "Audit log", icon: "audit", hint: "Who changed what" },
      { key: "media", href: "/admin/media", label: "Website images", icon: "media", hint: "Stills, video and models" },
    ],
  },
];

export const ADMIN_SECTIONS = ADMIN_GROUPS.flatMap((g) => g.items);
export const sectionTitle = (key: AdminSection) => ADMIN_SECTIONS.find((s) => s.key === key)?.label ?? "Staff console";
