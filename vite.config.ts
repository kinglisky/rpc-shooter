import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const exampleConfig = {
    root: resolve(__dirname, './examples'),

    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, './examples/index.html'),
                child: resolve(__dirname, './examples/child.html'),
                worker: resolve(__dirname, './examples/worker.html'),
            },
        },
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
                    filePath: filePath.replace('src/', ''),
                    content,
                };
            },
        }),
    ],
};

export default defineConfig(process.env.BUILD_LIB ? libConfig : exampleConfig);
