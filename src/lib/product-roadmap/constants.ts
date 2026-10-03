export const ROADMAP_THEMES = {
  'Growth': {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-700 dark:text-purple-400',
    icon: 'text-purple-500',
    gradient: 'from-purple-500/5 to-transparent',
  },
  'Core Experience': {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    icon: 'text-emerald-500',
    gradient: 'from-emerald-500/5 to-transparent',
  },
  'Tech Debt': {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-700 dark:text-blue-400',
    icon: 'text-blue-500',
    gradient: 'from-blue-500/5 to-transparent',
  },
  'Infrastructure': {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-700 dark:text-slate-400',
    icon: 'text-slate-500',
    gradient: 'from-slate-500/5 to-transparent',
  },
  'Security & Compliance': {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-700 dark:text-rose-400',
    icon: 'text-rose-500',
    gradient: 'from-rose-500/5 to-transparent',
  },
  'Default': {
    bg: 'bg-app-fg/5',
    border: 'border-app-border',
    text: 'text-app-fg',
    icon: 'text-app-muted',
    gradient: 'from-transparent to-transparent',
  }
}

export type ThemeKey = keyof typeof ROADMAP_THEMES | string

export function getThemeStyles(themeName?: string | null) {
  if (!themeName) return ROADMAP_THEMES['Default']
  
  // Try exact match or substring match (e.g. if name is "Growth Initiatives")
  const key = Object.keys(ROADMAP_THEMES).find(k => 
    themeName.toLowerCase().includes(k.toLowerCase())
  )
  
  return key ? ROADMAP_THEMES[key as keyof typeof ROADMAP_THEMES] : ROADMAP_THEMES['Default']
}

export const HORIZONS = ['Backlog', 'Now', 'Next', 'Later'] as const
export type Horizon = typeof HORIZONS[number]
