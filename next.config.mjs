/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  async rewrites() {
    return [
      // алиасы старых путей → новый эндпоинт
      { source: "/api/test/generate", destination: "/api/generate-test" },
      { source: "/api/tests/generate", destination: "/api/generate-test" },
      { source: "/api/tests", destination: "/api/generate-test" },
    ];
  },

  // при необходимости:
  // output: "standalone",
};

export default nextConfig;

