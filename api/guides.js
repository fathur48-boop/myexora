import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const { slug } = req.query

  try {
    if (slug) {
      const { data, error } = await supabase
        .from('guides')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !data) return res.status(404).json({ success: false, message: 'Panduan tidak ditemukan' })
      return res.status(200).json({ success: true, data })
    } else {
      const { data, error } = await supabase
        .from('guides')
        .select('id, title, slug, summary, icon, published_at')
        .order('published_at', { ascending: false })

      if (error) throw error
      return res.status(200).json({ success: true, data: data || [] })
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
