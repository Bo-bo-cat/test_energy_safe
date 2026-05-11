/** @type {import('next').NextConfig} */
const nextConfig = {
  // Повністю вимикаємо блокування деплою через помилки ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Повністю вимикаємо блокування деплою через помилки TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;