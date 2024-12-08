module.exports = {
    env: {
      browser: true,
      es2021: true,
      jest: true, // Add this to enable Jest globals like 'test', 'expect', etc.
    },
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
    ],
    parserOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
    },
    plugins: ['react'],
    rules: {},
  };
  