import React from 'react'
import { Link2, ExternalLink } from 'lucide-react'

export interface ReferenceLinkItem {
  label: string
  url: string
}

interface SectionReferenceLinksBarProps {
  value: string
}

export default function SectionReferenceLinksBar({ value }: SectionReferenceLinksBarProps) {
  // Extract all markdown links and standalone raw URLs in this section's value
  const sectionLinks: ReferenceLinkItem[] = []

  if (value && typeof value === 'string') {
    // 1. Match Markdown links [label](url)
    const mdRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let match: RegExpExecArray | null
    while ((match = mdRegex.exec(value)) !== null) {
      const label = match[1].trim()
      let url = match[2].trim()
      if (url) {
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
          url = `https://${url}`
        }
        if (!sectionLinks.some((l) => l.url === url)) {
          sectionLinks.push({ label: label || url, url })
        }
      }
    }

    // 2. Strip out all markdown links [label](url) before checking for standalone raw URLs
    const textWithoutMarkdownLinks = value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '')

    // 3. Match only standalone raw URLs in text (e.g. pasted plain URLs)
    const rawUrlRegex = /(https?:\/\/[^\s<]+[^<.,:\s])/g
    while ((match = rawUrlRegex.exec(textWithoutMarkdownLinks)) !== null) {
      const url = match[0].trim()
      if (!sectionLinks.some((l) => l.url === url)) {
        try {
          const parsed = new URL(url)
          const label =
            parsed.hostname.replace(/^www\./, '') +
            (parsed.pathname !== '/' && parsed.pathname.length < 15 ? parsed.pathname : '')
          sectionLinks.push({ label, url })
        } catch {
          sectionLinks.push({ label: url, url })
        }
      }
    }
  }

  if (sectionLinks.length === 0) return null

  return (
    <div className="flex items-center justify-end flex-wrap gap-2 px-4 py-2 bg-app-muted-surface/50 border-t border-app-border text-xs">
      <span className="text-[11px] font-bold text-app-muted flex items-center gap-1.5 mr-1">
        <Link2 className="w-3.5 h-3.5 text-violet-500" /> Reference Links:
      </span>
      {sectionLinks.map((link, idx) => (
        <a
          key={`${link.url}-${idx}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 rounded-lg transition-all cursor-pointer shadow-2xs"
          title={`Open ${link.url}`}
        >
          <span>{link.label}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-80" />
        </a>
      ))}
    </div>
  )
}
