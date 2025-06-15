// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylisticJs from '@stylistic/eslint-plugin';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    ignores: ['**/dist/*'],
  },
  {
    plugins: {
      '@stylistic': stylisticJs,
    },
    rules: {
      ...stylisticJs.configs['recommended-flat'].rules,
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/brace-style': ['error', '1tbs'],
    },
  },
  {
    rules: {
      '@typescript-eslint/typedef': [
        'warn',
        {
          variableDeclaration: true,
        },
      ],
    },
  },
);
