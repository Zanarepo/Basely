import React from 'react'
import { Link2, ExternalLink, FileText } from 'lucide-react'

interface ReferenceLink {
  label: string
  url: string
  sectionKey: string
  sectionTitle: string
}

interface ReferenceDocumentsSectionProps {
  freeText: Record<string, string>
  allSections: Array<{ key: string; title: string }>
  documentType?: string
  documentTitle?: string
}

export default function ReferenceDocumentsSection({
  freeText,
  allSections,
  documentType = '',
  documentTitle = ''
}: ReferenceDocumentsSectionProps) {
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
    <div className="mt-12 pt-8 border-t-2 border-app-border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-app-fg flex items-center gap-2">
              Reference Documents & External Links
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                {uniqueExtractedLinks.length} {uniqueExtractedLinks.length === 1 ? 'Link' : 'Links'}
              </span>
            </h3>
            <p className="text-xs text-app-muted">
              Auto-indexed external resources, specs, and reference documents linked in this {docName}
            </p>
          </div>
        </div>
      </div>

      {uniqueExtractedLinks.length > 0 ? (
        <div className="overflow-x-auto border border-app-border rounded-xl bg-app-surface shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-app-muted-surface border-b border-app-border text-app-muted font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Reference Document / Link</th>
                <th className="px-4 py-3">Section Location</th>
                <th className="px-4 py-3">Target URL</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {uniqueExtractedLinks.map((link, idx) => (
                <tr key={`${link.url}-${idx}`} className="hover:bg-app-hover/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-app-fg flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                    <span>{link.label}</span>
                  </td>
                  <td className="px-4 py-3 text-app-muted font-medium">
                    {link.sectionTitle}
                  </td>
                  <td className="px-4 py-3 text-app-muted font-mono truncate max-w-xs" title={link.url}>
                    {link.url}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 transition-all cursor-pointer"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 rounded-xl border border-app-border bg-app-surface text-center text-xs text-app-muted">
          No reference links added yet in any section. Use the <Link2 className="w-3 h-3 inline text-violet-500 mx-0.5" /> button in any section toolbar to insert external links.
        </div>
      )}
    </div>
  )
}
