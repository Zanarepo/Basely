import React from 'react'
import { Calendar as CalendarIcon, Users, Check } from 'lucide-react'

interface MeetingMinutesGeneralDetailsProps {
  hasEditAccess: boolean
  meetingDate: string
  setMeetingDate: (val: string) => void
  attendees: string[]
  stakeholders: any[]
  toggleAttendee: (id: string) => void
}

export function MeetingMinutesGeneralDetails({
  hasEditAccess,
  meetingDate,
  setMeetingDate,
  attendees,
  stakeholders,
  toggleAttendee
}: MeetingMinutesGeneralDetailsProps) {
  return (
    <section className="bg-white dark:bg-app-card border border-app-border rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-app-border bg-gray-50/50 dark:bg-app-bg/50">
        <h3 className="font-bold text-sm text-app-fg flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-violet-500" /> General Details
        </h3>
      </div>
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Date Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-app-muted">
            Date & Time
          </label>
          <input
            type="datetime-local"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            disabled={!hasEditAccess}
            className="bg-app-bg border border-app-border rounded-lg px-4 py-2.5 text-sm font-medium text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-inner"
          />
        </div>

        {/* Enhanced Attendees List */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-app-muted flex items-center justify-between">
            <span>Attendees</span>
            <span className="bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">
              {attendees.length} selected
            </span>
          </label>
          
          <div className="border border-app-border rounded-lg bg-app-bg overflow-hidden flex flex-col h-48 shadow-inner">
            {stakeholders.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-app-muted">
                <Users className="w-6 h-6 mb-2 opacity-50" />
                <span className="text-xs font-medium">No stakeholders available.</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {stakeholders.map(s => {
                  const isSelected = attendees.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleAttendee(s.id)}
                      className={`flex items-center gap-4 px-4 py-3 border-b last:border-0 border-app-border transition-colors ${
                        hasEditAccess ? 'cursor-pointer hover:bg-app-hover' : ''
                      } ${isSelected ? 'bg-violet-500/5 dark:bg-violet-500/10' : ''}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        isSelected 
                          ? 'bg-violet-500 border-violet-500 text-white' 
                          : 'bg-white dark:bg-app-card border-app-border'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-sm font-semibold truncate ${isSelected ? 'text-violet-600 dark:text-violet-400' : 'text-app-fg'}`}>
                          {s.name}
                        </span>
                        <span className="text-xs text-app-muted truncate font-medium">
                          {s.role_title || 'No specified role'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  )
}
