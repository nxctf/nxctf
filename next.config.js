// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   // App Router sudah default di Next.js 14, tidak perlu experimental.appDir
// };

// module.exports = nextConfig;

/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",

  reactStrictMode: true,

  // experimental: {
  //   optimizePackageImports: ["lucide-react", "date-fns", "lodash-es", "@mui/material", "@mui/icons-material"],
  // },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },

  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      { source: "/v2", destination: "/", permanent: false },
      { source: "/v2/login", destination: "/login", permanent: false },
      { source: "/v2/register", destination: "/register", permanent: false },
      { source: "/v2/forgot-password", destination: "/forgot-password", permanent: false },
      { source: "/v2/challenges", destination: "/challenges", permanent: false },
      { source: "/v2/scoreboard", destination: "/scoreboard", permanent: false },
      { source: "/v2/info", destination: "/info", permanent: false },
      { source: "/v2/rules", destination: "/rules", permanent: false },
      { source: "/v2/logs", destination: "/logs", permanent: false },
      { source: "/v2/maintenance", destination: "/maintenance", permanent: false },
      { source: "/v2/profile", destination: "/profile", permanent: false },
      { source: "/v2/profile/password", destination: "/profile/password", permanent: false },
      { source: "/v2/teams", destination: "/teams", permanent: false },
      { source: "/v2/teams/scoreboard", destination: "/teams/scoreboard", permanent: false },
      { source: "/v2/teams/:name", destination: "/teams/:name", permanent: false },
      { source: "/v2/user/:username", destination: "/user/:username", permanent: false },
      { source: "/v2/dashboard", destination: "/admin", permanent: false },
      { source: "/v2/dashboard/challenges", destination: "/admin/challenges", permanent: false },
      { source: "/v2/dashboard/events", destination: "/admin/event", permanent: false },
      { source: "/v2/dashboard/solvers", destination: "/admin/solvers", permanent: false },
      { source: "/v2/dashboard/admins", destination: "/admin/admins", permanent: false },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
