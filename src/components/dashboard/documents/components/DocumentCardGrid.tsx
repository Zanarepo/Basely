import React from 'react'
import { ChevronRight } from 'lucide-react'
import { DocumentItem } from '../constants/documentDefinitions'

interface DocumentCardGridProps {
  activeSuite: 'product' | 'project'
  filteredDocs: DocumentItem[]
  onSelectDoc: (id: string) => void
}

export default function DocumentCardGrid({
  activeSuite,
  filteredDocs,
  onSelectDoc,
}: DocumentCardGridProps) {
  return (
    <div className="space-y-6">
      {/* Header Suite Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-emerald-500/10 border border-violet-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-300 text-[10px] font-bold uppercase tracking-wider">
              {activeSuite === 'product' ? 'Product Management Suite' : 'Project Management Suite'}
            </span>
          </div>
          <h2 className="text-xl font-black text-app-fg">
            {activeSuite === 'product'
              ? 'Product Strategy, PRDs & Discovery Documents'
              : 'Project Governance, Charter & RAID Logs'}
          </h2>
          <p className="text-xs text-app-muted">
            Select any document module below to open its dedicated workspace and editor.
          </p>
        </div>
      </div>

      {/* Document Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => {
          const IconComp = doc.icon

          return (
            <div
              key={doc.id}
              onClick={() => onSelectDoc(doc.id)}
              className="group relative p-5 rounded-3xl bg-app-surface border border-app-border hover:border-violet-500/50 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <IconComp className="w-5 h-5" />
                  </div>
                  {doc.badge && (
                    <span className="px-2 py-0.5 rounded-md bg-app-muted-surface text-app-muted border border-app-border text-[10px] font-bold">
                      {doc.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-app-fg group-hover:text-violet-500 transition-colors">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-app-muted leading-relaxed mt-1">{doc.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-app-border/60 flex items-center justify-between text-xs font-bold text-violet-600 dark:text-violet-400 group-hover:translate-x-1 transition-transform">
                <span>Open Workspace</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
