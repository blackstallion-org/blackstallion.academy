/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 16 defaults for new projects
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Routes named in the client PDFs → the blueprint's routes (docs/BLUEPRINT.md Part 5)
  async redirects() {
    return [
      { source: "/admissions", destination: "/parents", permanent: true },
      { source: "/hubs", destination: "/schools", permanent: true },
      { source: "/hub/:slug", destination: "/schools/:slug", permanent: true },
      { source: "/mou-request", destination: "/schools/mou", permanent: true },
      { source: "/command-ai", destination: "/command", permanent: true },
      { source: "/pay", destination: "/parents#fees", permanent: false },
    ];
  },
};

export default nextConfig;
