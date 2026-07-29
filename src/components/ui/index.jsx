import React from 'react'
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react'

export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      background: 'var(--surface, rgba(255, 255, 255, 0.05))',
      borderRadius: 16,
      border: '1px dashed var(--glass-border, rgba(255, 255, 255, 0.1))',
    }}>
      {icon && (
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--accent-glow, rgba(91, 138, 245, 0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent, #5b8af5)',
          marginBottom: 16,
        }}>
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>{title}</h3>
      {description && <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 16px', maxWidth: 360 }}>{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, isLoading, title, message }) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-secondary, #1a1a24)',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--danger, #ef4444)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Memproses...' : 'Ya, Lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Alert({ type = 'info', title, children }) {
  const isWarning = type === 'warning'
  const isDanger = type === 'danger' || type === 'error'
  const isSuccess = type === 'success'

  const bg = isWarning
    ? 'rgba(245, 158, 11, 0.1)'
    : isDanger
    ? 'rgba(239, 68, 68, 0.1)'
    : isSuccess
    ? 'rgba(34, 197, 94, 0.1)'
    : 'rgba(91, 138, 245, 0.1)'

  const borderColor = isWarning
    ? 'rgba(245, 158, 11, 0.3)'
    : isDanger
    ? 'rgba(239, 68, 68, 0.3)'
    : isSuccess
    ? 'rgba(34, 197, 94, 0.3)'
    : 'rgba(91, 138, 245, 0.3)'

  const textColor = isWarning
    ? '#f59e0b'
    : isDanger
    ? '#ef4444'
    : isSuccess
    ? '#22c55e'
    : '#5b8af5'

  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 12,
      background: bg,
      border: `1px solid ${borderColor}`,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <div style={{ color: textColor, marginTop: 2, flexShrink: 0 }}>
        {isWarning ? <AlertTriangle size={18} /> : isDanger ? <XCircle size={18} /> : isSuccess ? <CheckCircle2 size={18} /> : <Info size={18} />}
      </div>
      <div style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
        {title && <div style={{ fontWeight: 700, color: textColor, marginBottom: 2 }}>{title}</div>}
        {children}
      </div>
    </div>
  )
}

export function ProductSkeleton() {
  return (
    <div style={{
      borderRadius: 12,
      background: 'var(--surface, rgba(255,255,255,0.03))',
      border: '1px solid var(--glass-border, rgba(255,255,255,0.05))',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 8,
    }}>
      <div style={{
        aspectRatio: '1/1',
        borderRadius: 8,
        background: 'var(--glass-border, rgba(255,255,255,0.08))',
        animation: 'pulse 1.5s infinite ease-in-out',
      }} />
      <div style={{
        height: 14,
        width: '80%',
        borderRadius: 4,
        background: 'var(--glass-border, rgba(255,255,255,0.08))',
        animation: 'pulse 1.5s infinite ease-in-out',
      }} />
      <div style={{
        height: 12,
        width: '50%',
        borderRadius: 4,
        background: 'var(--glass-border, rgba(255,255,255,0.08))',
        animation: 'pulse 1.5s infinite ease-in-out',
      }} />
    </div>
  )
}

export function Modal({ isOpen, onClose, title, size = 'md', children, footer }) {
  if (!isOpen) return null

  const maxWidths = {
    sm: 400,
    md: 560,
    lg: 720,
    xl: 900,
  }
  const maxWidth = maxWidths[size] || 560

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-secondary, #12121a)',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth,
        border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              fontSize: 18,
              padding: '2px 8px',
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
            marginTop: 20,
            paddingTop: 12,
            borderTop: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

