// ================================================
// src/lib/api/groqClient.ts
// Client API for AI features using Groq / Gemini via /api/chat
// ================================================

import { safeFetchJson } from '../utils'

async function callChatEndpoint(payload: any) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await safeFetchJson(res)
  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Terjadi kesalahan pada AI')
  }
  return data
}

export const chatApi = {
  send: async ({ type = 'general', message = '', history = [], produk, toko, semuaProduk, mode, data, tokoNama, posts, produkList }: any) => {
    return callChatEndpoint({ type, message, history, produk, toko, semuaProduk, mode, data, tokoNama, posts, produkList })
  },
}

export const copywriterApi = {
  generate: async ({ nama, kategori, harga, deskripsi }: { nama: string; kategori?: string; harga?: number | string; deskripsi?: string }) => {
    return callChatEndpoint({
      type: 'produk',
      message: `Buatkan copywriting deskripsi jualan untuk produk "${nama}" kategori ${kategori || 'Umum'} harga Rp ${harga || 0}. Detail: ${deskripsi || 'Sangat berkualitas'}`,
      produk: { nama, kategori, harga, deskripsi }
    })
  }
}

export const showcaseChatApi = {
  send: async ({ messages, message, posts, produkList, toko }: { messages?: any[]; message?: string; posts?: any[]; produkList?: any[]; toko?: any }) => {
    const lastMsg = message || (messages && messages.length ? messages[messages.length - 1]?.text : '')
    return callChatEndpoint({ type: 'storefront', message: lastMsg, history: messages, posts, produkList, toko })
  },
}

export const storefrontAiApi = {
  send: async ({ message, history = [], toko, produkList }: { message: string; history?: any[]; toko?: any; produkList?: any[] }) => {
    return callChatEndpoint({ type: 'storefront', message, history, toko, produkList })
  }
}

// dipakai AnalyticsPage untuk fitur Aira (insight & chat konsultan)
export const airaApi = {
  send: async ({ message, history = [], data, tokoNama }: { message: string; history?: any[]; data?: any; tokoNama?: string }) => {
    return callChatEndpoint({ type: 'aira', message, history, data, tokoNama })
  },
}

