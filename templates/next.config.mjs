/** @type {import('next').NextConfig} */

// Режим статического экспорта (для релизного артефакта): DEMOSITE_EXPORT=1 npm run build → out/
// В этом режиме headers() недоступны (их ставит nginx при раздаче), meta noindex остаётся в HTML.
const isExport = process.env.DEMOSITE_EXPORT === "1";

const base = {
  reactStrictMode: true,
  images: { remotePatterns: [], unoptimized: true },
};

const nextConfig = isExport
  ? { ...base, output: "export", trailingSlash: true }
  : {
      ...base,
      // Сайт-витрина не должен попадать в поиск. X-Robots-Tag дублирует meta noindex
      // на уровне ответа сервера (включая ассеты). При статической раздаче ставится в nginx.
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
