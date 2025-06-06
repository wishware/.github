// @ts-check
import eslintConfig from '@k4i/eslint-config';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // prettier
  ...eslintConfig.base,
  ...eslintConfig.node,
  ...eslintConfig.typescript,
  ...eslintConfig.prettier,
  {
    name: "Override",
    rules: {
      "require-await": "off",
      'node/no-process-exit': 'off',
    },
  },
];
