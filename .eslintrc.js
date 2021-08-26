module.exports = {
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'semi': ['error', 'always'],
    'quotes': ['warn', 'single'],
    'comma-dangle': ['error', 'always-multiline'],
    'max-len': ['error', { 'code': 80 }],
  },
};
