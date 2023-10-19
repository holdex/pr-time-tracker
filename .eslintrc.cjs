// config for sveltekit
module.exports = {
  plugins: [
    'prettier',
    'svelte3',
    '@typescript-eslint',
    '@typescript-eslint/eslint-plugin',
    'import'
  ],
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  overrides: [{ files: ['*.svelte'], processor: 'svelte3/svelte3' }],
  settings: {
    'svelte3/typescript': () => require('typescript'),
    'svelte3/ignore-warnings': (warning) => {
      return warning.code === 'unused-export-let';
    }
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  globals: {
    App: 'writable',
    globalThis: 'readonly'
  },
  env: {
    es6: true,
    browser: true,
    node: true
  },
  rules: {
    'comma-dangle': 'off',
    quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-empty-function': 'off',
    curly: ['error', 'multi-line'],
    'no-await-in-loop': 'error',
    'no-constant-condition': [
      'error',
      {
        checkLoops: true
      }
    ],
    'no-unsafe-finally': 'error',
    'dot-notation': [
      'error',
      {
        allowKeywords: true,
        allowPattern: ''
      }
    ],
    eqeqeq: ['error', 'always'],
    'guard-for-in': 'warn',
    'no-eq-null': 'error',
    'no-fallthrough': [
      'warn',
      {
        commentPattern: ''
      }
    ],
    'no-floating-decimal': 'warn',
    'no-implicit-coercion': [
      'off',
      {
        boolean: true,
        number: true,
        string: true
      }
    ],
    'no-labels': 'error',
    'no-magic-numbers': [
      'warn',
      {
        detectObjects: false,
        enforceConst: false,
        ignoreArrayIndexes: true,
        ignore: [0]
      }
    ],
    'no-implicit-globals': 'error',
    'no-param-reassign': 'error',
    'no-useless-catch': 'error',
    'no-useless-concat': 'warn',
    'no-useless-escape': 'warn',
    'no-useless-return': 'error',
    'no-shadow': [
      'warn',
      {
        builtinGlobals: false,
        hoist: 'functions'
      }
    ],
    'no-undef': [
      'error',
      {
        typeof: false
      }
    ],

    'no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '',
        args: 'after-used',
        ignoreRestSiblings: false,
        argsIgnorePattern: '',
        caughtErrors: 'none',
        caughtErrorsIgnorePattern: ''
      }
    ],
    'prefer-arrow-callback': [
      'warn',
      {
        allowNamedFunctions: false,
        allowUnboundThis: false
      }
    ],
    'prefer-const': [
      'warn',
      {
        ignoreReadBeforeAssign: false,
        destructuring: 'any'
      }
    ],
    'prefer-destructuring': [
      'error',
      {
        VariableDeclarator: {
          array: true,
          object: true
        },
        AssignmentExpression: {
          array: true,
          object: false
        }
      },
      {
        enforceForRenamedProperties: false
      }
    ],
    'import/no-duplicates': ['error', { considerQueryString: true }],
    'import/no-default-export': 'warn',
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'type',
          'internal',
          ['parent', 'sibling', 'index'],
          'object'
        ],
        'newlines-between': 'always',
        pathGroups: [
          {
            pattern: '+(!{$lib/**,$components/**,$routes/**,.,./**,../**})',
            group: 'external',
            position: 'before'
          },
          {
            pattern: '{$app/**,$env/**}',
            group: 'external',
            position: 'after'
          },
          {
            pattern: '{$lib/**/*(!(*types)),$components/**,$routes/**}',
            group: 'internal',
            position: 'before'
          }
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        distinctGroup: true
      }
    ]
  }
};
