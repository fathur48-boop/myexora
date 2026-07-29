// /api/admin.js
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
)

async function verifyAdmin(token) {
  if (!token) throw new Error('Token diperlukan')
  const { data: t } = await supabaseAdmin.from('tokens').select('user_id, expires_at').eq('token', token).single()
  if (!t || new Date(t.expires_at) < new Date()) throw new Error('Token tidak valid')

  const { data: u } = await supabaseAdmin.from('users').select('is_admin').eq('id', t.user_id).single()
  if (!u?.is_admin) throw new Error('Akses ditolak: Khusus Admin')
  return t.user_id
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' })

  try {
    const { action, token, args = [] } = req.body || {}
    await verifyAdmin(token)

    if (action === 'getUsers') {
      const { data } = await supabaseAdmin.from('users').select('*').order('created_at', { ascending: false })
      return res.status(200).json({ success: true, data })
    }

    if (action === 'grantPlan') {
      const [userId, targetPlan, months] = args
      const expiry = new Date()
      expiry.setMonth(expiry.getMonth() + Number(months || 1))

      await supabaseAdmin.from('users').update({ plan: targetPlan, plan_expiry: expiry.toISOString() }).eq('id', userId)
      await supabaseAdmin.from('toko').update({ plan: targetPlan }).eq('user_id', userId)

      return res.status(200).json({ success: true, message: `Plan ${targetPlan} berhasil diaktifkan!` })
    }

    return res.status(400).json({ success: false, message: 'Action tidak dikenal' })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}
