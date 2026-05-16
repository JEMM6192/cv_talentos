import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

const base = process.env.PUBLIC_BASE_PATH || "/";

export default defineConfig({
  base,
  server: {
    host: "127.0.0.1",
    port: 5173
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
