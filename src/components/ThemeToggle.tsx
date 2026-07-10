'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'

type ThemeToggleProps = {
  collapsed?: boolean
  className?: string
}

export function ThemeToggle({ collapsed = false, className = '' }: ThemeToggleProps) {
  const { theme, setTheme, mounted } = useTheme()

  if (!mounted) {
    return (
      <div
        className={`h-10 rounded-xl bg-app-muted-surface border border-app-border ${collapsed ? 'w-10' : 'w-full'} ${className}`}
      />
    )
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className={`w-full flex items-center justify-center p-2.5 rounded-xl bg-app-muted-surface border border-app-border text-app-muted hover:text-indigo-500 hover:border-indigo-500/40 transition-all cursor-pointer ${className}`}
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>
    )
  }

  return (
    <div
      className={`flex p-1 rounded-xl bg-app-muted-surface border border-app-border ${className}`}
      role="group"
      aria-label="Display mode"
    >
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          theme === 'dark'
            ? 'bg-indigo-500/20 text-indigo-400 shadow-sm'
            : 'text-app-muted hover:text-app-fg'
        }`}
      >
        <Moon className="h-3.5 w-3.5" />
        Dark
      </button>
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          theme === 'light'
            ? 'bg-indigo-500/20 text-indigo-500 shadow-sm'
            : 'text-app-muted hover:text-app-fg'
        }`}
      >
        <Sun className="h-3.5 w-3.5" />
        Light
      </button>
    </div>
  )
}
