'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Zap, Clock } from 'lucide-react'

// ===== Theme Types =====
export type OfficeTheme = 'day' | 'night' | 'neon' | 'auto'

interface ThemeSelectorProps {
  currentTheme: OfficeTheme
  onThemeChange: (theme: OfficeTheme) => void
}

// ===== Theme Config =====
export const THEME_CONFIG: Record<OfficeTheme, {
  label: string
  icon: typeof Sun
  colors: {
    bg: string
    panelBg: string
    border: string
    text: string
    accent: string
    glow: string
  }
}> = {
  day: {
    label: 'Day',
    icon: Sun,
    colors: {
      bg: 'linear-gradient(135deg, #e8e0d4 0%, #d4ccc0 100%)',
      panelBg: '#f5f0e8',
      border: '#c4b48e',
      text: '#3b3b32',
      accent: '#EE4D2D',
      glow: 'rgba(238, 77, 45, 0.2)',
    },
  },
  night: {
    label: 'Night',
    icon: Moon,
    colors: {
      bg: 'linear-gradient(135deg, #0a0e1a 0%, #111827 100%)',
      panelBg: '#141722',
      border: '#1e2338',
      text: '#e0e0e0',
      accent: '#3b82f6',
      glow: 'rgba(59, 130, 246, 0.3)',
    },
  },
  neon: {
    label: 'Neon',
    icon: Zap,
    colors: {
      bg: 'linear-gradient(135deg, #0a0014 0%, #1a002e 100%)',
      panelBg: '#0f0020',
      border: '#3a0066',
      text: '#e0c0ff',
      accent: '#00ff88',
      glow: 'rgba(0, 255, 136, 0.3)',
    },
  },
  auto: {
    label: 'Auto',
    icon: Clock,
    colors: {
      bg: '', // computed at runtime
      panelBg: '',
      border: '',
      text: '',
      accent: '',
      glow: '',
    },
  },
}

// ===== Get effective theme (resolves 'auto') =====
export function getEffectiveTheme(theme: OfficeTheme): 'day' | 'night' | 'neon' {
  if (theme !== 'auto') return theme
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18 ? 'day' : 'night'
}

// ===== Apply theme CSS variables =====
export function applyThemeCSS(theme: OfficeTheme): void {
  const effective = getEffectiveTheme(theme)
  const config = THEME_CONFIG[effective]
  const root = document.documentElement

  root.style.setProperty('--office-bg', config.colors.bg)
  root.style.setProperty('--office-panel-bg', config.colors.panelBg)
  root.style.setProperty('--office-border', config.colors.border)
  root.style.setProperty('--office-text', config.colors.text)
  root.style.setProperty('--office-accent', config.colors.accent)
  root.style.setProperty('--office-glow', config.colors.glow)
}

// ===== Component =====
export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = useCallback((theme: OfficeTheme) => {
    onThemeChange(theme)
    applyThemeCSS(theme)
    localStorage.setItem('shopee-office-theme', theme)
    setIsOpen(false)
  }, [onThemeChange])

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('shopee-office-theme') as OfficeTheme | null
    if (saved && THEME_CONFIG[saved]) {
      onThemeChange(saved)
      applyThemeCSS(saved)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const effective = getEffectiveTheme(currentTheme)
  const CurrentIcon = THEME_CONFIG[effective]?.icon || Moon

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="shopee-btn flex items-center gap-1"
        onClick={() => setIsOpen(!isOpen)}
        style={{ fontSize: 10, padding: '3px 8px' }}
      >
        <CurrentIcon size={12} />
        <span style={{ fontSize: 9 }}>{THEME_CONFIG[effective]?.label || 'Theme'}</span>
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: '#141722',
            border: '1px solid #2a2d3e',
            borderRadius: 6,
            padding: 4,
            zIndex: 50,
            minWidth: 100,
          }}
        >
          {(Object.entries(THEME_CONFIG) as [OfficeTheme, typeof THEME_CONFIG.day][]).map(([key, config]) => {
            const Icon = config.icon
            return (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '6px 10px',
                  background: currentTheme === key ? '#2a2d3e' : 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  color: currentTheme === key ? '#EE4D2D' : '#aaa',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (currentTheme !== key) {
                    e.currentTarget.style.background = '#1e2130'
                    e.currentTarget.style.color = '#e0e0e0'
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentTheme !== key) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#aaa'
                  }
                }}
              >
                <Icon size={12} />
                <span>{config.label}</span>
                {currentTheme === key && (
                  <span style={{ marginLeft: 'auto', fontSize: 9 }}>✓</span>
                )}
              </button>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
