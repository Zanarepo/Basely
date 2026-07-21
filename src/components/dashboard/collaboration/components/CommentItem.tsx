'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Edit2, Trash2, User, MessageCircle, AlertTriangle, AlertCircle, CheckSquare, FileText, Users, ChevronDown, ChevronRight } from 'lucide-react'
import type { Comment } from '@/lib/collaboration/actions'
import { CommentInput, type MentionOption } from './CommentInput'
import { EntityPreviewModal } from './EntityPreviewModal'
import type { ProjectEntity } from '../hooks/useEntityReferences'

export interface CommentNode extends Comment {
  replies?: CommentNode[]
}

interface CommentItemProps {
  comment: CommentNode
  currentUserId?: string
  onEdit: (commentId: string, newBody: string, mentions: any[]) => Promise<any>
  onDelete: (commentId: string) => Promise<any>
  onReply?: (parentId: string, body: string, mentions: any[]) => Promise<any>
  mentionOptions?: MentionOption[]
  entityOptions?: ProjectEntity[]
  projectId?: string
  depth?: number
  maxDepth?: number
}

export function CommentItem({ 
  comment, 
  currentUserId, 
  onEdit, 
  onDelete,
  onReply,
  mentionOptions = [],
  entityOptions = [],
  projectId,
  depth = 0,
  maxDepth = 3
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [previewEntity, setPreviewEntity] = useState<{ type: string, id: string } | null>(null)
  const [isThreadCollapsed, setIsThreadCollapsed] = useState(true)

  const isAuthor = currentUserId === comment.author_user_id

  // Count all replies recursively
  const countReplies = (node: CommentNode): number => {
    if (!node.replies || node.replies.length === 0) return 0
    return node.replies.reduce((sum, r) => sum + 1 + countReplies(r), 0)
  }
  const replyCount = countReplies(comment)

  const handleSaveEdit = async () => {
    if (!editBody.trim() || editBody === comment.body) {
      setIsEditing(false)
      return
    }
    setIsSubmitting(true)
    await onEdit(comment.id, editBody, [])
    setIsSubmitting(false)
    setIsEditing(false)
  }

  const handlePostReply = async (body: string, mentions: any[]) => {
    if (!onReply) return
    await onReply(comment.id, body, mentions)
    setIsReplying(false)
  }

  // Parses comment body to replace markdown-style tags [Type: Title](#type:id) with clickable badges
  const renderParsedBody = (bodyText: string) => {
    // Regex updated to include underscores in the type matcher to support 'cost_actuals', etc.
    const regex = /\[([^\]]+)\]\(#([a-z_]+):([a-zA-Z0-9-]+)\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = regex.exec(bodyText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(bodyText.substring(lastIndex, match.index))
      }

      const label = match[1]
      const type = match[2]
      const id = match[3]

      let icon = <CheckSquare className="w-3 h-3 text-indigo-500 mr-1" />
      let bgClass = "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
      
      if (type === 'risk') {
        icon = <AlertTriangle className="w-3 h-3 text-orange-500 mr-1" />
        bgClass = "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
      } else if (type === 'issue') {
        icon = <AlertCircle className="w-3 h-3 text-red-500 mr-1" />
        bgClass = "bg-red-500/10 text-red-500 hover:bg-red-500/20"
      } else if (type === 'charter' || type === 'raci' || type.startsWith('cost_') || type === 'gantt') {
        icon = <FileText className="w-3 h-3 text-blue-500 mr-1" />
        bgClass = "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
      } else if (type === 'stakeholders') {
        icon = <Users className="w-3 h-3 text-emerald-500 mr-1" />
        bgClass = "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
      } else if (type === 'wbs_unassigned') {
        icon = <CheckSquare className="w-3 h-3 text-amber-500 mr-1" />
        bgClass = "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
      }

      parts.push(
        <button
          key={match.index}
          type="button"
          onClick={() => setPreviewEntity({ type, id })}
          className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-semibold cursor-pointer transition-colors ${bgClass}`}
          title="Click to view details"
        >
          {icon}
          {label}
        </button>
      )

      lastIndex = match.index + match[0].length
    }

    if (lastIndex < bodyText.length) {
      parts.push(bodyText.substring(lastIndex))
    }

    return parts
  }

  return (
    <div className={`flex gap-3 py-3 group ${depth > 0 ? 'ml-6 relative before:absolute before:left-[-14px] before:top-[-10px] before:bottom-6 before:w-px before:bg-app-border' : ''}`}>
      {/* Thread line connecting child to parent */}
      {depth > 0 && (
        <div className="absolute left-[-14px] top-6 w-3.5 h-px bg-app-border" />
      )}

      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-app-muted-surface flex items-center justify-center overflow-hidden border border-app-border z-10 bg-app-surface">
        {comment.author?.avatar_url ? (
          <img src={comment.author.avatar_url} alt={comment.author.name} className="w-full h-full object-cover" />
        ) : (
          <User className="w-4 h-4 text-app-muted" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-app-fg">{comment.author?.name || 'Unknown User'}</span>
            <span className="text-xs text-app-muted">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.edited_at && (
              <span className="text-[10px] text-app-muted bg-app-muted-surface px-1.5 py-0.5 rounded-full">
                edited
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onReply && depth < maxDepth && (
              <button 
                type="button"
                onClick={() => setIsReplying(!isReplying)}
                className="p-1 text-app-muted hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
                title="Reply"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </button>
            )}
            {isAuthor && !isEditing && (
              <>
                <button 
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-app-muted hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
                  title="Edit comment"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this comment?')) {
                      onDelete(comment.id)
                    }
                  }}
                  className="p-1 text-app-muted hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Delete comment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full text-sm bg-app-surface border border-indigo-500/30 rounded-lg p-2 text-app-fg focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-y min-h-[80px]"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setEditBody(comment.body)
                }}
                className="px-3 py-1 text-xs font-medium text-app-muted hover:text-app-fg transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSubmitting || !editBody.trim()}
                className="px-3 py-1 text-xs font-medium bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-app-fg whitespace-pre-wrap leading-relaxed">
            {renderParsedBody(comment.body)}
          </div>
        )}

        {isReplying && (
          <div className="mt-3 relative z-20">
            <CommentInput 
              onPost={handlePostReply}
              mentionOptions={mentionOptions}
              entityOptions={entityOptions}
              placeholder={`Reply to ${comment.author?.name || 'user'}...`}
            />
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setIsThreadCollapsed(!isThreadCollapsed)}
              className="flex items-center gap-1.5 text-xs text-app-muted hover:text-indigo-400 transition-colors py-1 group"
            >
              {isThreadCollapsed ? (
                <ChevronRight className="w-3 h-3 transition-transform" />
              ) : (
                <ChevronDown className="w-3 h-3 transition-transform" />
              )}
              <span className="font-medium">{isThreadCollapsed ? 'Show' : 'Hide'} replies</span>
              <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] font-bold leading-none">
                {replyCount}
              </span>
            </button>

            {!isThreadCollapsed && (
              <div className="mt-2 space-y-2 animate-fade-in">
                {comment.replies.map(reply => (
                  <CommentItem 
                    key={reply.id}
                    comment={reply}
                    currentUserId={currentUserId}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onReply={onReply}
                    mentionOptions={mentionOptions}
                    entityOptions={entityOptions}
                    projectId={projectId}
                    depth={depth + 1}
                    maxDepth={maxDepth}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {previewEntity && (
        <EntityPreviewModal 
          type={previewEntity.type} 
          id={previewEntity.id} 
          projectId={projectId}
          onClose={() => setPreviewEntity(null)} 
        />
      )}
    </div>
  )
}
