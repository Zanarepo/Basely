'use client'

import { useState, useEffect } from 'react'
import { Blocks, X, ArrowLeft, CheckCircle2, Calendar, Database, Lock } from 'lucide-react'
import ProjectSlackSettings from './ProjectSlackSettings'
import ProjectTeamsSettings from './ProjectTeamsSettings'
import ProjectGoogleChatSettings from './ProjectGoogleChatSettings'
import CalendarSyncSettings from '@/components/dashboard/integrations/CalendarSyncSettings'
import { ErpIntegrationContainer } from '@/components/dashboard/settings/integrations/ErpIntegrationContainer'
import { createClient } from '@/utils/supabase/client'
import { useWorkspace } from '@/components/dashboard/WorkspaceContext'
import { useWorkspaceTier } from '@/hooks/use-workspace-tier'
import { FeatureGateScreen } from '@/components/dashboard/billing'

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

const TeamsIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    className={className} 
    fill="currentColor"
  >
    <path d="M12.5 12a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0zm-2 0a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm7 4.5c0-1.83-3.17-2.5-4.5-2.5s-4.5.67-4.5 2.5v1.5h9v-1.5zm-7-4.5c0-2.48-2.02-4.5-4.5-4.5S1.5 7.52 1.5 10c0 1.83 3.17 2.5 4.5 2.5s4.5-.67 4.5-2.5z"/>
  </svg>
)

const GoogleChatIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    className={className} 
    fill="currentColor"
  >
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
  </svg>
)

export function ProjectIntegrationsMenu({ projectId }: { projectId: string }) {
  const { activeWorkspace } = useWorkspace()
  const { tier } = useWorkspaceTier(activeWorkspace?.id)
  const isAdminOrOwner = activeWorkspace?.role === 'Admin' || activeWorkspace?.role === 'Owner'
  const isEnterprise = tier === 'enterprise'
  const isGated = !isEnterprise  // Enterprise-only per feature schema
  const [isOpen, setIsOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<'slack' | 'teams' | 'google_chat' | 'calendar' | 'erp' | null>(null)
  const [isSlackConfigured, setIsSlackConfigured] = useState(false)
  const [isTeamsConfigured, setIsTeamsConfigured] = useState(false)
  const [isGoogleChatConfigured, setIsGoogleChatConfigured] = useState(false)
  const [isCalendarConfigured, setIsCalendarConfigured] = useState(false)

  useEffect(() => {
    if (!isOpen || selectedApp !== null) return
    const checkConfigs = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
      
      const project = data as Record<string, unknown> | null
      setIsSlackConfigured(!!project?.slack_webhook_url)
      setIsTeamsConfigured(!!project?.teams_webhook_url)
      setIsGoogleChatConfigured(!!project?.google_chat_webhook_url)
      
      const { data: calendarData } = await supabase
        .from('calendar_connections')
        .select('synced_project_ids')
        .eq('provider', 'google')
        .maybeSingle()
        
      if (calendarData && (calendarData.synced_project_ids || []).includes(projectId)) {
        setIsCalendarConfigured(true)
      } else {
        setIsCalendarConfigured(false)
      }
    }
    checkConfigs()
  }, [isOpen, selectedApp, projectId])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{ cursor: 'pointer' }}
        className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-app-surface text-app-fg border border-app-border rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-app-hover transition-colors font-medium text-sm cursor-pointer"
      >
        {isGated ? <Lock className="h-4 w-4 text-purple-500" /> : <Blocks className="h-4 w-4 text-indigo-500" />}
        <span className="hidden sm:inline">Integrations</span>
        {isGated && (
          <span className="bg-purple-500/15 text-purple-500 border border-purple-500/30 px-1.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">
            Enterprise
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`bg-white dark:bg-[#1a1b23] rounded-xl shadow-2xl w-full ${selectedApp === 'erp' ? 'max-w-3xl' : 'max-w-2xl'} border border-app-border overflow-hidden flex flex-col max-h-[88vh] transition-all duration-300`}>
            {isGated ? (
              /* Enterprise-only gate: show lock screen inside the modal shell */
              <>
                <div className="flex items-center justify-between p-5 border-b border-app-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
                      <Lock className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-app-fg">Project Integrations</h2>
                      <p className="text-sm text-app-muted mt-0.5">Enterprise feature — upgrade to connect third-party apps</p>
                    </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} style={{ cursor: 'pointer' }} className="p-2 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-full transition-colors cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="overflow-y-auto p-4">
                  <FeatureGateScreen
                    featureName="Project Integrations"
                    requiredTier="enterprise"
                    description="Connect Slack, MS Teams, Google Chat, Google Calendar, and ERP accounting suites to sync project milestones and notifications. Available on the Enterprise plan."
                    canUpgrade={isAdminOrOwner}
                  />
                </div>
              </>
            ) : (
            <>
            <div className="flex items-center justify-between p-6 border-b border-app-border flex-shrink-0">
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
                    {selectedApp === 'slack' 
                      ? 'Configure Slack' 
                      : selectedApp === 'teams' 
                        ? 'Configure Teams' 
                        : selectedApp === 'google_chat'
                          ? 'Configure Google Chat'
                          : selectedApp === 'calendar'
                            ? 'Google Calendar Sync'
                            : selectedApp === 'erp'
                              ? 'ERP & Financial Ledgers'
                              : 'Project Integrations'}
                  </h2>
                  <p className="text-sm text-app-muted mt-1">
                    {selectedApp === 'erp'
                      ? 'Connect live enterprise accounting suites or run simulated test audits'
                      : selectedApp 
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {isAdminOrOwner && (
                    <>
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

                  {/* Microsoft Teams Integration Card */}
                  <div 
                    onClick={() => setSelectedApp('teams')}
                    className="group relative flex flex-col items-center text-center p-6 bg-white dark:bg-app-surface border border-app-border rounded-xl cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
                  >
                    {isTeamsConfigured && (
                      <div className="absolute top-3 right-3 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 p-1 rounded-full" title="Integration Configured">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                    <div className="h-12 w-12 rounded-xl bg-[#6264A7]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <TeamsIcon className="h-6 w-6 text-[#6264A7]" />
                    </div>
                    <h3 className="text-base font-bold text-app-fg mb-1">MS Teams</h3>
                    <p className="text-xs text-app-muted mb-4">Send notifications to Teams channels</p>
                    <div className={`mt-auto px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      isTeamsConfigured 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-app-hover text-app-muted group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-500/20 dark:group-hover:text-indigo-400'
                    }`}>
                      {isTeamsConfigured ? 'Configured' : 'Configure'}
                    </div>
                  </div>

                  {/* Google Chat Integration Card */}
                  <div 
                    onClick={() => setSelectedApp('google_chat')}
                    className="group relative flex flex-col items-center text-center p-6 bg-white dark:bg-app-surface border border-app-border rounded-xl cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
                  >
                    {isGoogleChatConfigured && (
                      <div className="absolute top-3 right-3 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 p-1 rounded-full" title="Integration Configured">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                    <div className="h-12 w-12 rounded-xl bg-[#0f9d58]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <GoogleChatIcon className="h-6 w-6 text-[#0f9d58]" />
                    </div>
                    <h3 className="text-base font-bold text-app-fg mb-1">Google Chat</h3>
                    <p className="text-xs text-app-muted mb-4">Send notifications to Google Chat spaces</p>
                    <div className={`mt-auto px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      isGoogleChatConfigured 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-app-hover text-app-muted group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-500/20 dark:group-hover:text-indigo-400'
                    }`}>
                      {isGoogleChatConfigured ? 'Configured' : 'Configure'}
                    </div>
                  </div>
                    </>
                  )}
                  
                  {/* Google Calendar Card */}
                  <div 
                    onClick={() => setSelectedApp('calendar')}
                    className="group relative flex flex-col items-center text-center p-6 bg-white dark:bg-app-surface border border-app-border rounded-xl cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
                  >
                    {isCalendarConfigured && (
                      <div className="absolute top-3 right-3 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 p-1 rounded-full" title="Integration Configured">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Calendar className="h-6 w-6 text-blue-500" />
                    </div>
                    <h3 className="text-base font-bold text-app-fg mb-1">Google Calendar</h3>
                    <p className="text-xs text-app-muted mb-4">Sync project milestones to your calendar</p>
                    <div className={`mt-auto px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      isCalendarConfigured 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-app-hover text-app-muted group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-500/20 dark:group-hover:text-indigo-400'
                    }`}>
                      {isCalendarConfigured ? 'Configured' : 'Configure'}
                    </div>
                  </div>

                  {/* ERP / Accounting Integration Card */}
                  <div 
                    onClick={() => setSelectedApp('erp')}
                    className="group relative flex flex-col items-center text-center p-6 bg-white dark:bg-app-surface border border-app-border rounded-xl cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
                  >
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Database className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h3 className="text-base font-bold text-app-fg mb-1">ERP & Accounting</h3>
                    <p className="text-xs text-app-muted mb-4">Connect QuickBooks, NetSuite, SAP, and Xero ledgers</p>
                    <div className="mt-auto px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-app-hover text-app-muted group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-500/20 dark:group-hover:text-indigo-400 transition-colors">
                      Configure
                    </div>
                  </div>
                </div>
              ) : selectedApp === 'slack' ? (
                <ProjectSlackSettings projectId={projectId} />
              ) : selectedApp === 'teams' ? (
                <ProjectTeamsSettings projectId={projectId} />
              ) : selectedApp === 'google_chat' ? (
                <ProjectGoogleChatSettings projectId={projectId} />
              ) : selectedApp === 'calendar' ? (
                <CalendarSyncSettings projectId={projectId} />
              ) : (
                <ErpIntegrationContainer />
              )}
            </div>
            </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
