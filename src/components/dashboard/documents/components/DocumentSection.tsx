import { RefreshCw, FileText } from 'lucide-react'
import { DocumentTemplate, GeneratedDocument } from '@/lib/documents/actions'
import StructuredEditableField from './StructuredEditableField'
import WbsDictionaryResolver from '../resolvers/WbsDictionaryResolver'
import RaciMatrixResolver from '../resolvers/RaciMatrixResolver'
import ScheduleStatusResolver from '../resolvers/ScheduleStatusResolver'
import EvmStatusResolver from '../resolvers/EvmStatusResolver'
import TopRisksResolver from '../resolvers/TopRisksResolver'

interface DocumentSectionProps {
  section: any
  template: DocumentTemplate
  generatedDoc: GeneratedDocument | null
  projectId: string
  projectContext: any
  isSnapshot: boolean
  hasEditAccess: boolean
  freeText: Record<string, string>
  handleAutoFillSection: (section: any) => void
  handleFreeTextChange: (key: string, value: string) => void
}

export default function DocumentSection({
  section,
  template,
  generatedDoc,
  projectId,
  projectContext,
  isSnapshot,
  hasEditAccess,
  freeText,
  handleAutoFillSection,
  handleFreeTextChange
}: DocumentSectionProps) {
  const resolveDataBoundSource = (source?: string) => {
    if (!source) return '—'

    if (source.startsWith('project.')) {
      const field = source.split('.')[1]
      const projectValue = projectContext[field] || projectContext[field.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase())]

      if (!projectValue) return 'Not specified'

      if (field.includes('date')) {
        return new Date(projectValue).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      }

      return String(projectValue)
    }

    return `Unknown source: ${source}`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-app-border/60 pb-2">
        <h3 className="text-base font-bold text-app-fg">{section.title}</h3>
        <div className="flex items-center gap-2">
          {section.source && hasEditAccess && !isSnapshot && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleAutoFillSection(section)
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all cursor-pointer"
              title="Auto-fill content using live project data"
            >
              <RefreshCw className="w-3 h-3 text-indigo-500" /> Auto-fill from Project Data
            </button>
          )}
          {section.type === 'data_bound' && template.document_type !== 'charter' ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <RefreshCw className="w-3 h-3" /> Auto-populated
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FileText className="w-3 h-3" /> Free-text
            </span>
          )}
        </div>
      </div>

      {/* Data-Bound Section Rendering (non-charter documents) */}
      {section.type === 'data_bound' && template.document_type !== 'charter' && (
        <div className="py-2 pl-4 border-l-2 border-indigo-500/30 text-app-fg text-sm">
          {section.source === 'wbs.dictionary' || section.source === 'wbs.prototype' || section.source?.startsWith('wbs.') ? (
            <WbsDictionaryResolver projectId={projectId} />
          ) : section.source === 'raci.matrix' ? (
            <RaciMatrixResolver projectId={projectId} />
          ) : section.source === 'status.schedule' ? (
            <ScheduleStatusResolver projectId={projectId} periodEnd={new Date(isSnapshot ? (generatedDoc?.period_end || new Date()) : new Date())} frozenData={isSnapshot ? generatedDoc?.frozen_data?.schedule : undefined} />
          ) : section.source === 'status.cost' ? (
            <EvmStatusResolver projectId={projectId} periodEnd={new Date(isSnapshot ? (generatedDoc?.period_end || new Date()) : new Date())} frozenData={isSnapshot ? generatedDoc?.frozen_data?.cost : undefined} />
          ) : section.source === 'status.risks' ? (
            <TopRisksResolver projectId={projectId} periodEnd={new Date(isSnapshot ? (generatedDoc?.period_end || new Date()) : new Date())} frozenData={isSnapshot ? generatedDoc?.frozen_data?.risks : undefined} />
          ) : (
            <p className="font-medium">{resolveDataBoundSource(section.source)}</p>
          )}
        </div>
      )}

      {/* Free-Text & Hybrid Charter Section Rendering */}
      {(section.type === 'free_text' || template.document_type === 'charter') && (
        <div className="mt-2">
          <StructuredEditableField
            value={freeText[section.key] || ''}
            onChange={(val) => handleFreeTextChange(section.key, val)}
            title={section.title}
            hasEditAccess={hasEditAccess && !isSnapshot}
            isDataBound={section.type === 'data_bound'}
          />
        </div>
      )}
    </div>
  )
}
