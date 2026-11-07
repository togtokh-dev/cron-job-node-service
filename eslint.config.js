const js = require("@eslint/js");
const prettierRecommended = require("eslint-plugin-prettier/recommended");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "web/**", "public/**"]
  },

  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }
      ],
      // console биш src/util/logger ашиглана
      "no-console": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
      "no-var": "error"
    }
  },

  {
    files: ["src/util/secrets.ts", "test/**/*.ts"],
    rules: { "no-console": "off" }
  },

  prettierRecommended
);
