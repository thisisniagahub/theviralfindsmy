export const locales = ['en', 'ms', 'zh'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ms: 'Bahasa Melayu',
  zh: '中文',
}
