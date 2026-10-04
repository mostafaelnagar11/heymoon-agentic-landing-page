/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Two landings and no front door of their own: `/` opens the brands
     side, which is the switch's first tab. */
  async redirects() {
    return [{ source: "/", destination: "/brands", permanent: false }];
  },
};

export default nextConfig;
