import coreWebVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

const config = [
  ...coreWebVitals,
  prettier,
  {
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["pages/api/**/*.{ts,tsx,js,jsx}", "scripts/**/*.{ts,tsx,js,jsx}", "tests/**/*.{ts,tsx,js,jsx}", "node_modules_stubs/**/*.{ts,tsx,js,jsx}"] ,
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/rules-of-hooks": "off",
    },
  },
  {
    files: ["components/**/*.{ts,tsx,js,jsx}", "pages/**/*.{ts,tsx,js,jsx}", "lib/**/*.{ts,tsx}"] ,
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "off",
    },
  },
];

export default config;
