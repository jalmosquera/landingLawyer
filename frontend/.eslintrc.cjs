module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ["eslint:recommended", "plugin:react-hooks/recommended"],
  plugins: ["react"],
  ignorePatterns: ["dist", "node_modules"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "react/jsx-uses-vars": "error",
    "react-hooks/exhaustive-deps": "off",
  },
  overrides: [
    {
      files: ["vite.config.js"],
      env: {
        node: true,
      },
    },
  ],
};
