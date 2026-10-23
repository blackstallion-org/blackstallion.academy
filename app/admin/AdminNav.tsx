import Link from "next/link";
import { signOut } from "./actions";

export function AdminNav({ name, current }: { name: string; current: "leads" | "documents" | "media" }) {
  const item = (href: string, label: string, key: string) => (
    <Link href={href} aria-current={current === key ? "page" : undefined} className={current === key ? "label text-gold" : "label text-sand hover:text-gold"}>{label}</Link>
  );
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
      <nav aria-label="Staff console" className="flex flex-wrap gap-6">
        {item("/admin", "Enquiries", "leads")}
        {item("/admin/documents", "Documents", "documents")}
        {item("/admin/media", "Website images", "media")}
      </nav>
      <form action={signOut} className="flex items-center gap-4">
        <span className="t-ui text-sm text-dust">{name}</span>
        <button className="label border border-line px-4 py-2 text-bone hover:border-gold hover:text-gold">Sign out</button>
      </form>
    </div>
  );
}
