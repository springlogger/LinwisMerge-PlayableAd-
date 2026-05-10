import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import tailwindcss from '@tailwindcss/vite';

/**
 * Build target: a single self-contained HTML file suitable for ad networks
 * (Mintegral, Vungle, IronSource, AppLovin all require single-file <= ~5MB).
 *
 * - vite-plugin-singlefile inlines all JS + CSS into index.html
 * - assetsInlineLimit forces small assets to be base64-inlined too
 *
 * `npm run dev`     — local dev server with HMR
 * `npm run build`   — produces dist/index.html (single file, ready to upload)
 * `npm run preview` — preview the built file locally
 */
export default defineConfig({
  plugins: [tailwindcss(), viteSingleFile()],
  build: {
    target: 'es2018',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 100_000_000,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
