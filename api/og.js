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

function parseFotos(foto) {
  if (!foto) return []
  try {
    const parsed = JSON.parse(foto)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return String(foto).split(',').map(s => s.trim()).filter(Boolean)
  }
}

export default async function handler(req, res) {
  const { slug, produk: produkId } = req.query
  const host = req.headers.host || 'myexora.com'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  if (!slug) return res.redirect(302, baseUrl)

  try {
    const { data: toko } = await supabase
      .from('toko')
      .select('id, nama, slug, deskripsi, logo, wa, plan')
      .eq('slug', slug)
      .single()

    if (!toko) return res.redirect(302, baseUrl)

    let title = `${toko.nama} — Toko Online`
    let description = toko.deskripsi || `Beli produk langsung dari ${toko.nama} via WhatsApp. Cepat, aman, dan tanpa ribet.`
    let image = toko.logo || `${baseUrl}/og-default.png`
    let pageUrl = `${baseUrl}/${toko.slug}`

    if (produkId) {
      const { data: produk } = await supabase
        .from('produk')
        .select('id, nama, harga, deskripsi, foto')
        .eq('id', produkId)
        .eq('toko_id', toko.id)
        .single()

      if (produk) {
        title = `${produk.nama} — ${toko.nama}`
        const hargaFmt = `Rp ${Number(produk.harga).toLocaleString('id-ID')}`
        description = `${hargaFmt} · ${produk.deskripsi || `Beli ${produk.nama} di ${toko.nama} via WhatsApp.`}`
        const fotos = parseFotos(produk.foto)
        if (fotos[0]) image = fotos[0]
        pageUrl = `${baseUrl}/${toko.slug}?produk=${produk.id}`
      }
    }

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${esc(pageUrl)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Exora">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(image)}">

  <!-- Redirect JS untuk browser nyata yang nyasar ke handler ini -->
  <script>window.location.replace("${pageUrl}");</script>
</head>
<body>
  <h1>${esc(title)}</h1>
  <p>${esc(description)}</p>
  <a href="${esc(pageUrl)}">Buka Halaman Toko</a>
</body>
</html>`

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300')
    return res.status(200).send(html)

  } catch (err) {
    console.error('OG Handler error:', err)
    return res.redirect(302, `${baseUrl}/${slug}`)
  }
}
