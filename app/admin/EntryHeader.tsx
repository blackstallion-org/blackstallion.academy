import Link from "next/link";
import { CrestMark } from "@/components/brand/CrestMark";
import { Wordmark } from "@/components/brand/Wordmark";

/** The console's entry screens (sign-in, password reset) have no public nav: just the crest, the name and a way back. */
export function EntryHeader() {
  return (
    <header className="mb-12 flex items-center justify-between gap-6 border-b border-line pb-4 pt-5 md:mb-16 md:pt-6">
      <Link href="/" className="flex items-center gap-3" aria-label="Black Stallion Academy, home">
        <CrestMark className="h-11 w-11" decorative />
        <Wordmark layout="inline" />
      </Link>
      <Link href="/" className="label text-sand transition-colors hover:text-bone">
        ← Back to the site
      </Link>
    </header>
  );
}
