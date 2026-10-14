import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: [
            // react-pdf imports the modern pdf.js build, which needs APIs (e.g. Promise.withResolvers)
            // missing in older Telegram WebViews. The legacy build ships the polyfills.
            { find: /^pdfjs-dist$/, replacement: 'pdfjs-dist/legacy/build/pdf.mjs' },
        ],
    },
})
