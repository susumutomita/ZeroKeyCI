import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    include: ['**/__tests__/**/*.(ts|tsx|js)', '**/*.(test|spec).(ts|tsx|js)'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/test/contracts/**',
      'src/lit-actions/**/__tests__/**/*', // Exclude Lit Action tests - require integration with real Lit network
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}', 'mcp-server/src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.tsx',
        'src/**/__tests__/**/*',
        'src/types/**/*.ts', // Exclude type definition files
        'src/services/LitPKPSigner.ts', // Exclude - requires integration tests with real Lit network
        'src/lit-actions/**/*.{ts,js}', // Exclude Lit Action code - requires integration tests with real Lit network
        'src/app/**/route.ts', // Exclude API routes - tested via integration tests
        'src/app/**/page.tsx', // Exclude pages - tested via E2E tests
        'mcp-server/src/**/__tests__/**/*',
        'mcp-server/src/test-search.ts',
      ],
      thresholds: {
        branches: 98,
        functions: 98,
        lines: 99.9,
        statements: 99.9,
      },
    },
    mockReset: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
