'use client'

import { TicketThreadClient } from './TicketThreadClient'
import { MessageSquare, X, ExternalLink, Bell, Volume2, VolumeX, ChevronLeft, Building2, User } from 'lucide-react'
import Link from 'next/link'
import EnterpriseSelect from '../common/EnterpriseSelect'
import { useGlobalSupportWidget } from './hooks/useGlobalSupportWidget'

interface GlobalSupportWidgetProps {
  mode: 'admin' | 'tenant'
}

export function GlobalSupportWidget({ mode }: GlobalSupportWidgetProps) {
  const {
    isOpen, setIsOpen,
    userId,
    tickets,
    selectedTicket, setSelectedTicket,
    selectedMessages,
    loadingMessages,
    unreadCount, setUnreadCount,
    isMuted, setIsMuted,
    toastNotification, setToastNotification,
    statusFilter, setStatusFilter,
    priorityFilter, setPriorityFilter,
    handleSelectTicket,
    handleToastClick
  } = useGlobalSupportWidget(mode)

  return (
    <>
      {/* Floating Notification Toast above the chat icon */}
      {toastNotification && !isOpen && (
        <div 
          onClick={handleToastClick}
          className="fixed bottom-24 right-6 z-50 max-w-xs bg-app-card border border-violet-500/30 shadow-2xl rounded-2xl p-4 cursor-pointer hover:border-violet-500 transition-all animate-in fade-in slide-in-from-bottom-6 duration-300 group"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-violet-600 dark:text-violet-400">
              <Bell className="w-3.5 h-3.5 animate-bounce" />
              <span>{toastNotification.title}</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setToastNotification(null) }}
              className="text-app-muted hover:text-app-fg text-xs p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-app-fg line-clamp-2 font-medium bg-app-surface/50 p-2 rounded-lg border border-app-border mt-1">
            {toastNotification.body}
          </p>
          <div className="text-[10px] font-bold text-violet-500 mt-2 text-right opacity-80 group-hover:underline">
            Click to reply in Chat Head &rarr;
          </div>
        </div>
      )}

      {/* Expanded Chat Head Drawer Popover */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] md:w-[440px] h-[620px] max-h-[82vh] bg-app-card border border-app-border rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-app-border bg-gradient-to-r from-violet-900/40 via-app-surface to-app-surface flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-md font-black text-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-app-fg leading-tight">
                  {mode === 'admin' ? 'Support & Account Hub' : 'Live Customer Support'}
                </h3>
                <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Realtime Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? "Unmute Notifications" : "Mute Notifications"}
                className="p-1.5 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-lg transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-lg transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-app-surface/20">
            {selectedTicket ? (
              /* ACTIVE CHAT VIEW INSIDE DRAWER */
              <div className="flex flex-col h-full overflow-hidden min-h-0">
                <div className="p-3 border-b border-app-border bg-app-surface/60 flex items-center justify-between text-xs shrink-0">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="inline-flex items-center font-bold text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    All Conversations
                  </button>
                  <div className="font-extrabold truncate max-w-[180px] text-app-fg text-center">
                    {selectedTicket.subject}
                  </div>
                  <Link
                    href={mode === 'admin' ? `/backoffice/support/${selectedTicket.id}` : `/dashboard/support/${selectedTicket.id}`}
                    onClick={() => setIsOpen(false)}
                    title="Open full page screen"
                    className="inline-flex items-center font-bold text-app-muted hover:text-app-fg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>

                {loadingMessages ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-app-muted font-bold animate-pulse">
                    Loading conversation thread...
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
                    <TicketThreadClient
                      ticketId={selectedTicket.id}
                      messages={selectedMessages}
                      currentUserId={userId || ''}
                      viewType={mode}
                      isStaffReply={mode === 'admin'}
                      isClosed={selectedTicket.status === 'closed' || selectedTicket.status === 'resolved'}
                      customerHeaderName={`${selectedTicket.organizations?.name || 'Organization'}${selectedTicket.projects?.name ? ` (${selectedTicket.projects.name})` : ''}`}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* CONVERSATION LIST VIEW */
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-3 py-2 border-b border-app-border bg-app-surface/50 flex gap-2 shrink-0">
                  <div className="flex-1">
                    <EnterpriseSelect
                      value={statusFilter}
                      onChange={(val) => setStatusFilter(val)}
                      options={[
                        { value: 'all', label: 'All Status' },
                        { value: 'open', label: 'Open' },
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'waiting_on_customer', label: 'Waiting on Cust.' },
                        { value: 'resolved', label: 'Resolved' },
                        { value: 'closed', label: 'Closed' }
                      ]}
                      size="sm"
                    />
                  </div>
                  <div className="flex-1">
                    <EnterpriseSelect
                      value={priorityFilter}
                      onChange={(val) => setPriorityFilter(val)}
                      options={[
                        { value: 'all', label: 'All Priority' },
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' },
                        { value: 'urgent', label: 'Urgent' }
                      ]}
                      size="sm"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                {tickets.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <MessageSquare className="w-10 h-10 text-app-muted/40 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-app-fg mb-1">No Support Messages Yet</h4>
                    <p className="text-xs text-app-muted">
                      {mode === 'admin' 
                        ? 'When your assigned tenants log issues or reply, they will pop up here instantly.' 
                        : 'Log a new support ticket from your support console to start communicating with your Account Manager.'}
                    </p>
                    <Link
                      href={mode === 'admin' ? '/backoffice/support' : '/dashboard/support'}
                      onClick={() => setIsOpen(false)}
                      className="mt-4 inline-block px-4 py-2 bg-violet-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 rounded-xl font-bold text-xs hover:bg-violet-600/20 transition-all"
                    >
                      Open Support Console &rarr;
                    </Link>
                  </div>
                ) : (
                  tickets.map(t => {
                    const latest = t.latestMessage
                    const isUrgent = t.priority === 'urgent' || t.priority === 'high'
                    
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleSelectTicket(t)}
                        className="p-3.5 bg-app-card hover:bg-app-hover border border-app-border rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow group flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="font-black text-app-fg flex items-center gap-1.5 truncate">
                            {mode === 'admin' && (
                              <span className="bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-md text-[10px] font-extrabold border border-violet-500/20 shrink-0 flex items-center gap-1 max-w-[150px] truncate" title={`${t.organizations?.name || 'Tenant'}${t.projects?.name ? ` (${t.projects.name})` : ''}`}>
                                <Building2 className="w-3 h-3 shrink-0" />
                                <span className="truncate">{t.organizations?.name || 'Tenant'}{t.projects?.name ? ` (${t.projects.name})` : ''}</span>
                              </span>
                            )}
                            <span className="truncate">{t.subject}</span>
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                            t.status === 'resolved' || t.status === 'closed'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : isUrgent ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {t.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {latest && (
                          <div className="bg-app-surface/60 p-2.5 rounded-xl border border-app-border/60 text-xs text-app-muted flex items-start gap-2">
                            <User className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                            <div className="flex-1 overflow-hidden">
                              <span className="font-extrabold text-app-fg text-[11px] block truncate">
                                {latest.sender_name || (latest.is_staff_reply ? 'Account Manager' : 'Customer')}
                              </span>
                              <span className="line-clamp-1 text-[11px] font-medium opacity-90">
                                {latest.message}
                              </span>
                            </div>
                            {latest.created_at && (
                              <span className="text-[9px] opacity-60 shrink-0 mt-0.5 font-mono">
                                {new Date(latest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-app-muted pt-1 border-t border-app-border/30">
                          <span>{t.messageCount || 1} messages in thread</span>
                          <span className="font-bold text-violet-600 dark:text-violet-400 group-hover:underline flex items-center gap-1">
                            Reply in Chat &rarr;
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-3 border-t border-app-border bg-app-surface flex items-center justify-between text-xs shrink-0">
            <Link
              href={mode === 'admin' ? '/backoffice/support' : '/dashboard/support'}
              onClick={() => setIsOpen(false)}
              className="font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1.5"
            >
              <span>Open full {mode === 'admin' ? 'Backoffice' : 'Dashboard'} Support Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Floating Chat Button (Bottom Right) */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setUnreadCount(0)
        }}
        title="Support Conversations & Live Chat"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 via-violet-500 to-violet-600 text-white shadow-xl hover:shadow-violet-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center group border border-white/20 cursor-pointer"
      >
        <MessageSquare className="w-6 h-6 transform group-hover:rotate-12 transition-transform" />
        
        {/* Glowing unread notification counter badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-xs min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center border-2 border-app-card animate-bounce shadow-lg">
            {unreadCount}
          </span>
        )}

        {/* Pulsing online green indicator */}
        <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-app-card" />
      </button>
    </>
  )
}
