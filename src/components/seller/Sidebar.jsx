import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, Store, BarChart2,
  Zap, Settings, ShieldCheck, Tag, Users, Radio, PackageCheck
} from 'lucide-react'
import { useAuthStore } from '../../lib/store'
import { isAdminEmail } from '../../lib/AdminGuard'

export default function Sidebar() {
  const location = useLocation()
  const { user } = useAuthStore()
  const isActive = (path) => location.pathname === path
  const isAdmin = isAdminEmail(user?.email)

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent)', letterSpacing: '-0.02em' }}>EXORA</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}>
          <LayoutDashboard size={18} /> Dashboard
        </Link>
        <Link to="/dashboard/produk" className={`sidebar-link ${isActive('/dashboard/produk') || isActive('/produk') ? 'active' : ''}`}>
          <ShoppingBag size={18} /> Produk
        </Link>
        <Link to="/dashboard/pesanan" className={`sidebar-link ${isActive('/dashboard/pesanan') ? 'active' : ''}`}>
          <PackageCheck size={18} /> Pesanan
        </Link>
        <Link to="/dashboard/stream" className={`sidebar-link ${isActive('/dashboard/stream') || isActive('/stream') ? 'active' : ''}`}>
          <Radio size={18} /> Stream
        </Link>
        <Link to="/dashboard/analytics" className={`sidebar-link ${isActive('/dashboard/analytics') || isActive('/analytics') ? 'active' : ''}`}>
          <BarChart2 size={18} /> Analitik
        </Link>
        <Link to="/dashboard/crm" className={`sidebar-link ${isActive('/dashboard/crm') || isActive('/crm') ? 'active' : ''}`}>
          <Users size={18} /> CRM & Broadcast
        </Link>
        <Link to="/dashboard/promo" className={`sidebar-link ${isActive('/dashboard/promo') || isActive('/promo') ? 'active' : ''}`}>
          <Tag size={18} /> Promo & Kupon
        </Link>
        <Link to="/dashboard/settings" className={`sidebar-link ${isActive('/dashboard/settings') || isActive('/settings') ? 'active' : ''}`}>
          <Settings size={18} /> Pengaturan
        </Link>
        <Link to="/exora-official" className="sidebar-link" style={{ color: 'var(--accent)', fontWeight: 600 }}>
          <Store size={18} /> Lihat Toko Saya
        </Link>
        {isAdmin && (
          <Link to="/admin" className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`} style={{ color: '#f87171' }}>
            <ShieldCheck size={18} /> Panel Admin
          </Link>
        )}
      </nav>

      <style>{`
        .dashboard-sidebar {
          width: 240px;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          background: var(--bg-card);
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          z-index: 40;
          padding: 24px 16px;
        }

        .sidebar-brand {
          padding: 0 12px 24px;
          border-bottom: 1px solid var(--glass-border);
          margin-bottom: 16px;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          overflow-y: auto;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: var(--radius-md, 8px);
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .sidebar-link:hover {
          background: var(--bg-surface);
          color: var(--text-primary);
        }

        .sidebar-link.active {
          background: var(--accent-surface, rgba(124, 58, 237, 0.1));
          color: var(--accent, #7c3aed);
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .dashboard-sidebar {
            width: 100%;
            height: auto;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: auto;
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;
            padding: 8px 12px;
            background: var(--bg-secondary, #0e0e12);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            z-index: 100;
          }
          .sidebar-brand {
            padding: 4px 6px 8px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            margin-bottom: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .sidebar-nav {
            flex-direction: row;
            overflow-x: auto;
            white-space: nowrap;
            padding: 2px 0 4px;
            gap: 6px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .sidebar-nav::-webkit-scrollbar {
            display: none;
          }
          .sidebar-link {
            padding: 8px 12px;
            white-space: nowrap;
            font-size: 0.8rem;
            border-radius: 10px;
            background: rgba(255,255,255,0.03);
            flex-shrink: 0;
          }
        }
      `}</style>
    </aside>
  )
}
