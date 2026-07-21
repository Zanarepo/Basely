import { useState, useEffect } from 'react'
import { AlertCircle, AlertTriangle, CheckSquare, ExternalLink, X, FileText, Users, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface EntityPreviewModalProps {
  type: string
  id: string
  projectId?: string
  onClose: () => void
}

export function EntityPreviewModal({ type, id, projectId, onClose }: EntityPreviewModalProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      if (!id) return
      setLoading(true)
      const supabase = createClient()
      
      try {
        if (type === 'wbs') {
          const { data } = await supabase.from('wbs_elements').select('*').eq('id', id).single()
          setData(data)
        } else if (type === 'risk') {
          const { data } = await supabase.from('risks').select('*').eq('id', id).single()
          setData(data)
        } else if (type === 'issue') {
          const { data } = await supabase.from('issues').select('*').eq('id', id).single()
          setData(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    const staticPages = ['stakeholders', 'raci', 'charter', 'gantt', 'cost_estimation', 'cost_resources', 'cost_timephasing', 'cost_baselines', 'cost_actuals', 'wbs_board', 'wbs_grid', 'wbs_unassigned']
    
    if (!staticPages.includes(type)) {
      fetchData()
    } else {
      const labels: Record<string, string> = {
        stakeholders: 'Stakeholder Register',
        raci: 'RACI Matrix',
        charter: 'Project Charter',
        gantt: 'Gantt & Scheduling',
        cost_estimation: 'Cost Estimations',
        cost_resources: 'Resource Rates',
        cost_timephasing: 'Time-Phased (S-Curve)',
        cost_baselines: 'Cost Baselines',
        cost_actuals: 'Cost Actuals',
        wbs_board: 'WBS Board',
        wbs_grid: 'WBS Grid',
        wbs_unassigned: 'Unassigned Work',
      }
      setData({
        title: labels[type] || type,
        description: `Navigate to the ${labels[type] || type} page for this project.`
      })
      setLoading(false)
    }
  }, [id, type])

  const navigateToDashboard = () => {
    if (!projectId) return
    setIsNavigating(true)

    let url = ''
    if (type === 'wbs') url = `/dashboard/projects/${projectId}?tab=wbs&elementId=${id}`
    if (type === 'wbs_board') url = `/dashboard/projects/${projectId}?tab=wbs&wbsView=board`
    if (type === 'wbs_grid') url = `/dashboard/projects/${projectId}?tab=wbs&wbsView=grid`
    if (type === 'wbs_unassigned') url = `/dashboard/projects/${projectId}?tab=wbs&wbsView=unassigned`
    if (type === 'risk') url = `/dashboard/projects/${projectId}?tab=risks&riskId=${id}`
    if (type === 'issue') url = `/dashboard/projects/${projectId}?tab=risks&issueId=${id}`
    if (type === 'stakeholders') url = `/dashboard/projects/${projectId}?tab=stakeholders`
    if (type === 'raci') url = `/dashboard/projects/${projectId}?tab=documents&doc=raci`
    if (type === 'charter') url = `/dashboard/projects/${projectId}?tab=documents&doc=charter`
    if (type === 'gantt') url = `/dashboard/projects/${projectId}?tab=gantt`
    if (type === 'cost_estimation') url = `/dashboard/projects/${projectId}?tab=cost&costView=estimation`
    if (type === 'cost_resources') url = `/dashboard/projects/${projectId}?tab=cost&costView=resources`
    if (type === 'cost_timephasing') url = `/dashboard/projects/${projectId}?tab=cost&costView=timephasing`
    if (type === 'cost_baselines') url = `/dashboard/projects/${projectId}?tab=cost&costView=baselines`
    if (type === 'cost_actuals') url = `/dashboard/projects/${projectId}?tab=cost&costView=actuals`

    router.push(url)
    setTimeout(() => onClose(), 1500)
  }

  const getHeaderIcon = () => {
    if (type === 'risk') return <AlertTriangle className="w-4 h-4 text-orange-500" />
    if (type === 'issue') return <AlertCircle className="w-4 h-4 text-red-500" />
    if (type === 'charter' || type === 'raci') return <FileText className="w-4 h-4 text-blue-500" />
    if (type === 'stakeholders') return <Users className="w-4 h-4 text-emerald-500" />
    if (type.startsWith('cost_') || type === 'gantt') return <FileText className="w-4 h-4 text-blue-500" />
    if (type === 'wbs_unassigned') return <CheckSquare className="w-4 h-4 text-amber-500" />
    return <CheckSquare className="w-4 h-4 text-indigo-500" />
  }

  const getLabel = () => {
    const labels: Record<string, string> = {
      wbs: 'Task', stakeholders: 'Register', raci: 'RACI', charter: 'Charter',
      gantt: 'Gantt', cost_estimation: 'Estimations', cost_resources: 'Resources',
      cost_timephasing: 'S-Curve', cost_baselines: 'Baselines', cost_actuals: 'Actuals',
      wbs_board: 'Board', wbs_grid: 'Grid', wbs_unassigned: 'Unassigned',
    }
    return labels[type] || type
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-app-bg/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-app-surface border border-app-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-app-border bg-app-surface-solid">
          <div className="flex items-center gap-2">
            {getHeaderIcon()}
            <span className="font-semibold text-app-fg capitalize">{getLabel()} Details</span>
          </div>
          <button onClick={onClose} className="p-1 text-app-muted hover:text-app-fg rounded-md transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-app-fg leading-snug">{data.title || data.name}</h3>
                {data.status && (
                  <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-app-muted-surface text-app-muted rounded-full">
                    Status: {data.status}
                  </span>
                )}
              </div>
              
              <div className="text-sm text-app-muted whitespace-pre-wrap">
                {data.description || 'No description provided.'}
              </div>

              {type === 'risk' && data.probability && (
                <div className="flex gap-4 pt-2 text-sm">
                  <div><span className="text-app-muted">Probability:</span> <span className="font-medium text-app-fg">{data.probability}/5</span></div>
                  <div><span className="text-app-muted">Impact:</span> <span className="font-medium text-app-fg">{data.impact}/5</span></div>
                  <div><span className="text-app-muted">Score:</span> <span className="font-bold text-red-400">{data.probability * data.impact}</span></div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-app-muted py-8">
              Could not find {type} details. It may have been deleted.
            </div>
          )}
        </div>
        
        {/* Footer Navigation */}
        <div className="p-4 border-t border-app-border bg-app-surface-solid flex justify-end">
          <button 
            type="button" 
            onClick={navigateToDashboard}
            disabled={isNavigating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {isNavigating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Navigating...
              </>
            ) : (
              <>
                Go to {getLabel()} Dashboard
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
