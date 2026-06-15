import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        Audio: 'readonly',
        Image: 'readonly',
        XMLHttpRequest: 'readonly',
        fetch: 'readonly',
        Worker: 'readonly',
        crypto: 'readonly',
        self: 'readonly',
        console: 'readonly',
        CanvasRenderingContext2D: 'readonly',
        caches: 'readonly',
        ParticleSystem: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['extract.js', 'migrate.js'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**'],
  },
]
