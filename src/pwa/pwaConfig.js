const manifest = {
  name: "NorthStar - AI Wellness Coach",
  short_name: "NorthStar",
  description: "Personalized AI wellness coaching across 8 life pillars",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "portrait-primary",
  background_color: "#ffffff",
  theme_color: "#3B82F6",
  icons: [
    { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    {
      src: "/icons/icon-192x192-maskable.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable",
    },
  ],
  shortcuts: [
    {
      name: "Daily Checkin",
      short_name: "Checkin",
      description: "Quick daily wellness checkin",
      url: "/checkin?mode=quick",
      icons: [{ src: "/icons/checkin-192.png", sizes: "192x192" }],
    },
    {
      name: "View Dashboard",
      short_name: "Dashboard",
      description: "See your wellness overview",
      url: "/dashboard",
      icons: [{ src: "/icons/dashboard-192.png", sizes: "192x192" }],
    },
  ],
  share_target: {
    action: "/share",
    method: "POST",
    enctype: "multipart/form-data",
    params: {
      title: "title",
      text: "text",
      url: "url",
    },
  },
};

const runtimeCaching = [
  {
    urlPattern: /^https:\/\/[^/]+\/_next\/image/,
    handler: "CacheFirst",
    options: {
      cacheName: "northstar-images",
      expiration: {
        maxEntries: 60,
        maxAgeSeconds: 604800,
      },
    },
  },
  {
    urlPattern: /\/api\//,
    handler: "NetworkFirst",
    options: {
      cacheName: "northstar-api",
      networkTimeoutSeconds: 10,
      expiration: {
        maxEntries: 30,
        maxAgeSeconds: 300,
      },
    },
  },
];

const pwaConfig = {
  registerType: "autoUpdate",
  injectRegister: "auto",
  includeAssets: ["favicon.svg", "robots.txt", "apple-touch-icon.png"],
  manifest,
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
    cleanupOutdatedCaches: true,
    runtimeCaching,
  },
};

export default pwaConfig;
