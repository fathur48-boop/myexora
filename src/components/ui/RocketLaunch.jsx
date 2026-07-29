import React from 'react'

export default function RocketLaunch({ show, duration = 2500 }) {
  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes rocketFly {
          0% {
            transform: translate(-100vw, 100vh) scale(0.5) rotate(45deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translate(100vw, -100vh) scale(1.5) rotate(45deg);
            opacity: 0;
          }
        }
      `}</style>
      <div style={{
        fontSize: 80,
        animation: `rocketFly ${duration}ms cubic-bezier(0.25, 1, 0.5, 1) forwards`,
        filter: 'drop-shadow(0 0 20px rgba(255, 150, 0, 0.8))',
      }}>
        🚀
      </div>
    </div>
  )
}
