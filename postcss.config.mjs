/**
 * Keep the Vite workspace isolated from the neighbouring Next.js recovery
 * project's PostCSS configuration. Tailwind is processed by
 * `@tailwindcss/vite` in `artifacts/bullenhaus/vite.config.ts`.
 */
export default {
  plugins: {},
};
