'use client'

import { useState, useEffect } from 'react'
import { Blocks, X, ArrowLeft, MessageSquare, Plus, CheckCircle2 } from 'lucide-react'
import ProjectSlackSettings from './ProjectSlackSettings'
import { createClient } from '@/utils/supabase/client'

const SlackIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    className={className} 
    fill="currentColor"
  >
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
  </svg>
)

export function ProjectIntegrationsMenu({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<'slack' | null>(null)
  const [isSlackConfigured, setIsSlackConfigured] = useState(false)

  useEffect(() => {
    if (!isOpen || selectedApp !== null) return
    const checkSlackConfig = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('projects')
        .select('slack_webhook_url')
        .eq('id', projectId)
        .single()
      
      setIsSlackConfigured(!!data?.slack_webhook_url)
    }
    checkSlackConfig()
  }, [isOpen, selectedApp, projectId])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-app-surface text-app-fg border border-app-border rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-app-hover transition-colors font-medium text-sm"
      >
        <Blocks className="h-4 w-4 text-indigo-500" />
        <span className="hidden sm:inline">Integrations</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a1b23] rounded-xl shadow-2xl w-full max-w-2xl border border-app-border overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-app-border">
              <div className="flex items-center gap-3">
                {selectedApp ? (
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="p-2 -ml-2 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-full transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                ) : (
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                    <Blocks className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-app-fg">
                    {selectedApp === 'slack' ? 'Configure Slack' : 'Project Integrations'}
                  </h2>
                  <p className="text-sm text-app-muted mt-1">
                    {selectedApp === 'slack' 
                      ? 'Set up notifications for this project' 
                      : 'Connect third-party apps to this project'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setTimeout(() => setSelectedApp(null), 200)
                }}
                className="p-2 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!selectedApp ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Slack Integration Card */}
                  <div 
                    onClick={() => setSelectedApp('slack')}
                    className="group relative flex flex-col items-center text-center p-6 bg-white dark:bg-app-surface border border-app-border rounded-xl cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
                  >
                    {isSlackConfigured && (
                      <div className="absolute top-3 right-3 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 p-1 rounded-full" title="Integration Configured">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                    <div className="h-12 w-12 rounded-xl bg-[#E01E5A]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <SlackIcon className="h-6 w-6 text-[#E01E5A]" />
                    </div>
                    <h3 className="text-base font-bold text-app-fg mb-1">Slack</h3>
                    <p className="text-xs text-app-muted mb-4">Send notifications to a specific channel</p>
                    <div className={`mt-auto px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      isSlackConfigured 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-app-hover text-app-muted group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-500/20 dark:group-hover:text-indigo-400'
                    }`}>
                      {isSlackConfigured ? 'Configured' : 'Configure'}
                    </div>
                  </div>

                  {/* Placeholder for future integrations */}
                  <div className="flex flex-col items-center text-center justify-center p-6 border border-dashed border-app-border rounded-xl opacity-60">
                    <div className="h-12 w-12 rounded-xl bg-gray-50 dark:bg-app-hover flex items-center justify-center mb-4">
                      <Plus className="h-6 w-6 text-app-muted" />
                    </div>
                    <h3 className="text-base font-bold text-app-fg mb-1">More apps</h3>
                    <p className="text-xs text-app-muted">Coming soon</p>
                  </div>
                </div>
              ) : (
                <ProjectSlackSettings projectId={projectId} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
