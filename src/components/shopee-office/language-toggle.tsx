'use client'

import { cn } from '@/lib/utils'

export type Language = 'en' | 'cn' | 'jp'

interface LanguageToggleProps {
  language: Language
  onLanguageChange: (lang: Language) => void
}

const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'cn', label: 'CN' },
  { code: 'jp', label: 'JP' },
]

export function LanguageToggle({ language, onLanguageChange }: LanguageToggleProps) {
  return (
    <div className="shopee-lang-toggle">
      {languages.map((lang) => (
        <button
          key={lang.code}
          className={cn('shopee-lang-btn', language === lang.code && 'shopee-lang-btn-active')}
          onClick={() => onLanguageChange(lang.code)}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
