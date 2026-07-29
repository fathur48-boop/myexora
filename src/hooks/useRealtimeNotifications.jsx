import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

// Web Audio API chime synthesizer for native zero-dependency audio
export function playNotificationSound(type = 'order') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    
    if (type === 'order') {
      // High-pitch pleasant double chime for new incoming orders
      const now = ctx.currentTime
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(523.25, now) // C5
      gain1.gain.setValueAtTime(0.2, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.3)

      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(783.99, now + 0.15) // G5
      gain2.gain.setValueAtTime(0.25, now + 0.15)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.15)
      osc2.stop(now + 0.5)
    } else {
      // Soft pop chime for DM/Likes
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(659.25, now) // E5
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.25)
    }
  } catch (e) {
    console.log('Audio chime not allowed or supported', e)
  }
}

export function useRealtimeNotifications(tokoId) {
  const [permission, setPermission] = useState('default')
  const [unreadCount, setUnreadCount] = useState(2)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Browser kamu tidak mendukung Web Push Notification.')
      return false
    }
    try {
      const res = await Notification.requestPermission()
      setPermission(res)
      if (res === 'granted') {
        playNotificationSound('order')
        toast.success('Push notification browser berhasil diaktifkan! 🔔')
        return true
      } else {
        toast.error('Izin notifikasi ditolak di browser.')
        return false
      }
    } catch (e) {
      console.error(e)
      return false
    }
  }

  const triggerPushNotification = ({ title, body, icon, type = 'order', onClick }) => {
    playNotificationSound(type)

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: icon || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
          tag: 'exora-' + Date.now(),
        })
        if (onClick) {
          notif.onclick = () => {
            window.focus()
            onClick()
          }
        }
      } catch (err) {
        console.error('Push notification error:', err)
      }
    }

    // Always show toast
    toast.custom((t) => (
      <div
        onClick={() => {
          toast.dismiss(t.id)
          if (onClick) onClick()
        }}
        style={{
          background: '#0f172a',
          border: '2px solid #38bdf8',
          borderRadius: 16,
          padding: '12px 16px',
          color: '#fff',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          maxWidth: 360,
        }}
      >
        <div style={{ fontSize: 24, flexShrink: 0 }}>
          {type === 'order' ? '🛒' : type === 'dm' ? '✉️' : '❤️'}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#38bdf8' }}>{title}</div>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: 2, lineHeight: 1.4 }}>{body}</div>
        </div>
      </div>
    ), { duration: 5000 })

    setUnreadCount(prev => prev + 1)
  }

  const simulateIncomingOrder = () => {
    const names = ['Budi Santoso', 'Siti Rahmawati', 'Ahmad Rizky', 'Dewi Lestari', 'Dedi Prasetyo']
    const items = ['Kemeja Batik Solo Premium', 'Kaos Oversize Cotton', 'Biji Kopi Arabika Gayo 1kg', 'Serum Centella Asiatica']
    const randomName = names[Math.floor(Math.random() * names.length)]
    const randomItem = items[Math.floor(Math.random() * items.length)]
    const randomTotal = `Rp ${(Math.floor(Math.random() * 20) + 5) * 10000}`
    const orderId = `EXR-${Math.floor(10000 + Math.random() * 90000)}`

    triggerPushNotification({
      title: `🛒 Pesanan Baru Masuk! (${orderId})`,
      body: `${randomName} baru saja memesan ${randomItem} — Total ${randomTotal}`,
      type: 'order',
      onClick: () => {
        window.location.href = '/dashboard/pesanan'
      }
    })
  }

  const markRead = () => {
    setUnreadCount(0)
  }

  return {
    permission,
    unreadCount,
    requestPermission,
    triggerPushNotification,
    simulateIncomingOrder,
    markRead,
  }
}
