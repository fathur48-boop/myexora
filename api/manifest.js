import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY
)

export default async function handler(req, res) {
  const slug = req.query.slug

  if (!slug) {
    return res.status(200).json({
      name: "Exora",
      short_name: "Exora",
      start_url: "/",
      display: "standalone",
      background_color: "#0b0b10",
      theme_color: "#5b8af5",
      icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }]
    })
  }

  try {
    const { data: toko } = await supabase
      .from('toko')
      .select('nama, deskripsi, logo, tema')
      .eq('slug', slug)
      .single()

    const nama = toko?.nama || "Toko Exora"
    const desc = toko?.deskripsi || "Toko Online"

    return res.status(200).json({
      name: nama,
      short_name: nama.length > 12 ? nama.slice(0, 12) : nama,
      description: desc,
      start_url: `/${slug}`,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#5b8af5",
      icons: toko?.logo ? [
        { src: toko.logo, sizes: "192x192", type: "image/png" },
        { src: toko.logo, sizes: "512x512", type: "image/png" }
      ] : [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }
      ]
    })
  } catch {
    return res.status(200).json({ name: "Toko Exora", start_url: `/${slug}`, display: "standalone" })
  }
}
