import { resolve } from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import dts from 'vite-plugin-dts';

const exampleConfig = {
    root: resolve(__dirname, './test/examples'),

    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, './test/examples/index.html'),
                child: resolve(__dirname, './test/examples/child.html'),
                worker: resolve(__dirname, './test/examples/worker.html'),
                window1: resolve(__dirname, './test/examples/window.html'),
            },
        },
    },

    plugins: [
        VitePWA({
            devOptions: {
                enabled: true,
            },
        }),
    ],

    server: {
        port: 8000,
    },
};

const libConfig = {
    build: {
        outDir: 'lib',
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            formats: ['es', 'cjs', 'umd', 'iife'],
            name: 'RPCShooter',
            fileName: (format) => `index.${format}.js`,
        },
    },
    plugins: [
        dts({
            include: ['src'],
            beforeWriteFile(filePath, content) {
                return {
                    filePath: filePath.replace(/src(\/|\\)/, ''),
                    content,
                };
            },
        }),
    ],
};

export default defineConfig(process.env.BUILD_LIB ? libConfig : exampleConfig);
