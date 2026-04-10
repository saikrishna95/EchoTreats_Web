import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import sitemap from "vite-plugin-sitemap";

const sitemapRoutes = [
  "/",
  "/auth",
  "/category/cakes",
  "/category/brownies",
  "/category/cupcakes",
  "/category/chocolates",
  "/category/cheesecakes",
  "/category/cookies",
  "/category/tubs",
  "/privacy-policy",
  "/terms-of-service",
  "/refund-policy",
];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    sitemap({
      hostname: "https://www.echotreats.com",
      dynamicRoutes: sitemapRoutes,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
