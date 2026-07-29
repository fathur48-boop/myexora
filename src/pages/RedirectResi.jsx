import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { pesananApi } from '../lib/api'

export default function RedirectResi() {
  const { resi } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!resi) {
      navigate('/', { replace: true })
      return
    }

    pesananApi.getSlugByResi(resi)
      .then(res => {
        const slug = res.data?.slug
        if (slug) {
          navigate(`/${slug}?resi=${resi}`, { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      })
      .catch(() => {
        navigate('/', { replace: true })
      })
  }, [resi, navigate])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: 12,
      color: 'var(--text-secondary, #999)',
      background: 'var(--bg-primary, #050508)',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: '3px solid var(--glass-border, rgba(255,255,255,0.1))',
        borderTopColor: 'var(--accent, #378ADD)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Mencari toko...</span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
