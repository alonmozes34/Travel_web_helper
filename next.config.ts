import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // The privacy statement says a click to a provider carries the plan
        // and its destination and nothing else. Without this, the browser
        // default decides what the provider sees in `Referer`; with it, the
        // provider gets our origin only, never the page URL with the trip
        // length and data use in its query string.
        source: "/:path*",
        headers: [{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }],
      },
    ];
  },
};

export default nextConfig;
