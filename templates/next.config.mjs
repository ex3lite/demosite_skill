/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // демо-картинки лежат локально в /public/images, ремоты не нужны
    remotePatterns: [],
  },
};

export default nextConfig;
