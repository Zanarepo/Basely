'use client'

import Link from 'next/link'


import {
  Workflow,
  CalendarRange,
  Clock,
  Edit2,
  Archive,
  Trash2,
  RotateCcw,
  Users,
  UserPlus,
} from 'lucide-react'

type ProjectType = {
  id: string
  name: string
  clientName: string | null
  description: string | null
  methodology: 'Waterfall' | 'Agile' | 'Hybrid'
  startDate: string | null
  endDate: string | null
  isArchived: boolean
  assignedMembers: string[]
  calendarConfig: {
    working_days: number[]
    daily_hours: number
  }
}

type WorkspaceMember = {
  userId: string
  name: string
  role: string
}

type ProjectCardProps = {
  project: ProjectType
  workspaceMembers: WorkspaceMember[]
  isViewer: boolean
  hasEditAccess: boolean
  hasManageAccess: boolean
  hasDeleteAccess: boolean
  isPending: boolean
  onEdit: () => void
  onArchive: () => void
  onRestore: () => void
  onDelete: () => void
  onManageTeam: () => void
  formatDate: (dateStr: string | null) => string
}

function getMethodologyBadgeColor(methodology: string) {
  switch (methodology) {
    case 'Waterfall':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25'
    case 'Agile':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
    case 'Hybrid':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25'
    default:
      return 'bg-app-surface text-app-fg border-app-border'
  }
}

export function ProjectCard({
  project,
  workspaceMembers,
  isViewer,
  hasEditAccess,
  hasManageAccess,
  hasDeleteAccess,
  isPending,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onManageTeam,
  formatDate,
}: ProjectCardProps) {
  const hasAnyAction = hasEditAccess || hasManageAccess || hasDeleteAccess
  const showManageTeam = hasManageAccess && !project.isArchived

  return (
    <article
      className={`crud-card group ${project.isArchived ? 'opacity-85' : ''}`}
    >
      {/* Header: title, badges, actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-app-fg truncate hover:text-indigo-500 transition-colors">
              <Link href={`/dashboard/projects/${project.id}`}>
                {project.name}
              </Link>
            </h3>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${getMethodologyBadgeColor(
                project.methodology
              )}`}
            >
              <Workflow className="h-3 w-3" />
              {project.methodology}
            </span>
            {project.isArchived && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-500 border border-amber-500/25">
                Archived
              </span>
            )}
            {isViewer && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-app-surface-solid text-app-muted border border-app-border">
                View only
              </span>
            )}
          </div>
        </div>

        {hasAnyAction && (
          <div className="flex items-center gap-1.5 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
            {hasEditAccess && !project.isArchived && (
              <button
                type="button"
                title="Edit project"
                onClick={onEdit}
                disabled={isPending}
                className="btn-icon"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}

            {hasManageAccess && (
              project.isArchived ? (
                <button
                  type="button"
                  title="Restore project"
                  onClick={onRestore}
                  disabled={isPending}
                  className="btn-icon-success"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  title="Archive project"
                  onClick={onArchive}
                  disabled={isPending}
                  className="btn-icon-warning"
                >
                  <Archive className="h-4 w-4" />
                </button>
              )
            )}

            {hasDeleteAccess && (
              <button
                type="button"
                title="Delete project"
                onClick={onDelete}
                disabled={isPending}
                className="btn-icon-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Metadata: always render for consistent card height */}
      <div className="space-y-1">
        <p className="text-sm text-app-muted truncate">
          Client: {project.clientName || '—'}
        </p>
        <p className="text-sm text-app-muted line-clamp-2 leading-relaxed min-h-[1.25rem]">
          {project.description || (
            <span className="text-app-subtle italic">No description</span>
          )}
        </p>
      </div>

      {/* Schedule */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-app-muted">
        <span className="inline-flex items-center gap-1.5">
          <CalendarRange className="h-3.5 w-3.5 text-slate-500 dark:text-app-subtle" />
          {formatDate(project.startDate)} – {formatDate(project.endDate)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-500 dark:text-app-subtle" />
          {project.calendarConfig.working_days.length} working days/wk ·{' '}
          {project.calendarConfig.daily_hours}h/day
        </span>
      </div>

      {/* Team section */}
      <div className="pt-3 border-t border-app-border">
        <div className="flex items-center justify-between gap-3 mb-2 min-h-[28px]">
          <span className="text-sm font-medium text-app-muted inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            Assigned team ({project.assignedMembers.length})
          </span>

          {showManageTeam ? (
            <button
              type="button"
              onClick={onManageTeam}
              className="btn-ghost-accent"
            >
              <UserPlus className="h-3 w-3" />
              Manage
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1.5 min-h-[28px] items-center">
          {project.assignedMembers.length === 0 ? (
            <span className="text-sm text-app-subtle italic">No team members assigned</span>
          ) : (
            project.assignedMembers.map((userId) => {
              const m = workspaceMembers.find((member) => member.userId === userId)
              if (!m) return null
              const initials = m.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()
              return (
                <span
                  key={userId}
                  title={`${m.name} (${m.role})`}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-500/25"
                >
                  {initials}
                </span>
              )
            })
          )}
        </div>
      </div>
    </article>
  )
}
