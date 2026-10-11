import Link from "next/link";
import { reels } from "@/lib/content/site";

export default function NotFound() {
  return (
    <section className="gutter flex min-h-[90svh] flex-col justify-center pt-24">
      <p className="label text-dust">Reel missing</p>
      <h1 className="mt-4 text-display-1">
        <span className="t-inscribe block text-[0.5em]">This frame</span>
        <span className="t-voice block text-gold">was cut.</span>
      </h1>
      <p className="t-story mt-6 max-w-xl text-sand">The page you were looking for isn&rsquo;t in the film. Pick up the story from any reel.</p>
      <ul className="mt-10 grid gap-x-8 gap-y-2 sm:grid-cols-3">
        {reels.map((r) => (
          <li key={r.href}>
            <Link href={r.href} className="t-ui flex gap-3 py-1 text-sand hover:text-gold">
              <span className="font-mono text-xs text-dust">{String(r.n).padStart(2, "0")}</span>
              {r.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
