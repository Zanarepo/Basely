'use client'

import { useState, useTransition } from 'react'
import { FileText, Plus, FileSearch, Trash2, Pencil } from 'lucide-react'
import { BusinessCase, FeasibilityStudy, deleteBusinessCase, deleteFeasibilityStudy, updateBusinessCase, updateFeasibilityStudy } from '@/lib/initiation/actions'
import { BusinessCaseModal } from './BusinessCaseModal'
import { FeasibilityStudyModal } from './FeasibilityStudyModal'
import { InitiationDocumentViewer } from './InitiationDocumentViewer'
import { ToastContainer, type ToastMessage } from '../Toast'

interface InitiationWorkspaceProps {
  organizationId: string
  businessCases: BusinessCase[]
  feasibilityStudies: FeasibilityStudy[]
  callerUserId: string
  isOwner: boolean
  callerRole: string
  projects: any[] // to allow linking later
}

export default function InitiationWorkspace({
  organizationId,
  businessCases,
  feasibilityStudies,
  callerUserId,
  isOwner,
  callerRole,
  projects
}: InitiationWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'business_cases' | 'feasibility_studies'>('business_cases')
  const [bcModalOpen, setBcModalOpen] = useState(false)
  const [fsModalOpen, setFsModalOpen] = useState(false)
  const [selectedBc, setSelectedBc] = useState<BusinessCase | null>(null)
  const [selectedFs, setSelectedFs] = useState<FeasibilityStudy | null>(null)
  
  const [viewerDocType, setViewerDocType] = useState<'business_case' | 'feasibility_study' | null>(null)
  const [viewerEntityId, setViewerEntityId] = useState<string | null>(null)

  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [isPending, startTransition] = useTransition()

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const handleDeleteBc = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Business Case?')) return
    startTransition(async () => {
      const res = await deleteBusinessCase(id)
      if (res.ok) {
        showToast('success', 'Business Case deleted')
      } else {
        showToast('error', res.error || 'Failed to delete')
      }
    })
  }

  const handleDeleteFs = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Feasibility Study?')) return
    startTransition(async () => {
      const res = await deleteFeasibilityStudy(id)
      if (res.ok) {
        showToast('success', 'Feasibility Study deleted')
      } else {
        showToast('error', res.error || 'Failed to delete')
      }
    })
  }

  const handleLinkBcToProject = (bcId: string, projectId: string) => {
    startTransition(async () => {
      const res = await updateBusinessCase(bcId, { project_id: projectId || null })
      if (res.ok) {
        showToast('success', projectId ? 'Linked to project' : 'Unlinked from project')
      } else {
        showToast('error', res.error || 'Failed to link')
      }
    })
  }

  const handleLinkFsToProject = (fsId: string, projectId: string) => {
    startTransition(async () => {
      const res = await updateFeasibilityStudy(fsId, { project_id: projectId || null })
      if (res.ok) {
        showToast('success', projectId ? 'Linked to project' : 'Unlinked from project')
      } else {
        showToast('error', res.error || 'Failed to link')
      }
    })
  }

  const isAdminOrPM = isOwner || callerRole === 'Admin' || callerRole === 'PM'

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="flex border-b border-app-border mb-4">
        <button
          onClick={() => setActiveTab('business_cases')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'business_cases'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-app-muted hover:text-app-fg'
          }`}
        >
          Business Cases
        </button>
        <button
          onClick={() => setActiveTab('feasibility_studies')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'feasibility_studies'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-app-muted hover:text-app-fg'
          }`}
        >
          Feasibility Studies
        </button>
      </div>

      {activeTab === 'business_cases' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-app-muted">
              Pre-project documents used to justify why a project should happen.
            </p>
            {isAdminOrPM && (
              <button
                onClick={() => { setSelectedBc(null); setBcModalOpen(true); }}
                className="btn-primary px-4 py-2 text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Business Case
              </button>
            )}
          </div>
          
          {businessCases.length === 0 ? (
            <div className="bg-app-surface border border-app-border rounded-xl p-8 text-center flex flex-col items-center">
              <FileText className="w-8 h-8 text-app-muted mb-3" />
              <p className="text-app-fg font-medium">No Business Cases found</p>
              <p className="text-sm text-app-muted mt-1">Create one to justify a new project idea.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businessCases.map(bc => (
                <div key={bc.id} className="bg-app-surface border border-app-border rounded-xl p-5 hover:border-indigo-500/50 transition-colors shadow-sm flex flex-col group">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-app-fg text-lg">{bc.name}</h3>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setViewerEntityId(bc.id); setViewerDocType('business_case'); }} className="text-app-muted hover:text-indigo-500 transition-colors p-1 cursor-pointer" title="View Document">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setSelectedBc(bc); setBcModalOpen(true); }} className="text-app-muted hover:text-indigo-500 transition-colors p-1 cursor-pointer" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteBc(bc.id)} className="text-app-muted hover:text-rose-500 transition-colors p-1 cursor-pointer" disabled={isPending} title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {bc.project_id ? (
                    <span className="inline-flex self-start text-[10px] font-bold px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md mb-3 border border-emerald-500/20">
                      Linked to Project
                    </span>
                  ) : (
                    <span className="inline-flex self-start text-[10px] font-bold px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md mb-3 border border-amber-500/20">
                      Unlinked Idea
                    </span>
                  )}
                  
                  <p className="text-sm text-app-muted line-clamp-3 mb-4 flex-1">
                    {bc.problem_statement || 'No problem statement provided.'}
                  </p>
                  
                  
                  <div className="flex justify-between text-xs text-app-muted mt-auto pt-3 border-t border-app-border items-center">
                    <div className="flex flex-col gap-1">
                      <span>Cost: {bc.estimated_cost ? `$${bc.estimated_cost.toLocaleString()}` : 'N/A'}</span>
                      <span>Benefit: {bc.estimated_benefit || 'N/A'}</span>
                    </div>
                    {isAdminOrPM && (
                      <select 
                        className="auth-input text-xs py-1 px-2 h-auto" 
                        value={bc.project_id || ''}
                        onChange={(e) => handleLinkBcToProject(bc.id, e.target.value)}
                        disabled={isPending}
                      >
                        <option value="">-- Link Project --</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'feasibility_studies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-app-muted">
              Pre-project documents to evaluate technical, financial, and operational viability.
            </p>
            {isAdminOrPM && (
              <button
                onClick={() => { setSelectedFs(null); setFsModalOpen(true); }}
                className="btn-primary px-4 py-2 text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Feasibility Study
              </button>
            )}
          </div>
          
          {feasibilityStudies.length === 0 ? (
            <div className="bg-app-surface border border-app-border rounded-xl p-8 text-center flex flex-col items-center">
              <FileSearch className="w-8 h-8 text-app-muted mb-3" />
              <p className="text-app-fg font-medium">No Feasibility Studies found</p>
              <p className="text-sm text-app-muted mt-1">Create one to evaluate project viability.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feasibilityStudies.map(fs => (
                <div key={fs.id} className="bg-app-surface border border-app-border rounded-xl p-5 hover:border-indigo-500/50 transition-colors shadow-sm flex flex-col group">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-app-fg text-lg">{fs.name}</h3>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setViewerEntityId(fs.id); setViewerDocType('feasibility_study'); }} className="text-app-muted hover:text-indigo-500 transition-colors p-1 cursor-pointer" title="View Document">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setSelectedFs(fs); setFsModalOpen(true); }} className="text-app-muted hover:text-indigo-500 transition-colors p-1 cursor-pointer" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteFs(fs.id)} className="text-app-muted hover:text-rose-500 transition-colors p-1 cursor-pointer" disabled={isPending} title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-3">
                    {fs.project_id && (
                      <span className="inline-flex text-[10px] font-bold px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/20">
                        Linked to Project
                      </span>
                    )}
                    {fs.business_case_id && (
                      <span className="inline-flex text-[10px] font-bold px-2 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-500/20">
                        Linked to Business Case
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-app-muted line-clamp-3 mb-4 flex-1">
                    {fs.overall_recommendation || 'No recommendation provided.'}
                  </p>

                  <div className="flex justify-between text-xs text-app-muted mt-auto pt-3 border-t border-app-border items-center">
                    <span></span>
                    {isAdminOrPM && (
                      <select 
                        className="auth-input text-xs py-1 px-2 h-auto" 
                        value={fs.project_id || ''}
                        onChange={(e) => handleLinkFsToProject(fs.id, e.target.value)}
                        disabled={isPending}
                      >
                        <option value="">-- Link Project --</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals will be created next */}
      {bcModalOpen && (
        <BusinessCaseModal 
          open={bcModalOpen} 
          onClose={() => setBcModalOpen(false)} 
          organizationId={organizationId} 
          callerUserId={callerUserId} 
          initialData={selectedBc} 
          onShowToast={showToast}
        />
      )}
      
      {fsModalOpen && (
        <FeasibilityStudyModal 
          open={fsModalOpen} 
          onClose={() => setFsModalOpen(false)} 
          organizationId={organizationId} 
          callerUserId={callerUserId} 
          initialData={selectedFs} 
          businessCases={businessCases}
          onShowToast={showToast}
        />
      )}

      {viewerDocType && viewerEntityId && (
        <InitiationDocumentViewer
          entityId={viewerEntityId}
          documentType={viewerDocType}
          onClose={() => { setViewerEntityId(null); setViewerDocType(null); }}
          onShowToast={showToast}
        />
      )}
    </div>
  )
}
