// ================================================
// src/lib/api/biteshipClient.ts
// Thin client ke /api/biteship.js — pola sama seperti paymentClient.js.
// TIDAK menyimpan secret apapun, cuma proxy fetch. Publik — dipakai
// buyer yang belum tentu login, jadi tidak ada parameter token.
// ================================================

import { safeFetchJson } from '../utils'

export interface RateParams {
  originAreaId: string
  destinationAreaId: string
  weight: number
}

async function call(action: string, ...args: any[]) {
  const res = await fetch('/api/biteship', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, args }),
  })
  const data = await safeFetchJson(res)
  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Terjadi kesalahan')
  }
  return data
}

export const biteshipApi = {
  trackWaybill: (resi: string) => call('biteshipApi.trackWaybill', resi),
  getRates: ({ originAreaId, destinationAreaId, weight }: RateParams) =>
    call('biteshipApi.getRates', { originAreaId, destinationAreaId, weight }),
  searchArea: (query: string) => call('biteshipApi.searchArea', query),
}
