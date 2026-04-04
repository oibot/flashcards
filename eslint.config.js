const { defineConfig } = require("eslint/config")
const expoConfig = require("eslint-config-expo/flat")
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended")
const react = require("eslint-plugin-react")
const simpleImportSort = require("eslint-plugin-simple-import-sort")

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  {
    ignores: ["assets/**/*", "dist/*", "src/locales/**/*"],
  },
  {
    plugins: {
      react,
      "simple-import-sort": simpleImportSort,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
])
