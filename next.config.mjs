import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/merchant/tabs/shelves',
        destination: '/merchant/shelves',
        permanent: false,
      },
      {
        source: '/merchant/tabs/bags',
        destination: '/merchant/bags',
        permanent: false,
      },
      {
        source: '/merchant/tabs/inventory',
        destination: '/merchant/tabs/bags',
        permanent: false,
      },
    ];
  },
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.js",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
