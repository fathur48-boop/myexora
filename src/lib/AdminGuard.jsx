import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from './store'

export function isAdminEmail(email) {
  if (!email) return false
  const cleanEmail = email.toLowerCase().trim()
  const defaultAdmins = ['fathur48@gmail.com', 'fathur@gmail.com', 'admin@exora.id', 'bahlil.99909@gmail.com', 'admin@tokoku.id']
  const envAdmins = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const adminList = [...defaultAdmins, ...envAdmins]
  return adminList.some(a => cleanEmail === a)
}

export default function AdminGuard({ children }) {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdminEmail(user?.email)) return <Navigate to="/dashboard" replace />
  return children
}
