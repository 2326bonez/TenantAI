import { defineConfig } from "vite";

export default defineConfig({
  // public/index.html is the legacy source document; the root index.html is
  // the actual Vite entry point. Static assets are not currently required.
  publicDir: false,
});
