import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('exora_theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('exora_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return { theme, toggleTheme, setTheme }
}
