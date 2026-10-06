// Correctness-focused flat config. Intentionally NOT a style linter: this
// codebase predates any linting, uses `any` at the serverless-handler
// boundary by design, and a full stylistic ruleset would drown real signal.
// The rules enabled here catch genuine bugs (unreachable code, unused vars,
// constant conditions, self-compares, rules-of-hooks violations) without churn.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/*.d.ts",
      "artifacts/mockup-sandbox/**",
      "artifacts/api-server/**",
      "lib/**",
      "scripts/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      // Real hook bugs (conditional hooks, wrong call order) fail; the
      // dependency-array advisory stays a warning to avoid churn on
      // intentionally-empty deps that already carry disable comments.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // This codebase intentionally uses `any` at framework boundaries
      // (Vercel `req: any, res: any`, Supabase payloads). Not a correctness bug.
      "@typescript-eslint/no-explicit-any": "off",
      // Pre-existing unused-import debt: surface, don't block.
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      // Defensive `let x = null` before a guaranteed reassignment, and
      // @ts-ignore usage: hygiene, not correctness — keep as warnings.
      "no-useless-assignment": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
    },
  },
);
