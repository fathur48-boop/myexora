import { useAuthStore } from '../store'
import { safeFetchJson } from '../utils'

async function call(action: string, token: string | null, ...args: any[]) {
  const res = await fetch('/api/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token: token ?? null, args }),
  })
  const data = await safeFetchJson(res)
  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Terjadi kesalahan')
  }
  return data
}

export const paymentApi = {
  createUpgradePayment: async (arg1: any, arg2?: any) => {
    let token: string | null = null
    let data: any = null

    if (typeof arg1 === 'string') {
      token = arg1
      data = arg2
    } else {
      token = useAuthStore.getState().token
      data = arg1
    }

    const res = await fetch('/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_upgrade',
        token,
        targetPlan: data?.targetPlan,
        durationMonths: data?.durationMonths ?? 1,
      }),
    })
    return safeFetchJson(res)
  },

  checkPaymentStatus: async (arg1: string, arg2?: string) => {
    const paymentId = typeof arg2 === 'string' ? arg2 : arg1
    const res = await fetch(`/api/payment?action=check_status&paymentId=${encodeURIComponent(paymentId)}`)
    return safeFetchJson(res)
  },

  getMyPayments: async (token?: string) => {
    const activeToken = token || useAuthStore.getState().token
    return call('paymentApi.getMyPayments', activeToken)
  },

  // Publik — buyer belum tentu login, token dikirim null
  // data: { tokoId, subtotal, ongkir } -> { subtotal, ongkir, feeRate, feeAmount, total }
  previewFee: async (data: any) => call('paymentApi.previewFee', null, data),

  // data: { pesananId, tokoId, subtotal, ongkirAmount, kurirEstimasi, paymentMethod, buyerEmail, buyerName }
  createOrderPayment: async (data: any) => call('paymentApi.createOrderPayment', null, data),
}

export const credentialsApi = {
  get: async (token?: string) => {
    const activeToken = token || useAuthStore.getState().token
    const res = await fetch('/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_credentials', token: activeToken }),
    })
    return safeFetchJson(res)
  },

  save: async (data: any, token?: string) => {
    const activeToken = token || useAuthStore.getState().token
    const res = await fetch('/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_credentials', token: activeToken, data }),
    })
    return safeFetchJson(res)
  },

  list: async (token?: string) => {
    const activeToken = token || useAuthStore.getState().token
    return call('credentialsApi.list', activeToken)
  },

  set: async (tokenArg: any, dataArg?: any) => {
    const token = typeof tokenArg === 'string' ? tokenArg : useAuthStore.getState().token
    const data = typeof tokenArg === 'string' ? dataArg : tokenArg
    return call('credentialsApi.set', token, data)
  },

  deactivate: async (tokenArg: any, dataArg?: any) => {
    const token = typeof tokenArg === 'string' ? tokenArg : useAuthStore.getState().token
    const data = typeof tokenArg === 'string' ? dataArg : tokenArg
    return call('credentialsApi.deactivate', token, data)
  },
}
