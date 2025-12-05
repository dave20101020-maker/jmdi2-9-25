import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const devPort = Number(process.env.PORT) || 5173;
const isCodespaces = Boolean(process.env.CODESPACES);
const codespaceDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
const codespaceName = process.env.CODESPACE_NAME;

const defaultCodespaceHost =
  "fictional-disco-x5797q7rr56wf9v7-5173.app.github.dev";
const codespacesHmrHost =
  isCodespaces && codespaceDomain && codespaceName
    ? `${codespaceName}-${devPort}.${codespaceDomain}`
    : null;
const isCodespacesTarget = Boolean(
  process.env.VITE_CODESPACE_HOST || codespacesHmrHost || process.env.CODESPACES
);
const resolvedHmrHost = isCodespacesTarget
  ? process.env.VITE_CODESPACE_HOST || codespacesHmrHost || defaultCodespaceHost
  : "localhost";
const resolvedHmrProtocol = isCodespacesTarget ? "wss" : "ws";
const resolvedHmrPort = isCodespacesTarget ? 443 : devPort;
const resolvedHmrClientPort = isCodespacesTarget ? 443 : devPort;

const hmrConfig = {
  protocol: resolvedHmrProtocol,
  clientPort: resolvedHmrClientPort,
};

if (!isCodespacesTarget) {
  hmrConfig.host = resolvedHmrHost;
  hmrConfig.port = devPort;
}

const serverConfig = {
  host: true,
  port: devPort,
  strictPort: true,
  proxy: {},
  hmr: hmrConfig,
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: "public",
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
  },
  server: serverConfig,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@api": path.resolve(__dirname, "./src/api"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@/lib/utils": path.resolve(__dirname, "./src/utils/index.js"),
    },
    extensions: [".mjs", ".js", ".jsx", ".ts", ".tsx", ".json"],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/tests/",
        "**/*.test.{js,jsx}",
        "**/*.spec.{js,jsx}",
      ],
      lines: 60,
      functions: 60,
      branches: 50,
      statements: 60,
    },
    include: ["src/**/*.{test,spec}.{js,jsx}"],
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],
  },
});
