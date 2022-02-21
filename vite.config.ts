import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
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
});
