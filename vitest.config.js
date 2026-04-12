import { defineConfig } from 'vitest/config';
import path from 'node:path';
import AutoImport from 'unplugin-auto-import/vite';
const coreSrc = path.resolve(import.meta.dirname, 'packages/core/src');
export default defineConfig({
    resolve: {
        alias: {
            '@sf/core': coreSrc,
        },
    },
    plugins: [
        AutoImport({
            dirs: [
                coreSrc,
                `${coreSrc}/traits`,
                `${coreSrc}/systems`,
            ],
            dirsScanOptions: { types: false },
            dts: path.resolve(import.meta.dirname, 'auto-imports.d.ts'),
        }),
    ],
    test: {
        include: ['packages/*/tests/**/*.test.ts'],
    },
});
//# sourceMappingURL=vitest.config.js.map