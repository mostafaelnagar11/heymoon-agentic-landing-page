/** @type {import('next').NextConfig} */
const nextConfig = {
  /* `npm run measure` builds into its own folder (NEXT_DIST_DIR=.next-measure), so a
     measurement never corrupts the running dev server's .next. */
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  /* Two landings and no front door of their own: `/` opens the brands
     side, which is the switch's first tab. */
  async redirects() {
    return [{ source: "/", destination: "/brands", permanent: false }];
  },
};

export default nextConfig;
