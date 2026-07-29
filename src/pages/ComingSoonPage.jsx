import React from 'react'

export default function ComingSoonPage({ title = 'Fitur Baru' }) {
  return (
    <div style={{ padding: 60, textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>{title}</h2>
      <p style={{ color: '#666', marginTop: 10 }}>Segera hadir untuk mendukung perkembangan toko Anda!</p>
    </div>
  )
}
