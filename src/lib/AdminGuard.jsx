import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from './store'

// DEPRECATED: cek admin lewat daftar email hardcode + env var
// (VITE_ADMIN_EMAILS ke-bundle ke browser, jadi daftar admin bocor
// ke publik). Sumber kebenaran sekarang adalah users.is_admin di
// DB, yang sudah dikirim backend sebagai user.isAdmin lewat
// authApi.getMe/loginWithGoogle. Fungsi ini dipertahankan sementara
// supaya caller lain (Sidebar.jsx, LoginPage.jsx, App.tsx) yang
// belum dipindah gak langsung patah — akan dihapus setelah semua
// caller migrasi ke isAdminUser().
export function isAdminEmail(email) {
  if (!email) return false
  const cleanEmail = email.toLowerCase().trim()
  const defaultAdmins = ['fathur48@gmail.com']
  const envAdmins = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const adminList = [...defaultAdmins, ...envAdmins]
  return adminList.some(a => cleanEmail === a)
}

// Sumber kebenaran admin yang benar: sama persis dengan yang dipakai
// verifyAdminToken() di backend (api/toko.js) — kolom users.is_admin.
export function isAdminUser(user) {
  return !!user?.isAdmin
}

export default function AdminGuard({ children }) {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdminUser(user)) return <Navigate to="/dashboard" replace />
  return children
}
