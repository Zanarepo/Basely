import React, { useState, useEffect } from 'react'
import { List, ChevronRight, ChevronLeft, Bookmark } from 'lucide-react'

interface SectionItem {
  key: string
  title: string
  [key: string]: any
}

interface DocumentTableOfContentsProps {
  sections: SectionItem[]
  sectionTitleOverrides?: Record<string, string>
}

export default function DocumentTableOfContents({
  sections,
  sectionTitleOverrides = {}
}: DocumentTableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSectionKey, setActiveSectionKey] = useState<string>('')

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200

      for (let i = sections.length - 1; i >= 0; i--) {
        const key = sections[i].key
        const element = document.getElementById(`doc-section-${key}`)
        if (element) {
          const top = element.offsetTop
          if (scrollPosition >= top) {
            setActiveSectionKey(key)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections])

  const scrollToSection = (key: string) => {
    const element = document.getElementById(`doc-section-${key}`)
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - 120
      window.scrollTo({ top: offsetTop, behavior: 'smooth' })
      setActiveSectionKey(key)
    }
  }

  if (!sections || sections.length === 0) return null

  return (
    <div className="fixed right-6 top-32 z-40 flex items-start group">
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer' }}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-app-surface/90 backdrop-blur-md border border-app-border text-app-fg hover:text-violet-600 hover:border-violet-500/40 transition-all shadow-lg cursor-pointer"
        title="Toggle Document Table of Contents"
      >
        <List className="w-4 h-4 text-violet-500" />
        <span className="hidden sm:inline">Outline</span>
        <span className="text-[10px] font-extrabold bg-violet-500/10 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-full">
          {sections.length}
        </span>
        {isOpen ? (
          <ChevronRight className="w-3.5 h-3.5 text-app-muted" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-app-muted" />
        )}
      </button>

      {/* Slide-out Table of Contents Card */}
      {isOpen && (
        <div className="mr-2 w-64 max-h-[70vh] overflow-y-auto bg-app-surface/95 backdrop-blur-md border border-app-border rounded-2xl shadow-xl p-4 space-y-2 animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between border-b border-app-border/60 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-app-fg uppercase tracking-wider">
              <Bookmark className="w-3.5 h-3.5 text-violet-500" />
              Document Outline
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-app-muted hover:text-app-fg text-xs font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1 pt-1">
            {sections.map((sec, idx) => {
              const displayTitle = sectionTitleOverrides[sec.key] || sec.title
              const isActive = activeSectionKey === sec.key

              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => scrollToSection(sec.key)}
                  style={{ cursor: 'pointer' }}
                  className={`w-text-left w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 font-bold border-l-2 border-violet-500'
                      : 'text-app-muted hover:text-app-fg hover:bg-app-hover font-medium'
                  }`}
                  title={`Scroll to section: ${displayTitle}`}
                >
                  <span className="truncate flex-1">
                    <span className="opacity-40 font-mono mr-1.5">{idx + 1}.</span>
                    {displayTitle}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
