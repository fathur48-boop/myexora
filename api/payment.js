// ================================================
// /api/payment.js — MIDTRANS INTEGRATION
// Handles creation and verification of Midtrans Snap transactions
// ================================================

import { createClient } from '@supabase/supabase-js'

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

async function verifyToken(token) {
  if (!token) throw new Error('Token diperlukan')
  const { data, error } = await supabaseAdmin.from('tokens').select('*').eq('token', token).single()
  if (error || !data || new Date(data.expires_at) < new Date()) throw new Error('Token tidak valid')
  return data.user_id
}

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

    return res.status(400).json({ success: false, message: 'Action tidak dikenal' })

  } catch (err) {
    console.error('Payment API Error:', err)
    return res.status(500).json({ success: false, message: err.message || 'Payment processing error' })
  }
}
