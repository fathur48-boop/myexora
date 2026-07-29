// =============================================
// src/components/storefront/MyOrdersModal.jsx
//
// IMPROVED: Riwayat pesanan buyer dengan UI/UX yang lebih polished
// - Better spacing, visual hierarchy & typography
// - Enhanced card design dengan shadow & elevation
// - Improved empty state dengan ilustrasi
// - Skeleton loader yang lebih realistic
// - Better status indicators
// =============================================
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, Truck, Clock, ShoppingBag, ChevronRight } from 'lucide-react'
import { customerApi } from '../../lib/api/index.js'
import { useCustomerStore } from '../../lib/customerStore.js'
import { formatRupiah, formatDateTime, PESANAN_STATUS } from '../../lib/utils.js'

export default function MyOrdersModal({ onClose, c, accentColor }) {
  const { token } = useCustomerStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    customerApi.getMyOrders(token)
      .then(res => { if (!cancelled) setOrders(res.data || []) })
      .catch(err => { if (!cancelled) setError(err.message || 'Gagal memuat riwayat pesanan') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [token])

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 9999, 
        background: 'rgba(0,0,0,0.75)', 
        backdropFilter: 'blur(8px)',
        display: 'flex', 
        alignItems: isMobile ? 'flex-end' : 'center', 
        justifyContent: 'center'
      }}
    >
      <motion.div
        initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
        animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
        exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ 
          width: '100%', 
          maxWidth: isMobile ? '100%' : 520, 
          background: c.bgSecondary, 
          border: `3px solid ${c.borderCard}`, 
          borderRadius: isMobile ? 'var(--radius-2xl) var(--radius-2xl) 0 0' : 'var(--radius-2xl)', 
          maxHeight: isMobile ? '90vh' : '85vh', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isMobile ? '0 -8px 32px rgba(0,0,0,0.4)' : '0 20px 60px rgba(0,0,0,0.5)'
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: `3px solid ${c.borderCard}`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: c.bgSecondary,
          zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 'var(--radius-xl)', 
              background: `${accentColor}15`, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}>
              <Package size={20} color={accentColor} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: c.textPrimary, margin: 0 }}>
                Riwayat Pesanan
              </h2>
              <p style={{ fontSize: '0.75rem', color: c.textTertiary, margin: 0 }}>
                {orders.length} {orders.length === 1 ? 'pesanan' : 'pesanan'}
              </p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }} 
            whileTap={{ scale: 0.9 }} 
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-lg)',
              background: c.surface,
              border: `2px solid ${c.borderCard}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} color={c.textSecondary} />
          </motion.button>
        </div>

        {/* Content */}
        <div style={{ 
          padding: isMobile ? '16px' : '24px', 
          overflow: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {/* Loading State */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array(3).fill(0).map((_, i) => (
                <div 
                  key={i} 
                  style={{ 
                    padding: '16px',
                    background: c.surface, 
                    border: `2px solid ${c.borderCard}`,
                    borderRadius: 'var(--radius-xl)',
                    animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`
                  }}
                >
                  <div style={{ height: 16, width: '60%', background: c.borderCard, borderRadius: 'var(--radius-md)', marginBottom: 10 }} />
                  <div style={{ height: 12, width: '40%', background: c.borderCard, borderRadius: 'var(--radius-md)', marginBottom: 8 }} />
                  <div style={{ height: 14, width: '30%', background: c.borderCard, borderRadius: 'var(--radius-md)' }} />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div style={{ 
              padding: '16px 20px', 
              background: 'rgba(248,113,113,0.1)', 
              border: '2px solid rgba(248,113,113,0.3)', 
              borderRadius: 'var(--radius-xl)', 
              fontSize: '0.85rem', 
              color: '#F87171',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <X size={18} />
              {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && orders.length === 0 && (
            <div style={{ 
              padding: '48px 24px', 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                background: `${accentColor}10`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}>
                <ShoppingBag size={40} color={accentColor} opacity={0.6} />
              </div>
              <div>
                <h3 style={{ 
                  fontFamily: 'var(--font-display)', 
                  fontWeight: 700, 
                  fontSize: '1rem', 
                  color: c.textPrimary,
                  margin: '0 0 8px 0'
                }}>
                  Belum Ada Pesanan
                </h3>
                <p style={{ 
                  fontSize: '0.85rem', 
                  color: c.textTertiary,
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  Mulai belanja dan lihat riwayat pesananmu di sini
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                style={{
                  padding: '12px 24px',
                  background: accentColor,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-xl)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  marginTop: 8,
                  boxShadow: `0 4px 12px ${accentColor}40`
                }}
              >
                Mulai Belanja
              </motion.button>
            </div>
          )}

          {/* Orders List */}
          {!loading && !error && orders.map((o, index) => {
            const statusCfg = PESANAN_STATUS[o.status] || PESANAN_STATUS.pending
            const dotColor = statusCfg.color === 'success' ? '#10B981'
              : statusCfg.color === 'warning' ? '#F59E0B'
              : statusCfg.color === 'danger' ? '#EF4444'
              : accentColor

            return (
              <motion.a
                key={o.id}
                href={`/invoice/${o.orderId || o.id}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                style={{ 
                  textDecoration: 'none', 
                  display: 'block'
                }}
              >
                <div style={{ 
                  padding: isMobile ? '14px 16px' : '18px 20px', 
                  background: c.surface, 
                  border: `2px solid ${c.borderCard}`, 
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Status indicator bar */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: dotColor,
                    opacity: 0.8
                  }} />

                  <div style={{ marginTop: 8 }}>
                    {/* Header: Product Name + Status */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: 10, 
                      marginBottom: 12 
                    }}>
                      <div style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        background: dotColor, 
                        flexShrink: 0,
                        marginTop: 6,
                        boxShadow: `0 0 0 3px ${dotColor}20`
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ 
                          fontSize: '0.95rem', 
                          fontWeight: 700, 
                          color: c.textPrimary, 
                          margin: 0,
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {o.produkNama}
                        </h3>
                      </div>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        padding: '4px 10px', 
                        borderRadius: 'var(--radius-full)', 
                        background: `${dotColor}15`, 
                        color: dotColor, 
                        whiteSpace: 'nowrap',
                        border: `1px solid ${dotColor}30`
                      }}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Order Info */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: c.textTertiary,
                          marginBottom: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <Clock size={12} />
                          {o.orderId ? <span style={{ fontWeight: 600 }}>{o.orderId}</span> : null}
                          <span>·</span>
                          <span>{formatDateTime(o.createdAt)}</span>
                        </div>
                        {o.resi && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 6, 
                            fontSize: '0.75rem', 
                            color: c.textSecondary,
                            marginTop: 6,
                            padding: '6px 10px',
                            background: `${c.bgSecondary}`,
                            borderRadius: 'var(--radius-md)',
                            border: `1px dashed ${c.borderCard}`
                          }}>
                            <Truck size={14} color={accentColor} />
                            <span style={{ fontWeight: 600 }}>{o.kurir}</span>
                            <span>—</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{o.resi}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '1.1rem', 
                          fontWeight: 800, 
                          color: accentColor,
                          textShadow: `0 2px 8px ${accentColor}30`
                        }}>
                          {formatRupiah(o.total)}
                        </div>
                        <div style={{ 
                          fontSize: '0.7rem', 
                          color: c.textTertiary,
                          marginTop: 2
                        }}>
                          Total bayar
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chevron indicator */}
                  <div style={{
                    position: 'absolute',
                    right: 16,
                    bottom: 16,
                    opacity: 0.3
                  }}>
                    <ChevronRight size={20} color={c.textSecondary} />
                  </div>
                </div>
              </motion.a>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )

  return createPortal(modalContent, document.body)
}
