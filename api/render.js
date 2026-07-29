import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY
)

function esc(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default async function handler(req, res) {
  const { type, slug } = req.query
  const host = req.headers.host || 'myexora.com'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  let title = 'Exora — Buka Toko Online Gratis'
  let description = 'Platform toko online gratis untuk semua. Buka toko, jual produk, dan terima pesanan via WhatsApp.'
  let image = `${baseUrl}/og-default.png`
  let pageUrl = baseUrl

  try {
    if (type === 'blog') {
      if (slug) {
        const { data } = await supabase.from('blog_posts').select('*').eq('slug', slug).single()
        if (data) {
          title = `${data.title} — Blog Exora`
          description = data.excerpt || description
          if (data.cover_image) image = data.cover_image
          pageUrl = `${baseUrl}/blog/${slug}`
        }
      } else {
        title = 'Blog Seller & Panduan Bisnis — Exora'
        description = 'Tips, trik, dan strategi mengembangkan toko online kamu bersama Exora.'
        pageUrl = `${baseUrl}/blog`
      }
    } else if (type === 'guides') {
      if (slug) {
        const { data } = await supabase.from('guides').select('*').eq('slug', slug).single()
        if (data) {
          title = `${data.title} — Panduan Exora`
          description = data.summary || description
          pageUrl = `${baseUrl}/guides/${slug}`
        }
      } else {
        title = 'Panduan Lengkap — Exora'
        description = 'Panduan penggunaan Exora untuk membantu kamu jualan online lebih efektif.'
        pageUrl = `${baseUrl}/guides`
      }
    } else if (type === 'help') {
      if (slug) {
        const { data } = await supabase.from('help_articles').select('*').eq('slug', slug).single()
        if (data) {
          title = `${data.title} — Pusat Bantuan Exora`
          pageUrl = `${baseUrl}/help/${slug}`
        }
      } else {
        title = 'Pusat Bantuan — Exora'
        description = 'Cari jawaban dan bantuan seputar penggunaan platform Exora.'
        pageUrl = `${baseUrl}/help`
      }
    }

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${esc(pageUrl)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(image)}">
  <meta property="og:site_name" content="Exora">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(image)}">

  <script>window.location.replace("${pageUrl}");</script>
</head>
<body>
  <h1>${esc(title)}</h1>
  <p>${esc(description)}</p>
  <a href="${esc(pageUrl)}">Buka Halaman</a>
</body>
</html>`

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300')
    return res.status(200).send(html)

  } catch (err) {
    return res.redirect(302, pageUrl)
  }
}
