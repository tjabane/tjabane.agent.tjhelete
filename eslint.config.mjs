import babelParser from "@babel/eslint-parser";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "coverage/**", "package-lock.json"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        babelOptions: {
          plugins: ["@babel/plugin-syntax-typescript"],
        },
        requireConfigFile: false,
      },
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
  prettier,
];
