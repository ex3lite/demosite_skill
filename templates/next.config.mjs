/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // демо-картинки лежат локально в /public/images, ремоты не нужны
    remotePatterns: [],
  },
  // Сайт-витрина не должен попадать в поиск. Заголовок X-Robots-Tag дублирует
  // meta noindex и закрывает индексацию на уровне ответа сервера (включая ассеты).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet, noimageindex" },
        ],
      },
    ];
  },
};

export default nextConfig;
