import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    ".vercel/**",
    "next-env.d.ts",
    "bsah-platform/**",
    "scripts/**",
    "scratch/**", // Local capture experiments are not application source.
    "output/**", // Generated verification artifacts and browser traces.
    "public/draco/**", // Third-party generated decoder, distributed unchanged.
    "public/anatomy/vendor/**", // three.js, GSAP and transpiled copies of components/3d (scripts/build-anatomy-vendor.mjs); not edited by hand.
  ]),
  // Vendored, pre-compiled third-party component (Framer export by Matthias Ölschlegel), kept byte-for-byte so the
  // effect is unchanged. Its "latest ref" render pattern trips the React Compiler rules; it is isolated here rather than
  // rewritten. Licence for commercial use must be confirmed before launch (see docs/IMPLEMENTATION_PROGRESS.md, B04).
  {
    files: ["components/motion/CrumpledPaperReveal.tsx"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "prefer-const": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
]);

export default eslintConfig;
