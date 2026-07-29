import { create } from 'zustand'
import { customerApi } from './api'

// ================================================
// CUSTOMER STORE (buyer per-toko)
// Terpisah total dari useAuthStore (seller). Key localStorage
// disisipi tokoId supaya sesi customer di toko A tidak kebawa
// saat buyer buka toko B di browser yang sama.
// ================================================

export interface CustomerState {
  customer: any
  token: string | null
  tokoId: string | null
  isLoading: boolean
  isAuthenticated: boolean
  init: (tokoId: string) => Promise<void>
  loginWithGoogle: (googleUser: any, tokoId: string) => Promise<any>
  logout: () => Promise<void>
  clear: () => void
}

const customerTokenKey = (tokoId: string) => `tokoku_customer_token_${tokoId}`
const customerUserKey = (tokoId: string) => `tokoku_customer_user_${tokoId}`

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customer: null,
  token: null,
  tokoId: null,
  isLoading: true,
  isAuthenticated: false,

  init: async (tokoId: string) => {
    if (!tokoId) { set({ isLoading: false }); return }
    const token = localStorage.getItem(customerTokenKey(tokoId))
    const userStr = localStorage.getItem(customerUserKey(tokoId))
    if (!token || !userStr) { set({ isLoading: false, tokoId }); return }
    try {
      const res = await customerApi.getMe(token)
      set({ customer: res.data, token, tokoId, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem(customerTokenKey(tokoId))
      localStorage.removeItem(customerUserKey(tokoId))
      set({ isLoading: false, tokoId })
    }
  },

  loginWithGoogle: async (googleUser: any, tokoId: string) => {
    const res = await customerApi.loginWithGoogle(googleUser, tokoId)
    const { customer, token } = res.data
    localStorage.setItem(customerTokenKey(tokoId), token)
    localStorage.setItem(customerUserKey(tokoId), JSON.stringify(customer))
    set({ customer, token, tokoId, isAuthenticated: true })
    return customer
  },

  logout: async () => {
    const { token, tokoId } = get()
    if (token) {
      try { await customerApi.logout(token) } catch {}
    }
    if (tokoId) {
      localStorage.removeItem(customerTokenKey(tokoId))
      localStorage.removeItem(customerUserKey(tokoId))
    }
    set({ customer: null, token: null, isAuthenticated: false })
  },

  clear: () => set({ customer: null, token: null, tokoId: null, isAuthenticated: false, isLoading: true }),
}))
