module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@atlaskit/design-system/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: [
    'react-refresh',
    '@atlaskit/design-system'
  ],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // Atlassian Design System specific rules
    '@atlaskit/design-system/ensure-design-token-usage': 'error',
    '@atlaskit/design-system/no-deprecated-imports': 'error',
    '@atlaskit/design-system/no-deprecated-design-token-usage': 'error',
    '@atlaskit/design-system/consistent-css-prop-usage': 'warn',
  },
}