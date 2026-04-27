'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'
import { localeNames, type Locale } from '@/lib/i18n'

export function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<Locale>('en')

  const handleLocaleChange = (locale: Locale) => {
    setCurrentLocale(locale)
    localStorage.setItem('locale', locale)
    // Full i18n integration will be completed in a future update
    // For now, this stores the preference for when full i18n is active
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change language">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.entries(localeNames) as [Locale, string][]).map(([locale, name]) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={currentLocale === locale ? 'bg-accent' : ''}
          >
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
