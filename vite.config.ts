import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { copyFileSync } from "fs";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    // Custom plugin to copy 404.html and .nojekyll for GitHub Pages
    {
      name: 'copy-github-pages-files',
      writeBundle() {
        if (process.env.NODE_ENV === "production") {
          try {
            // Copy 404.html
            copyFileSync(
              path.resolve(import.meta.dirname, "client/public/404.html"),
              path.resolve(import.meta.dirname, "dist/public/404.html")
            );
            console.log('Copied 404.html for GitHub Pages');
            
            // Create .nojekyll
            copyFileSync(
              path.resolve(import.meta.dirname, ".nojekyll"),
              path.resolve(import.meta.dirname, "dist/public/.nojekyll")
            );
            console.log('Copied .nojekyll for GitHub Pages');
          } catch (error) {
            console.warn('Could not copy GitHub Pages files:', error);
          }
        }
      }
    },
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  // GitHub Pages configuration
  base: process.env.NODE_ENV === "production" ? "/StreamLink/" : "/",
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
