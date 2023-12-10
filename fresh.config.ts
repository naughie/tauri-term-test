import { defineConfig } from "$fresh/server.ts";

export default defineConfig({
  build: {
    outDir: "./dist",
  },
  server: {
    port: 8000,
  },
});
