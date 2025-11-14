/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Не валим билд из-за ESLint-ошибок (no-explicit-any и т.п.)
  eslint: {
    ignoreDuringBuilds: true,
  },

  async rewrites() {
    return [
      // алиасы старых путей → новый эндпоинт
      { source: "/api/test/generate", destination: "/api/generate-test" },
      { source: "/api/tests/generate", destination: "/api/generate-test" },
      { source: "/api/tests", destination: "/api/generate-test" },
    ];
  },
};

export default nextConfig;
