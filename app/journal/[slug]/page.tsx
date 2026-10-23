import { ScrollRevealText } from "@/components/motion/ScrollRevealText";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FilmImage } from "@/components/film/FilmImage";
import { Arrow, Horseshoe } from "@/components/film/Marks";
import { postBySlug, posts } from "@/lib/content/journal";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) return {};
  return { title: post.title.join(" "), description: post.dek, alternates: { canonical: `/journal/${slug}` } };
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default async function PostPage({ params }: PageProps<"/journal/[slug]">) {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) notFound();
  const i = posts.indexOf(post);
  const next = posts[(i + 1) % posts.length];
  const firstP = post.body.findIndex((b) => b.t === "p");

  return (
    <article>
      <header className="editorial-scene"><div className="tone-dark editorial-visual relative min-h-[88svh] overflow-hidden">
        <FilmImage name={post.cover} priority />
        <div aria-hidden className="absolute inset-0 shade-b" />
        <div className="gutter relative flex min-h-[88svh] flex-col justify-end pb-14">
          <Link href="/journal" className="label text-sand hover:text-gold">
            ← The Chronicle
          </Link>

          <h1 className="mt-4 max-w-5xl text-display-1">
            <span className="t-inscribe block text-[0.5em] text-bone">{post.title[0]}</span>
            <span className="t-voice block text-gold">{post.title[1]}</span>
          </h1>

        </div>
      </div><div className="tone-light editorial-details gutter">          <p className="label mt-8 text-brass">
            {post.category} · {post.minutes} min read · {fmt(post.date)}
          </p>          <ScrollRevealText className="t-story mt-6 max-w-2xl text-sand">{post.dek}</ScrollRevealText></div></header>

      <div className="gutter py-20">
        <div className="mx-auto max-w-[66ch]">
          {post.body.map((b, k) => {
            if (b.t === "h")
              return (
                <h2 key={k} className="t-voice mb-4 mt-14 text-display-3 text-bone">
                  {b.text}
                </h2>
              );
            if (b.t === "quote")
              return (
                <blockquote key={k} className="my-14 border-y border-line py-8 text-center">
                  <Horseshoe className="mx-auto mb-4 text-brass" />
                  <p className="t-voice text-[clamp(1.5rem,3vw,2.4rem)] leading-tight text-gold">{b.text}</p>
                </blockquote>
              );
            if (b.t === "note")
              return (
                <p key={k} className="t-ui mt-12 border-l border-line pl-4 text-sm text-dust">
                  {b.text}
                </p>
              );
            const drop = k === firstP;
            return (
              <p
                key={k}
                className={
                  drop
                    ? "mb-6 text-[1.18rem] leading-[1.75] text-bone first-letter:float-left first-letter:mr-3 first-letter:mt-2 first-letter:[font-family:var(--font-kalnia)] first-letter:text-[4.6em] first-letter:font-semibold first-letter:leading-[0.8] first-letter:text-gold"
                    : "mb-6 text-[1.18rem] leading-[1.75] text-sand"
                }
              >
                {b.text}
              </p>
            );
          })}
        </div>
      </div>

      <Link href={`/journal/${next.slug}`} className="tone-dark group relative block h-[60svh] overflow-hidden border-t border-line bg-night">
        <FilmImage name={next.cover} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-transparent" />
        <div className="gutter relative flex h-full flex-col justify-end pb-12">
          <p className="label text-brass">Next story</p>
          <p className="mt-3 text-display-2">
            <span className="t-inscribe block text-[0.5em]">{next.title[0]}</span>
            <span className="t-voice block text-gold">{next.title[1]}</span>
          </p>
          <span className="label mt-6 inline-flex items-center gap-3 text-sand">
            Read <Arrow className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </article>
  );
}
