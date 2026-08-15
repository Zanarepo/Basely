import React from 'react'
import { ArrowLeft, Target, Layers, ChevronDown, Check, BookOpen } from 'lucide-react'
import { DocumentItem } from '../constants/documentDefinitions'

interface ActiveDocumentHeaderProps {
  activeSuite: 'product' | 'project'
  selectedDocId: string
  selectedDocItem: DocumentItem | null
  currentSuiteDocs: DocumentItem[]
  isDropdownOpen: boolean
  showGuideDrawer: boolean
  onBackToHub: () => void
  onSuiteChange: (suite: 'product' | 'project') => void
  onSelectDoc: (id: string) => void
  onToggleDropdown: () => void
  onCloseDropdown: () => void
  onToggleGuideDrawer: () => void
}

export default function ActiveDocumentHeader({
  activeSuite,
  selectedDocId,
  selectedDocItem,
  currentSuiteDocs,
  isDropdownOpen,
  showGuideDrawer,
  onBackToHub,
  onSuiteChange,
  onSelectDoc,
  onToggleDropdown,
  onCloseDropdown,
  onToggleGuideDrawer,
}: ActiveDocumentHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBackToHub}
          className="p-2 rounded-xl bg-app-muted-surface hover:bg-app-hover border border-app-border text-app-fg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Document Center</span>
        </button>

        <div className="h-5 w-[1px] bg-app-border hidden sm:block" />

        <div className="flex flex-wrap items-center gap-2">
          {/* Suite Switcher Pill */}
          <div className="flex p-0.5 rounded-xl bg-app-muted-surface border border-app-border text-xs font-bold">
            <button
              type="button"
              onClick={() => onSuiteChange('product')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSuite === 'product'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-app-muted hover:text-app-fg'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Product Suite</span>
            </button>

            <button
              type="button"
              onClick={() => onSuiteChange('project')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSuite === 'project'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-app-muted hover:text-app-fg'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Project Suite</span>
            </button>
          </div>

          {/* Custom Enterprise Popover Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={onToggleDropdown}
              className="px-3.5 py-2 rounded-2xl bg-app-surface border border-app-border hover:border-violet-500/50 text-xs font-extrabold text-app-fg flex items-center gap-2.5 shadow-xs transition-all cursor-pointer"
            >
              <span className="truncate max-w-[220px]">{selectedDocItem?.title || selectedDocId}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-app-muted transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={onCloseDropdown} />
                <div className="absolute left-0 mt-2 w-72 max-h-80 overflow-y-auto z-50 p-1.5 rounded-2xl bg-app-surface-solid border border-app-border shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-black tracking-wider text-app-subtle border-b border-app-border/50">
                    {activeSuite === 'product' ? 'Product Suite Documents' : 'Project Suite Documents'}
                  </div>
                  {currentSuiteDocs.map((doc) => {
                    const isSelected = doc.id === selectedDocId
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => {
                          onSelectDoc(doc.id)
                          onCloseDropdown()
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-xs text-left font-bold transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 font-black'
                            : 'text-app-fg hover:bg-app-hover'
                        }`}
                      >
                        <span className="truncate">{doc.title}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-violet-500 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider hidden lg:inline-block">
            Active
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleGuideDrawer}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
            showGuideDrawer
              ? 'bg-violet-500/15 border-violet-500 text-violet-600 dark:text-violet-400'
              : 'bg-app-surface border-app-border text-app-muted hover:text-app-fg'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>💡 PM Guide</span>
        </button>
      </div>
    </div>
  )
}
