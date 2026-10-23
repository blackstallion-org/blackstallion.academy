import Link from "next/link";
import { signOut } from "./actions";

export type AdminSection = "leads" | "mou" | "qr" | "documents" | "audit" | "media";

const SECTIONS: readonly { key: AdminSection; href: string; label: string }[] = [
  { key: "leads", href: "/admin", label: "Enquiries" },
  { key: "mou", href: "/admin/mou", label: "MOU requests" },
  { key: "qr", href: "/admin/qr", label: "QR captures" },
  { key: "documents", href: "/admin/documents", label: "Documents" },
  { key: "audit", href: "/admin/audit", label: "Audit log" },
  { key: "media", href: "/admin/media", label: "Website images" },
];

/**
 * Staff console navigation. The current section is marked with aria-current ("page" on the section's own page,
 * "true" on a page inside it, such as one enquiry) and with an underline, so the state never depends on colour alone.
 */
export function AdminNav({ name, current, inside = false }: { name: string; current: AdminSection; inside?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-b border-line pb-5">
      <nav aria-label="Staff console">
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          {SECTIONS.map((s) => {
            const active = s.key === current;
            return (
              <li key={s.key}>
                <Link
                  href={s.href}
                  aria-current={active ? (inside ? "true" : "page") : undefined}
                  className={active
                    ? "label inline-block py-2 text-gold underline decoration-gold decoration-1 underline-offset-[6px]"
                    : "label inline-block py-2 text-sand hover:text-gold"}
                >
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <form action={signOut} className="flex flex-wrap items-center gap-4">
        <span className="t-ui text-sm text-dust">{name}</span>
        <button className="label border border-line px-4 py-2 text-bone hover:border-gold hover:text-gold">Sign out</button>
      </form>
    </div>
  );
}
