// ================================================
// /api/payment.js — MIDTRANS INTEGRATION
// Handles creation and verification of Midtrans Snap transactions
// untuk 2 alur: (1) upgrade plan seller, (2) checkout online buyer
// (Exora Pay / Exora Protect), plus manajemen kredensial platform.
// ================================================

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
)

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true'

const MIDTRANS_API_URL = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

const TIER_PRICES = {
  starter: 39000,
  pro: 59000,
  business: 199000,
}

// Fee layanan Exora Pay/Protect. Placeholder 2% flat — gampang
// diubah di satu tempat ini kalau kebijakan bisnisnya beda.
const FEE_RATE = 0.02

// Exora Protect: dana ditahan (escrow) 3 hari sebelum dianggap bisa
// di-payout ke seller. Exora Pay: langsung dianggap released.
const ESCROW_HOLD_DAYS = 3

function computeFee(subtotal, ongkir) {
  const base = Number(subtotal || 0) + Number(ongkir || 0)
  const feeAmount = Math.round(base * FEE_RATE)
  return { feeRate: FEE_RATE, feeAmount, total: base + feeAmount }
}

async function verifyToken(token) {
  if (!token) throw new Error('Token diperlukan')
  const { data, error } = await supabaseAdmin.from('tokens').select('*').eq('token', token).single()
  if (error || !data || new Date(data.expires_at) < new Date()) throw new Error('Token tidak valid')
  return data.user_id
}

async function verifyAdminToken(token) {
  const userId = await verifyToken(token)
  const { data: userRow } = await supabaseAdmin.from('users').select('is_admin').eq('id', userId).single()
  if (!userRow?.is_admin) throw new Error('Akses ditolak: Khusus Admin')
  return userId
}

function maskCredential(value) {
  if (!value) return ''
  const str = String(value)
  if (str.length <= 8) return '••••••••'
  return `${str.slice(0, 4)}${'•'.repeat(8)}${str.slice(-4)}`
}

function mapPayment(p) {
  return {
    paymentId: p.payment_id,
    targetPlan: p.target_plan,
    durationMonths: p.duration_months,
    amount: p.amount,
    status: p.status,
    planExpiry: p.plan_expiry || null,
    createdAt: p.created_at,
  }
}

// ================================================
// paymentApi.* — dipanggil lewat pola dispatcher { action, token, args }
// ================================================
const paymentApi = {
  getMyPayments: async (token) => {
    const userId = await verifyToken(token)
    const { data, error } = await supabaseAdmin
      .from('upgrade_payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { success: true, data: (data || []).map(mapPayment) }
  },

  // Publik — buyer belum tentu login. data: { tokoId, subtotal, ongkir }
  previewFee: async (_token, data = {}) => {
    const { subtotal, ongkir } = data
    const { feeRate, feeAmount, total } = computeFee(subtotal, ongkir)
    return { success: true, data: { subtotal: Number(subtotal || 0), ongkir: Number(ongkir || 0), feeRate, feeAmount, total } }
  },

  // Publik. data: { pesananId, tokoId, subtotal, ongkirAmount, kurirEstimasi, paymentMethod, buyerEmail, buyerName }
  createOrderPayment: async (_token, data = {}) => {
    const { pesananId, tokoId, subtotal, ongkirAmount, kurirEstimasi, paymentMethod, buyerEmail, buyerName } = data

    if (!pesananId) throw new Error('pesananId diperlukan')
    if (!['midtrans_instant', 'midtrans_escrow'].includes(paymentMethod)) {
      throw new Error('Metode pembayaran online tidak valid')
    }

    const { data: pesanan, error: pesananErr } = await supabaseAdmin
      .from('pesanan')
      .select('*')
      .eq('id', pesananId)
      .eq('toko_id', tokoId)
      .single()
    if (pesananErr || !pesanan) throw new Error('Pesanan tidak ditemukan')

    const { feeAmount, total: grossAmount } = computeFee(subtotal, ongkirAmount)

    const snapPayload = {
      transaction_details: {
        order_id: pesanan.order_id,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: buyerName || pesanan.buyer_nama || 'Pembeli',
        email: buyerEmail || undefined,
      },
      item_details: [
        {
          id: pesanan.produk_id || 'item',
          price: grossAmount,
          quantity: 1,
          name: pesanan.produk_nama || 'Pesanan Exora',
        }
      ],
    }

    let snapToken = null
    if (MIDTRANS_SERVER_KEY) {
      const authHeader = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64')
      const snapRes = await fetch(MIDTRANS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${authHeader}` },
        body: JSON.stringify(snapPayload),
      })
      if (snapRes.ok) {
        const snapData = await snapRes.json()
        snapToken = snapData.token
      } else {
        throw new Error('Gagal membuat transaksi Midtrans')
      }
    } else {
      throw new Error('Midtrans belum dikonfigurasi (MIDTRANS_SERVER_KEY kosong)')
    }

    await supabaseAdmin
      .from('pesanan')
      .update({
        ongkir_amount: Number(ongkirAmount || 0),
        kurir_estimasi: kurirEstimasi || null,
        payment_method_used: paymentMethod,
        total: grossAmount,
        snap_token: snapToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pesananId)

    return { success: true, data: { snapToken, amount: grossAmount, feeAmount, orderId: pesanan.order_id } }
  },
}

// ================================================
// credentialsApi.* — khusus admin, kelola API key Midtrans/Biteship
// dari Admin Panel (bukan cuma .env). Nilai asli TIDAK PERNAH
// dikirim balik ke frontend setelah tersimpan — cuma versi masked.
// ================================================
const credentialsApi = {
  list: async (token) => {
    await verifyAdminToken(token)
    const { data, error } = await supabaseAdmin
      .from('platform_credentials')
      .select('id, provider, key_name, is_active, updated_at')
      .order('provider', { ascending: true })
    if (error) throw new Error(error.message)

    // Ambil key_value terpisah cuma buat bikin versi masked-nya
    const { data: full } = await supabaseAdmin.from('platform_credentials').select('id, key_value')
    const valueMap = new Map((full || []).map(r => [r.id, r.key_value]))

    const result = (data || []).map(r => ({
      id: r.id,
      provider: r.provider,
      keyName: r.key_name,
      isActive: r.is_active,
      updatedAt: r.updated_at,
      maskedValue: maskCredential(valueMap.get(r.id)),
    }))
    return { success: true, data: result }
  },

  set: async (token, data = {}) => {
    const userId = await verifyAdminToken(token)
    const { provider, keyName, keyValue } = data
    if (!provider || !keyName || !keyValue) throw new Error('provider, keyName, dan keyValue wajib diisi')

    const { error } = await supabaseAdmin
      .from('platform_credentials')
      .upsert({
        provider,
        key_name: keyName,
        key_value: keyValue,
        is_active: true,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'provider,key_name' })
    if (error) throw new Error(error.message)

    return { success: true, message: 'Kredensial berhasil disimpan' }
  },

  deactivate: async (token, data = {}) => {
    const userId = await verifyAdminToken(token)
    const { provider, keyName } = data
    if (!provider || !keyName) throw new Error('provider dan keyName wajib diisi')

    const { error } = await supabaseAdmin
      .from('platform_credentials')
      .update({ is_active: false, updated_by: userId, updated_at: new Date().toISOString() })
      .eq('provider', provider)
      .eq('key_name', keyName)
    if (error) throw new Error(error.message)

    return { success: true, message: 'Kredensial dinonaktifkan' }
  },
}

const REGISTRY = { paymentApi, credentialsApi }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const action = req.query.action || req.body?.action

  try {
    if (action === 'create_upgrade') {
      const { token, targetPlan, durationMonths = 1 } = req.body || {}
      const userId = await verifyToken(token)

      const planKey = (targetPlan || '').toLowerCase()
      const pricePerMonth = TIER_PRICES[planKey]
      if (!pricePerMonth) {
        return res.status(400).json({ success: false, message: 'Plan tidak valid' })
      }

      const grossAmount = pricePerMonth * Number(durationMonths)
      const paymentId = `UPG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`

      const { data: user } = await supabaseAdmin.from('users').select('name, email').eq('id', userId).single()

      const snapPayload = {
        transaction_details: {
          order_id: paymentId,
          gross_amount: grossAmount,
        },
        customer_details: {
          first_name: user?.name || 'Seller',
          email: user?.email || 'seller@exora.id',
        },
        item_details: [
          {
            id: `plan-${planKey}`,
            price: pricePerMonth,
            quantity: Number(durationMonths),
            name: `Upgrade Plan Exora (${planKey.toUpperCase()})`,
          }
        ],
      }

      let snapToken = null
      let redirectUrl = null

      if (MIDTRANS_SERVER_KEY) {
        const authHeader = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64')
        const snapRes = await fetch(MIDTRANS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authHeader}`,
          },
          body: JSON.stringify(snapPayload),
        })

        if (snapRes.ok) {
          const snapData = await snapRes.json()
          snapToken = snapData.token
          redirectUrl = snapData.redirect_url
        }
      }

      // Save transaction record to DB
      await supabaseAdmin.from('upgrade_payments').insert({
        payment_id: paymentId,
        user_id: userId,
        target_plan: planKey,
        duration_months: Number(durationMonths),
        amount: grossAmount,
        status: 'pending',
        snap_token: snapToken,
        created_at: new Date().toISOString(),
      })

      return res.status(200).json({
        success: true,
        data: {
          paymentId,
          grossAmount,
          snapToken,
          redirectUrl,
        }
      })
    }

    if (action === 'check_status') {
      const paymentId = req.query.paymentId || req.body?.paymentId
      if (!paymentId) return res.status(400).json({ success: false, message: 'paymentId required' })

      const { data: record } = await supabaseAdmin
        .from('upgrade_payments')
        .select('*')
        .eq('payment_id', paymentId)
        .single()

      if (!record) return res.status(404).json({ success: false, message: 'Payment record not found' })

      return res.status(200).json({
        success: true,
        data: {
          status: record.status,
          planExpiry: record.plan_expiry || null,
        }
      })
    }

    // ================================================
    // WEBHOOK — dipanggil Midtrans otomatis tiap ada perubahan status
    // transaksi. Ada 2 kemungkinan sumber: upgrade plan (order_id
    // berawalan "UPG-") atau checkout pesanan buyer (order_id =
    // pesanan.order_id).
    // ================================================
    if (action === 'notification' || req.body?.order_id) {
      const body = req.body || {}
      const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body

      if (!order_id || !status_code || !gross_amount || !signature_key) {
        return res.status(400).json({ success: false, message: 'Payload notifikasi tidak lengkap' })
      }

      const expectedSignature = crypto
        .createHash('sha512')
        .update(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
        .digest('hex')

      if (expectedSignature !== signature_key) {
        return res.status(403).json({ success: false, message: 'Signature tidak valid' })
      }

      let newStatus = null
      if (transaction_status === 'capture' || transaction_status === 'settlement') {
        newStatus = (fraud_status && fraud_status !== 'accept') ? 'failed' : 'success'
      } else if (transaction_status === 'pending') {
        newStatus = 'pending'
      } else if (['deny', 'cancel', 'expire', 'failure'].includes(transaction_status)) {
        newStatus = 'failed'
      }

      if (order_id.startsWith('UPG-')) {
        // --- Alur upgrade plan seller ---
        const { data: record } = await supabaseAdmin
          .from('upgrade_payments')
          .select('*')
          .eq('payment_id', order_id)
          .single()
        if (!record) return res.status(404).json({ success: false, message: 'Payment record not found' })

        let planExpiryIso = record.plan_expiry || null
        if (newStatus === 'success' && record.status !== 'success') {
          const months = Number(record.duration_months || 1)
          const expiry = new Date()
          expiry.setMonth(expiry.getMonth() + months)
          planExpiryIso = expiry.toISOString()

          await supabaseAdmin
            .from('users')
            .update({ plan: record.target_plan, plan_expiry: planExpiryIso, updated_at: new Date().toISOString() })
            .eq('id', record.user_id)

          await supabaseAdmin
            .from('toko')
            .update({ plan: record.target_plan, updated_at: new Date().toISOString() })
            .eq('user_id', record.user_id)
        }

        await supabaseAdmin
          .from('upgrade_payments')
          .update({ status: newStatus, plan_expiry: planExpiryIso, updated_at: new Date().toISOString() })
          .eq('payment_id', order_id)

        return res.status(200).json({ success: true })
      }

      // --- Alur checkout pesanan buyer (Exora Pay / Exora Protect) ---
      const { data: pesanan } = await supabaseAdmin
        .from('pesanan')
        .select('*')
        .eq('order_id', order_id)
        .single()
      if (!pesanan) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' })

      const update = { updated_at: new Date().toISOString() }

      if (newStatus === 'success') {
        update.status = 'confirmed'
        if (pesanan.payment_method_used === 'midtrans_escrow') {
          update.payout_status = 'held'
          const release = new Date()
          release.setDate(release.getDate() + ESCROW_HOLD_DAYS)
          update.payout_release_at = release.toISOString()
        } else {
          update.payout_status = 'released'
          update.payout_release_at = new Date().toISOString()
        }
      } else if (newStatus === 'failed') {
        update.status = 'cancelled'
        update.payout_status = 'not_applicable'
      }
      // newStatus === 'pending' → biarkan status pesanan apa adanya

      await supabaseAdmin.from('pesanan').update(update).eq('order_id', order_id)

      return res.status(200).json({ success: true })
    }

    // ================================================
    // Kredensial — pola lama (flat action, dipertahankan buat
    // compat sama credentialsApi.get/save di paymentClient.ts)
    // ================================================
    if (action === 'get_credentials') {
      const { token } = req.body || {}
      const result = await credentialsApi.list(token)
      return res.status(200).json(result)
    }

    if (action === 'save_credentials') {
      const { token, data } = req.body || {}
      const result = await credentialsApi.set(token, data)
      return res.status(200).json(result)
    }

    // ================================================
    // Dispatcher generik: "paymentApi.xxx" / "credentialsApi.xxx"
    // dengan { token, args: [...] } — dipakai paymentClient.ts
    // ================================================
    if (action && action.includes('.')) {
      const [ns, methodName] = action.split('.')
      const apiObj = REGISTRY[ns]
      const fn = apiObj?.[methodName]
      if (typeof fn !== 'function') {
        return res.status(400).json({ success: false, message: 'Action tidak dikenal' })
      }
      const { token, args = [] } = req.body || {}
      const result = await fn(token, ...args)
      return res.status(200).json(result)
    }

    return res.status(400).json({ success: false, message: 'Action tidak dikenal' })

  } catch (err) {
    console.error('Payment API Error:', err)
    return res.status(500).json({ success: false, message: err.message || 'Payment processing error' })
  }
}
