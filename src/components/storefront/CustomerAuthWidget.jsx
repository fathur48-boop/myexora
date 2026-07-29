import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, LogOut, Package } from 'lucide-react'
import { useCustomerStore } from '../../lib/customerStore'
import { CONFIG } from '../../lib/config'
import MyOrdersModal from './MyOrdersModal'

export default function CustomerAuthWidget({ toko, c, accentColor }) {
  const { customer, isAuthenticated, loginWithGoogle, logout } = useCustomerStore()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showOrders, setShowOrders] = useState(false)
  const btnRef = useRef(null)
  const gsiRendered = useRef(false)

  useEffect(() => {
    if (!open || isAuthenticated || gsiRendered.current) return

    const scriptId = 'google-gsi'
    const init = () => {
      if (!window.google || !btnRef.current) return
      window.google.accounts.id.initialize({
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        callback: handleCredential,
        auto_select: false,
      })
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'filled_black',
        size: 'medium',
        text: 'continue_with',
        shape: 'pill',
        width: 240,
      })
      gsiRendered.current = true
    }

    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script')
      s.id = scriptId
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.defer = true
      s.onload = init
      document.head.appendChild(s)
    } else {
      init()
    }
  }, [open, isAuthenticated])

  async function handleCredential(response) {
    setLoading(true)
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]))
      await loginWithGoogle({
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        sub: payload.sub,
      }, toko?.id)
    } catch (err) {
      alert(err.message || 'Login gagal, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    setOpen(false)
  }

  const handleOpenOrders = () => {
    setShowOrders(true)
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        title={isAuthenticated ? customer?.name : 'Akun Saya'}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: isAuthenticated ? accentColor + '22' : c?.surface || 'rgba(255,255,255,0.03)',
          border: `2px solid ${isAuthenticated ? accentColor + '55' : c?.glassBorder || 'rgba(255,255,255,0.1)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: isAuthenticated ? accentColor : c?.textSecondary || '#94a3b8',
          flexShrink: 0, overflow: 'hidden',
        }}
      >
        {isAuthenticated && customer?.picture
          ? <img src={customer.picture} alt={customer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <User size={15} />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 190 }} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', top: '110%', right: 0, zIndex: 200,
                width: 260, background: c?.bgSecondary || '#12121a', border: `2px solid ${c?.borderCard || 'rgba(255,255,255,0.1)'}`,
                borderRadius: 'var(--radius-lg, 12px)', boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
                padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
              }}
            >
              {isAuthenticated ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {customer?.picture && (
                      <img src={customer.picture} alt={customer.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.82rem', color: c?.textPrimary || '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer?.name}</p>
                      <p style={{ fontSize: '0.72rem', color: c?.textTertiary || '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer?.email}</p>
                    </div>
                  </div>
                  <div style={{ height: 1, background: c?.glassBorder || 'rgba(255,255,255,0.1)' }} />
                  <button
                    onClick={handleOpenOrders}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                      background: 'transparent', border: 'none', borderRadius: 'var(--radius-md, 8px)',
                      color: c?.textPrimary || '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                      width: '100%', textAlign: 'left',
                    }}
                  >
                    <Package size={14} /> Riwayat Pesanan
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                      background: 'transparent', border: 'none', borderRadius: 'var(--radius-md, 8px)',
                      color: 'var(--danger, #ef4444)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                      width: '100%', textAlign: 'left',
                    }}
                  >
                    <LogOut size={14} /> Keluar
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.85rem', color: c?.textPrimary || '#fff', marginBottom: 4 }}>Masuk sebagai Pembeli</p>
                    <p style={{ fontSize: '0.75rem', color: c?.textTertiary || '#64748b', lineHeight: 1.4 }}>Simpan riwayat pesanan kamu di toko ini.</p>
                  </div>
                  {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                      <span className="spinner" style={{ width: 18, height: 18 }} />
                    </div>
                  ) : (
                    <div ref={btnRef} style={{ display: 'flex', justifyContent: 'center' }} />
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOrders && (
          <MyOrdersModal onClose={() => setShowOrders(false)} c={c} accentColor={accentColor} />
        )}
      </AnimatePresence>
    </div>
  )
}
