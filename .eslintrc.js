module.exports = {
  root: true,
  env: {
    es2016: true,
    node: true
  },
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  rules: {
    "prettier/prettier": 1,
    "require-jsdoc": [0],
    "new-cap": [0],
    camelcase: [0],
    "no-unused-vars": [
      "error",
      {
        vars: "all",
        args: "after-used",
        ignoreRestSiblings: false
      }
    ]
  }
};
