'use client'

import { useState, useRef, useCallback } from 'react'
import { Send, AlertTriangle, AlertCircle, CheckSquare, FileText, Users, BarChart3 } from 'lucide-react'
import type { ProjectEntity } from '../hooks/useEntityReferences'

export type MentionOption = {
  id: string
  name: string
  type: 'stakeholder' | 'user'
}

interface CommentInputProps {
  onPost: (body: string, mentions: { stakeholderId?: string, userId?: string }[]) => Promise<any>
  mentionOptions: MentionOption[]
  entityOptions?: ProjectEntity[]
  placeholder?: string
}

const CHIP_SENTINEL = '\u200B'

export function CommentInput({ onPost, mentionOptions, entityOptions = [], placeholder = 'Add a comment... (Type @ to mention, # for references)' }: CommentInputProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMentionPicker, setShowMentionPicker] = useState(false)
  const [showEntityPicker, setShowEntityPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isEmpty, setIsEmpty] = useState(true)

  const editorRef = useRef<HTMLDivElement>(null)
  const resolvedMentionsRef = useRef<MentionOption[]>([])

  const filteredMentions = mentionOptions.filter(o =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5)

  const filteredEntities = entityOptions.filter(o =>
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.type.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8)

  const getBodyMarkdown = useCallback((): string => {
    if (!editorRef.current) return ''
    let result = ''
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent || ''
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        if (el.dataset.entityType && el.dataset.entityId) {
          const typeLabel = el.dataset.entityLabel || el.dataset.entityType
          const title = el.dataset.entityTitle || ''
          result += `[${typeLabel}: ${title}](#${el.dataset.entityType}:${el.dataset.entityId})`
        } else if (el.dataset.mentionId) {
          result += `@${el.dataset.mentionName || el.textContent}`
        } else {
          if (el.tagName === 'BR') {
            result += '\n'
          } else {
            el.childNodes.forEach(walk)
          }
        }
      }
    }
    editorRef.current.childNodes.forEach(walk)
    return result.trim()
  }, [])

  const checkEmpty = useCallback(() => {
    if (!editorRef.current) return
    const text = editorRef.current.textContent || ''
    setIsEmpty(text.replace(/\u200B/g, '').trim().length === 0 && editorRef.current.querySelectorAll('[data-entity-type], [data-mention-id]').length === 0)
  }, [])

  const handleInput = useCallback(() => {
    checkEmpty()
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const container = range.startContainer
    if (container.nodeType !== Node.TEXT_NODE) {
      setShowMentionPicker(false)
      setShowEntityPicker(false)
      return
    }

    const text = container.textContent || ''
    const offset = range.startOffset
    const textBeforeCursor = text.slice(0, offset)

    const mentionMatch = textBeforeCursor.match(/(?:^|[\s\u200B])@([^\s\u200B]*)$/)
    if (mentionMatch) {
      setShowMentionPicker(true)
      setShowEntityPicker(false)
      setSearchQuery(mentionMatch[1])
      return
    }

    const entityMatch = textBeforeCursor.match(/(?:^|[\s\u200B])#([^\s\u200B]*)$/)
    if (entityMatch) {
      setShowEntityPicker(true)
      setShowMentionPicker(false)
      setSearchQuery(entityMatch[1])
      return
    }

    setShowMentionPicker(false)
    setShowEntityPicker(false)
  }, [checkEmpty])

  const createEntityChip = (option: ProjectEntity): HTMLSpanElement => {
    const chip = document.createElement('span')
    chip.contentEditable = 'false'
    chip.dataset.entityType = option.type
    chip.dataset.entityId = option.id
    
    const typeLabels: Record<string, string> = {
      wbs: 'Task', risk: 'Risk', issue: 'Issue', stakeholders: 'Register',
      charter: 'Charter', raci: 'RACI', gantt: 'Gantt',
      cost_estimation: 'Estimations', cost_resources: 'Resources',
      cost_timephasing: 'S-Curve', cost_baselines: 'Baselines', cost_actuals: 'Actuals',
      wbs_board: 'Board', wbs_grid: 'Grid', wbs_unassigned: 'Unassigned'
    }
    const typeLabel = typeLabels[option.type] || option.type
    chip.dataset.entityLabel = typeLabel
    chip.dataset.entityTitle = option.title

    const shortTitle = option.title.length > 25 ? option.title.slice(0, 25) + '…' : option.title

    let bg = 'rgba(99,102,241,0.15)'
    let color = 'rgb(129,140,248)'
    let border = 'rgba(99,102,241,0.3)'
    
    if (option.type === 'risk') { bg = 'rgba(249,115,22,0.15)'; color = 'rgb(251,146,60)'; border = 'rgba(249,115,22,0.3)' }
    else if (option.type === 'issue') { bg = 'rgba(239,68,68,0.15)'; color = 'rgb(248,113,113)'; border = 'rgba(239,68,68,0.3)' }
    // Using the 'documents' blue design for cost and gantt
    else if (option.type === 'charter' || option.type === 'raci' || option.type.startsWith('cost_') || option.type === 'gantt') { 
      bg = 'rgba(59,130,246,0.15)'; color = 'rgb(96,165,250)'; border = 'rgba(59,130,246,0.3)' 
    }
    else if (option.type === 'stakeholders') { bg = 'rgba(16,185,129,0.15)'; color = 'rgb(52,211,153)'; border = 'rgba(16,185,129,0.3)' }
    else if (option.type === 'wbs_unassigned') { bg = 'rgba(245,158,11,0.15)'; color = 'rgb(251,191,36)'; border = 'rgba(245,158,11,0.3)' }

    chip.style.cssText = `display:inline-flex;align-items:center;gap:4px;padding:1px 4px 1px 8px;margin:0 2px;border-radius:9999px;font-size:12px;font-weight:600;line-height:1.6;background:${bg};color:${color};border:1px solid ${border};cursor:default;user-select:none;vertical-align:baseline;white-space:nowrap;`
    chip.innerHTML = `<span>${typeLabel}: ${shortTitle}</span> <span class="chip-delete-btn" style="cursor:pointer;margin-left:2px;padding:0;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;background:rgba(255,255,255,0.15);font-size:10px;line-height:1;">&times;</span>`
    return chip
  }

  const createMentionChip = (option: MentionOption): HTMLSpanElement => {
    const chip = document.createElement('span')
    chip.contentEditable = 'false'
    chip.dataset.mentionId = option.id
    chip.dataset.mentionName = option.name
    chip.style.cssText = `display:inline-flex;align-items:center;padding:1px 4px 1px 6px;margin:0 2px;border-radius:9999px;font-size:12px;font-weight:600;line-height:1.6;background:rgba(99,102,241,0.15);color:rgb(129,140,248);border:1px solid rgba(99,102,241,0.3);cursor:default;user-select:none;vertical-align:baseline;white-space:nowrap;`
    chip.innerHTML = `<span>@${option.name}</span> <span class="chip-delete-btn" style="cursor:pointer;margin-left:4px;padding:0;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;background:rgba(255,255,255,0.15);font-size:10px;line-height:1;">&times;</span>`
    return chip
  }

  const insertEntity = (option: ProjectEntity) => {
    if (!editorRef.current) return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const container = range.startContainer
    if (container.nodeType !== Node.TEXT_NODE) return

    const text = container.textContent || ''
    const offset = range.startOffset
    const textBeforeCursor = text.slice(0, offset)
    const hashIdx = textBeforeCursor.lastIndexOf('#')
    if (hashIdx === -1) return

    const textAfterCursor = text.slice(offset)
    const textNode = container as Text

    const beforeText = text.slice(0, hashIdx)
    const afterText = textAfterCursor

    const parent = textNode.parentNode!
    const chip = createEntityChip(option)

    const beforeNode = document.createTextNode(beforeText)
    const afterNode = document.createTextNode(CHIP_SENTINEL + afterText)

    parent.insertBefore(beforeNode, textNode)
    parent.insertBefore(chip, textNode)
    parent.insertBefore(afterNode, textNode)
    parent.removeChild(textNode)

    const newRange = document.createRange()
    newRange.setStart(afterNode, 1)
    newRange.collapse(true)
    selection.removeAllRanges()
    selection.addRange(newRange)

    setShowEntityPicker(false)
    setSearchQuery('')
    checkEmpty()
    editorRef.current.focus()
  }

  const insertMention = (option: MentionOption) => {
    if (!editorRef.current) return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const container = range.startContainer
    if (container.nodeType !== Node.TEXT_NODE) return

    const text = container.textContent || ''
    const offset = range.startOffset
    const textBeforeCursor = text.slice(0, offset)
    const atIdx = textBeforeCursor.lastIndexOf('@')
    if (atIdx === -1) return

    const textAfterCursor = text.slice(offset)
    const textNode = container as Text

    const beforeText = text.slice(0, atIdx)
    const afterText = textAfterCursor

    const parent = textNode.parentNode!
    const chip = createMentionChip(option)

    const beforeNode = document.createTextNode(beforeText)
    const afterNode = document.createTextNode(CHIP_SENTINEL + afterText)

    parent.insertBefore(beforeNode, textNode)
    parent.insertBefore(chip, textNode)
    parent.insertBefore(afterNode, textNode)
    parent.removeChild(textNode)

    const newRange = document.createRange()
    newRange.setStart(afterNode, 1)
    newRange.collapse(true)
    selection.removeAllRanges()
    selection.addRange(newRange)

    if (!resolvedMentionsRef.current.find(m => m.id === option.id)) {
      resolvedMentionsRef.current = [...resolvedMentionsRef.current, option]
    }

    setShowMentionPicker(false)
    setSearchQuery('')
    checkEmpty()
    editorRef.current.focus()
  }

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const deleteBtn = target.closest('.chip-delete-btn')
    if (deleteBtn) {
      e.preventDefault()
      e.stopPropagation()
      const chip = deleteBtn.closest('[data-entity-type], [data-mention-id]')
      if (chip && editorRef.current) {
        editorRef.current.removeChild(chip)
        checkEmpty()
        editorRef.current.focus()
      }
    }
  }

  const handleSubmit = async () => {
    const bodyMarkdown = getBodyMarkdown()
    if (!bodyMarkdown.trim()) return
    setIsSubmitting(true)

    const finalMentions = resolvedMentionsRef.current.filter(m => bodyMarkdown.includes(`@${m.name}`))
    const mappedMentions = finalMentions.map(m => ({
      stakeholderId: m.type === 'stakeholder' ? m.id : undefined,
      userId: m.type === 'user' ? m.id : undefined
    }))

    await onPost(bodyMarkdown, mappedMentions)

    if (editorRef.current) {
      editorRef.current.innerHTML = ''
    }
    resolvedMentionsRef.current = []
    setIsEmpty(true)
    setIsSubmitting(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!showMentionPicker && !showEntityPicker) {
        handleSubmit()
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'risk': return <AlertTriangle className="w-3 h-3 text-orange-500" />
      case 'issue': return <AlertCircle className="w-3 h-3 text-red-500" />
      case 'charter':
      case 'raci': return <FileText className="w-3 h-3 text-blue-500" />
      case 'stakeholders': return <Users className="w-3 h-3 text-emerald-500" />
      case 'gantt':
      case 'cost_estimation':
      case 'cost_resources':
      case 'cost_timephasing':
      case 'cost_baselines':
      case 'cost_actuals': return <FileText className="w-3 h-3 text-blue-500" />
      default: return <CheckSquare className="w-3 h-3 text-indigo-500" />
    }
  }

  return (
    <div className="relative mt-4">
      {/* People Picker */}
      {showMentionPicker && filteredMentions.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-64 bg-white dark:bg-zinc-900 border border-app-border rounded-lg shadow-xl overflow-hidden z-50">
          <div className="px-3 py-1.5 bg-app-muted-surface border-b border-app-border text-xs font-semibold text-app-muted uppercase tracking-wider">
            People
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredMentions.map(option => (
              <button
                type="button"
                key={`${option.type}-${option.id}`}
                onClick={() => insertMention(option)}
                className="w-full text-left px-3 py-2 text-sm text-app-fg hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors flex flex-col"
              >
                <span className="font-medium">{option.name}</span>
                <span className="text-[10px] text-app-muted uppercase">{option.type}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Entity Picker */}
      {showEntityPicker && filteredEntities.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-80 bg-white dark:bg-zinc-900 border border-app-border rounded-lg shadow-xl overflow-hidden z-50">
          <div className="px-3 py-1.5 bg-app-muted-surface border-b border-app-border text-xs font-semibold text-app-muted uppercase tracking-wider">
            References
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filteredEntities.map(option => (
              <button
                type="button"
                key={option.id}
                onClick={() => insertEntity(option)}
                className="w-full text-left px-3 py-2 text-sm text-app-fg hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors flex items-center gap-2"
              >
                <div className="flex-shrink-0 mt-0.5 self-start">
                  {getEntityIcon(option.type)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{option.title}</span>
                  <span className="text-[10px] text-app-muted uppercase">{option.type === 'wbs' ? 'Task' : option.type}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        {/* Placeholder overlay */}
        {isEmpty && (
          <div className="absolute top-3 left-4 text-sm text-app-muted pointer-events-none select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={checkEmpty}
          onBlur={checkEmpty}
          onClick={handleEditorClick}
          className="w-full bg-app-surface border border-app-border rounded-lg py-3 px-4 pr-12 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[60px] max-h-[200px] overflow-y-auto"
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isEmpty || isSubmitting}
          className="absolute right-3 bottom-3 p-1.5 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
