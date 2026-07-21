'use client'

import { useComments } from './hooks/useComments'
import { useEntityReferences } from './hooks/useEntityReferences'
import { CommentInput, type MentionOption } from './components/CommentInput'
import { CommentItem } from './components/CommentItem'
import { MessageSquare } from 'lucide-react'

interface CommentThreadProps {
  projectId: string
  entityType: 'activity' | 'document' | 'risk' | 'issue'
  entityId: string
  currentUserId?: string
  stakeholders?: any[]
  workspaceMembers?: any[]
}

export function CommentThread({ 
  projectId, 
  entityType, 
  entityId, 
  currentUserId,
  stakeholders = [],
  workspaceMembers = []
}: CommentThreadProps) {
  const { comments, isLoading, error, postComment, updateComment, deleteComment } = useComments(projectId, entityType, entityId)
  const { entities: entityOptions } = useEntityReferences(projectId)

  // Map stakeholders and users to mention options
  const mentionOptions: MentionOption[] = [
    ...stakeholders.map(s => ({ id: s.id, name: s.name, type: 'stakeholder' as const })),
    ...workspaceMembers.map(m => ({ id: m.userId, name: m.name, type: 'user' as const }))
  ]

  // Build a tree of comments
  const buildTree = (allComments: any[], parentId: string | null = null): any[] => {
    return allComments
      .filter(c => (c.parent_id || null) === parentId)
      .map(c => ({
        ...c,
        replies: buildTree(allComments, c.id)
      }))
  }

  const topLevelComments = buildTree(comments)

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-indigo-500" />
        <h3 className="text-lg font-semibold text-app-fg">Comments</h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 text-red-500 text-sm rounded-lg border border-red-500/20">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-[200px] mb-4 space-y-2 pr-2">
        {isLoading ? (
          <div className="text-sm text-app-muted text-center py-4">Loading comments...</div>
        ) : topLevelComments.length === 0 ? (
          <div className="text-sm text-app-muted text-center py-8 border border-dashed border-app-border rounded-lg bg-app-surface/50">
            No comments yet. Be the first to start the discussion!
          </div>
        ) : (
          topLevelComments.map(comment => (
            <CommentItem 
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onEdit={(id, body, mentions) => updateComment(id, body, mentions)}
              onDelete={deleteComment}
              onReply={(parentId, body, mentions) => postComment(body, mentions, parentId)}
              mentionOptions={mentionOptions}
              entityOptions={entityOptions}
              projectId={projectId}
            />
          ))
        )}
      </div>

      <div className="mt-auto shrink-0 border-t border-app-border pt-4">
        <CommentInput 
          onPost={(body, mentions) => postComment(body, mentions)} 
          mentionOptions={mentionOptions}
          entityOptions={entityOptions}
        />
      </div>
    </div>
  )
}
