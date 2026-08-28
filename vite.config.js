import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// Deployed on Vercel at the domain root. import.meta.env.BASE_URL carries
// this value into runtime code (see src/data/paths.js).
export default defineConfig({
  base: "/",
  plugins: [tailwindcss()],
  build: {
    target: "es2020",
    sourcemap: true,
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.js"],
    globals: false,
  },
});
