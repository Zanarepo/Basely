import React, { useState } from 'react'
import { Link2, ExternalLink, ChevronDown, FileText } from 'lucide-react'

interface ReferenceLink {
  label: string
  url: string
  sectionKey: string
  sectionTitle: string
}

interface FloatingReferenceLinksWidgetProps {
  freeText: Record<string, string>
  allSections: Array<{ key: string; title: string }>
  documentType?: string
  documentTitle?: string
}

export default function FloatingReferenceLinksWidget({
  freeText,
  allSections,
  documentType = '',
  documentTitle = ''
}: FloatingReferenceLinksWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)

  const rawDocName = documentTitle || (documentType ? documentType.replaceAll('_', ' ') : 'Document')
  const docName = rawDocName.toLowerCase().endsWith('document') || rawDocName.toLowerCase().endsWith('doc')
    ? rawDocName.replace(/\b\w/g, l => l.toUpperCase())
    : `${rawDocName.replace(/\b\w/g, l => l.toUpperCase())} Document`

  const sectionTitleMap = new Map<string, string>()
  allSections.forEach(s => sectionTitleMap.set(s.key, s.title))

  const activeSectionKeys = new Set(allSections.map(s => s.key))
  const uniqueExtractedLinks: ReferenceLink[] = []
  const seenUrls = new Set<string>()

  Object.entries(freeText).forEach(([key, val]) => {
    if (!val || typeof val !== 'string' || key.startsWith('__')) return
    if (!activeSectionKeys.has(key)) return

    const sectionTitle = sectionTitleMap.get(key) || key.replace(/^custom_sec_/, 'Section ')

    // Match markdown links [label](url) and raw URLs
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+[^<.,:\s])/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(val)) !== null) {
      const label = (match[1] || match[3] || '').trim()
      let url = (match[2] || match[3] || '').trim()

      if (url) {
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
          url = `https://${url}`
        }

        if (!seenUrls.has(url)) {
          seenUrls.add(url)
          uniqueExtractedLinks.push({
            label: label || url,
            url,
            sectionKey: key,
            sectionTitle
          })
        }
      }
    }
  })

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 animate-fade-in pointer-events-auto">
      {/* Expanded Links Popover Card */}
      {isOpen && (
        <div className="w-80 sm:w-96 max-h-96 bg-white dark:bg-slate-900 border border-app-border rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 border-violet-500/30">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border-b border-app-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500">
                <Link2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-app-fg">Reference Documents</h4>
                <p className="text-[10px] text-app-muted">
                  {uniqueExtractedLinks.length} {uniqueExtractedLinks.length === 1 ? 'link' : 'links'} in this {docName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ cursor: 'pointer' }}
              className="p-1 rounded-lg hover:bg-app-hover text-app-muted hover:text-app-fg transition-colors cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto p-2 divide-y divide-app-border/50 max-h-72">
            {uniqueExtractedLinks.length > 0 ? (
              uniqueExtractedLinks.map((link, idx) => (
                <div key={`${link.url}-${idx}`} className="p-2.5 hover:bg-app-hover/50 rounded-xl transition-colors space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-app-fg flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                      <span className="truncate">{link.label}</span>
                    </span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 rounded transition-all shrink-0 cursor-pointer"
                    >
                      Open <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-app-muted pt-0.5">
                    <span className="truncate text-violet-500 font-medium">📍 {link.sectionTitle}</span>
                    <span className="font-mono truncate max-w-[140px] opacity-75">{link.url}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-app-muted">
                No reference links added yet in any section. Use the <Link2 className="w-3 h-3 inline text-violet-500 mx-0.5" /> button in any section to insert links.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Floating Pill Button in Bottom Right Corner */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer' }}
        className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg hover:shadow-violet-500/25 transition-all duration-200 cursor-pointer group"
        title="View all reference documents & external links"
      >
        <Link2 className="w-4 h-4 text-violet-200 group-hover:rotate-12 transition-transform" />
        <span>Reference Links</span>
        <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px] font-extrabold">
          {uniqueExtractedLinks.length}
        </span>
      </button>
    </div>
  )
}
