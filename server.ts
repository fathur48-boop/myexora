import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { createServer as createViteServer } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function startServer() {
  const app = express()
  const PORT = 3000

  // Body parsers
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // Helper to execute API handlers
  const handleApiFile = async (fileName: string, req: express.Request, res: express.Response) => {
    try {
      const mod = await import(`./api/${fileName}.js`)
      const handler = mod.default || mod
      await handler(req, res)
    } catch (err: any) {
      console.error(`Error executing /api/${fileName}:`, err)
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: err?.message || 'Internal server error' })
      }
    }
  }

  // Handle all API routes
  app.all('/api/:endpoint', async (req: express.Request, res: express.Response) => {
    const rawEndpoint = req.params.endpoint
    const endpoint = rawEndpoint.replace(/\.js$/, '')

    // Special routing logic
    if (endpoint === 'admin') {
      const action = req.body?.action
      if (typeof action === 'string' && action.includes('.')) {
        return handleApiFile('toko', req, res)
      }
      return handleApiFile('admin', req, res)
    }

    if (endpoint === 'updates') {
      return res.status(200).json({
        success: true,
        data: [
          {
            id: '1',
            title: 'Fitur Stream & Push Notification Realtime',
            body: 'Sekarang kamu bisa menerima notifikasi pesanan masuk dan DM pembeli secara instant dengan nada chime!',
            date: '2026-07-28',
          },
          {
            id: '2',
            title: 'CRM & Broadcast Konsumen Baru',
            body: 'Fitur CRM kini terintegrasi dengan segmentasi pelanggan dan WhatsApp broadcast.',
            date: '2026-07-20',
          },
        ],
      })
    }

    try {
      await handleApiFile(endpoint, req, res)
    } catch {
      if (!res.headersSent) {
        res.status(404).json({ success: false, message: `API endpoint /api/${endpoint} not found` })
      }
    }
  })

  // OpenGraph SEO Meta Tag Handler for WhatsApp & Social Crawlers
  const handleDynamicSeo = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Only intercept HTML page requests (GET without file extensions)
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|json|svg|woff2?)$/)) {
      return next()
    }

    try {
      const indexPath = process.env.NODE_ENV === 'production'
        ? path.join(process.cwd(), 'dist', 'index.html')
        : path.join(process.cwd(), 'index.html')

      if (!fs.existsSync(indexPath)) return next()

      let html = fs.readFileSync(indexPath, 'utf-8')
      const urlPath = req.path

      let title = 'Exora — Solusi Toko Online Instant Terdepan'
      let description = 'Buat toko online sendiri dalam 1 menit. Langsung jualan di WhatsApp, Instagram & TikTok dengan Exora.'
      let image = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'

      if (urlPath.startsWith('/toko/')) {
        const slug = urlPath.replace('/toko/', '').split('/')[0]
        const cleanSlug = slug.replace(/-/g, ' ').toUpperCase()
        title = `${cleanSlug} — Katalog Resmi Toko Exora`
        description = `Belanja produk resmi dan berkualitas dari ${cleanSlug} di Exora. Bebas komisi & checkout via WhatsApp!`
      } else if (urlPath.startsWith('/showcase')) {
        title = 'Exora Showcase — Katalog Toko Online Kreatif Indonesia'
        description = 'Temukan toko online dan produk lokal terbaik dari UMKM Indonesia di Exora Showcase.'
      } else if (urlPath.startsWith('/blog')) {
        title = 'Exora Blog — Panduan & Strategy Bisnis E-Commerce'
        description = 'Artikel, tips jualan online, strategi WhatsApp marketing, dan update fitur Exora.'
      }

      const ogTags = `
        <title>${title}</title>
        <meta name="description" content="${description}" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:url" content="https://myexora.com${urlPath}" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${description}" />
        <meta name="twitter:image" content="${image}" />
      `
      html = html.replace('</head>', `${ogTags}\n</head>`)
      res.setHeader('Content-Type', 'text/html')
      return res.send(html)
    } catch {
      return next()
    }
  }

  // Vite development middleware vs Static Production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })

    app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const isHtmlRequest = Boolean(req.headers.accept && req.headers.accept.includes('text/html'))
      if (
        req.method !== 'GET' ||
        req.path.startsWith('/api') ||
        req.path.startsWith('/src') ||
        req.path.startsWith('/node_modules') ||
        req.path.startsWith('/@') ||
        !isHtmlRequest
      ) {
        return next()
      }

      try {
        const indexPath = path.join(process.cwd(), 'index.html')
        if (!fs.existsSync(indexPath)) return next()

        let html = fs.readFileSync(indexPath, 'utf-8')
        const urlPath = req.path

        let title = 'Exora — Solusi Toko Online Instant Terdepan'
        let description = 'Buat toko online sendiri dalam 1 menit. Langsung jualan di WhatsApp, Instagram & TikTok dengan Exora.'
        let image = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'

        if (urlPath.startsWith('/toko/')) {
          const slug = urlPath.replace('/toko/', '').split('/')[0]
          const cleanSlug = slug.replace(/-/g, ' ').toUpperCase()
          title = `${cleanSlug} — Katalog Resmi Toko Exora`
          description = `Belanja produk resmi dan berkualitas dari ${cleanSlug} di Exora. Bebas komisi & checkout via WhatsApp!`
        } else if (urlPath.startsWith('/showcase')) {
          title = 'Exora Showcase — Katalog Toko Online Kreatif Indonesia'
          description = 'Temukan toko online dan produk lokal terbaik dari UMKM Indonesia di Exora Showcase.'
        } else if (urlPath.startsWith('/blog')) {
          title = 'Exora Blog — Panduan & Strategy Bisnis E-Commerce'
          description = 'Artikel, tips jualan online, strategi WhatsApp marketing, dan update fitur Exora.'
        }

        const ogTags = `
          <title>${title}</title>
          <meta name="description" content="${description}" />
          <meta property="og:title" content="${title}" />
          <meta property="og:description" content="${description}" />
          <meta property="og:image" content="${image}" />
          <meta property="og:url" content="https://myexora.com${urlPath}" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${title}" />
          <meta name="twitter:description" content="${description}" />
          <meta name="twitter:image" content="${image}" />
        `
        html = html.replace('</head>', `${ogTags}\n</head>`)
        html = await vite.transformIndexHtml(req.originalUrl || req.url, html)
        res.setHeader('Content-Type', 'text/html')
        return res.send(html)
      } catch (e) {
        return next(e)
      }
    })

    app.use(vite.middlewares)
  } else {
    const handleDynamicSeo = (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|json|svg|woff2?)$/)) {
        return next()
      }

      try {
        const indexPath = path.join(process.cwd(), 'dist', 'index.html')
        if (!fs.existsSync(indexPath)) return next()

        let html = fs.readFileSync(indexPath, 'utf-8')
        const urlPath = req.path

        let title = 'Exora — Solusi Toko Online Instant Terdepan'
        let description = 'Buat toko online sendiri dalam 1 menit. Langsung jualan di WhatsApp, Instagram & TikTok dengan Exora.'
        let image = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'

        if (urlPath.startsWith('/toko/')) {
          const slug = urlPath.replace('/toko/', '').split('/')[0]
          const cleanSlug = slug.replace(/-/g, ' ').toUpperCase()
          title = `${cleanSlug} — Katalog Resmi Toko Exora`
          description = `Belanja produk resmi dan berkualitas dari ${cleanSlug} di Exora. Bebas komisi & checkout via WhatsApp!`
        } else if (urlPath.startsWith('/showcase')) {
          title = 'Exora Showcase — Katalog Toko Online Kreatif Indonesia'
          description = 'Temukan toko online dan produk lokal terbaik dari UMKM Indonesia di Exora Showcase.'
        } else if (urlPath.startsWith('/blog')) {
          title = 'Exora Blog — Panduan & Strategy Bisnis E-Commerce'
          description = 'Artikel, tips jualan online, strategi WhatsApp marketing, dan update fitur Exora.'
        }

        const ogTags = `
          <title>${title}</title>
          <meta name="description" content="${description}" />
          <meta property="og:title" content="${title}" />
          <meta property="og:description" content="${description}" />
          <meta property="og:image" content="${image}" />
          <meta property="og:url" content="https://myexora.com${urlPath}" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${title}" />
          <meta name="twitter:description" content="${description}" />
          <meta name="twitter:image" content="${image}" />
        `
        html = html.replace('</head>', `${ogTags}\n</head>`)
        res.setHeader('Content-Type', 'text/html')
        return res.send(html)
      } catch {
        return next()
      }
    }

    const distPath = path.join(process.cwd(), 'dist')
    app.use(express.static(distPath))
    app.get('*', handleDynamicSeo, (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Exora Tokoku server listening on http://0.0.0.0:${PORT}`)
  })
}

startServer()
