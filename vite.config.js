import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "src",
  publicDir: resolve(__dirname, "public"),
  base: "./",
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === "development",
    target: "esnext",
    minify: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup.html"),
        background: resolve(__dirname, "src/background.js"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
  test: {
    root: resolve(__dirname),
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.js"],
  },
});
