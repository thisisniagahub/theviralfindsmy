'use client'

import { createContext, useContext } from 'react'
import { defaultLocale, type Locale } from './config'

// Simple client-side i18n without middleware (no URL prefix changes)
// This allows the app to work on Vercel without locale-based routing

const messagesCache = new Map<Locale, Record<string, any>>()

async function loadMessages(locale: Locale) {
  if (messagesCache.has(locale)) return messagesCache.get(locale)!

  const messages = (await import(`./messages/${locale}.json`)).default
  messagesCache.set(locale, messages)
  return messages
}

// Simple translation function
function getNestedValue(obj: Record<string, any>, path: string): string {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path
}

export function useTranslation() {
  // For now, return a simple t function that will be enhanced later
  // This provides the foundation for full i18n integration
  const locale = defaultLocale

  return {
    locale,
    t: (key: string) => key, // Will be replaced with actual lookup
    setLocale: async (_locale: Locale) => {
      // Will be implemented with localStorage persistence
    },
  }
}

export { loadMessages, getNestedValue }
export { locales, defaultLocale, localeNames, type Locale } from './config'
