import { createReadStream, readdirSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const require = createRequire(import.meta.url)
const PDFJS_DIR = path.dirname(require.resolve('pdfjs-dist/package.json'))
// Data pdf.js loads on demand: fonts and character maps for PDFs that don't embed them, the JPEG 2000
// decoder and colour profiles. Served from our own origin so documents don't depend on a public CDN.
const PDFJS_ASSET_DIRS = ['standard_fonts', 'cmaps', 'wasm', 'iccs']

/** Serves pdf.js data files at /pdfjs/<dir>/<file> in dev and copies them into the build. */
function pdfjsAssets() {
    return {
        name: 'pdfjs-assets',
        configureServer(server) {
            server.middlewares.use('/pdfjs', (req, res, next) => {
                const relative = decodeURIComponent((req.url ?? '').split('?')[0]).replace(/^\/+/, '')
                const [dir] = relative.split('/')
                const file = path.join(PDFJS_DIR, relative)
                if (!PDFJS_ASSET_DIRS.includes(dir) || !file.startsWith(PDFJS_DIR) || !statSync(file, { throwIfNoEntry: false })?.isFile()) {
                    return next()
                }
                if (file.endsWith('.wasm')) res.setHeader('Content-Type', 'application/wasm')
                createReadStream(file).pipe(res)
            })
        },
        generateBundle() {
            for (const dir of PDFJS_ASSET_DIRS) {
                for (const name of readdirSync(path.join(PDFJS_DIR, dir))) {
                    if (name.startsWith('LICENSE')) continue
                    this.emitFile({
                        type: 'asset',
                        fileName: `pdfjs/${dir}/${name}`,
                        source: readFileSync(path.join(PDFJS_DIR, dir, name)),
                    })
                }
            }
        },
    }
}

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        pdfjsAssets(),
    ],
    resolve: {
        alias: [
            // react-pdf imports the modern pdf.js build, which needs APIs (e.g. Promise.withResolvers)
            // missing in older Telegram WebViews. The legacy build ships the polyfills.
            { find: /^pdfjs-dist$/, replacement: 'pdfjs-dist/legacy/build/pdf.mjs' },
        ],
    },
})
