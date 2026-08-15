'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Plus, UserCheck, Users, Search, Check, ChevronDown } from 'lucide-react'
import { OrgMember } from '../../hooks/useDocumentApprovals'

interface AddReviewerModalProps {
  showModal: boolean
  newRoleTitle: string
  selectedMemberId: string
  members: OrgMember[]
  onOpenModal: () => void
  onCloseModal: () => void
  onChangeTitle: (title: string) => void
  onSelectMember: (memberId: string) => void
  onAddReviewerMember: (member: OrgMember, customRoleTitle?: string) => void
}

export function AddReviewerModal({
  showModal,
  newRoleTitle,
  selectedMemberId,
  members,
  onOpenModal,
  onCloseModal,
  onChangeTitle,
  onSelectMember,
  onAddReviewerMember,
}: AddReviewerModalProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const modalContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutsideModal(e: MouseEvent) {
      if (modalContainerRef.current && !modalContainerRef.current.contains(e.target as Node)) {
        onCloseModal()
      }
    }
    if (showModal) {
      // Small timeout to prevent immediate closure on open click
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutsideModal)
      }, 10)
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutsideModal)
      }
    }
  }, [showModal, onCloseModal])

  if (!showModal) {
    return (
      <button
        type="button"
        style={{ cursor: 'pointer' }}
        onClick={onOpenModal}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 border border-violet-500/30 transition-all cursor-pointer shadow-2xs"
        title="Select team member to assign as document reviewer"
      >
        <Plus className="w-3.5 h-3.5 text-violet-500" />
        <span>Add Reviewer</span>
      </button>
    )
  }

  const selectedMember = members.find((m) => m.userId === selectedMemberId)

  const filteredMembers = members.filter((m) => {
    const q = searchFilter.toLowerCase()
    return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || (m.email && m.email.toLowerCase().includes(q))
  })

  return (
    <div ref={modalContainerRef} className="flex flex-col gap-3.5 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 w-84 ring-1 ring-black/5 animate-in fade-in zoom-in-95">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-500/10 rounded-lg border border-violet-500/20">
            <Users className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-app-fg">Assign Team Reviewer</h4>
            <p className="text-[10px] text-app-muted">Select an organizational member for sign-off</p>
          </div>
        </div>
      </div>

      {/* Enterprise Custom Select Member Dropdown */}
      <div className="space-y-1.5 relative" ref={dropdownRef}>
        <label className="text-[10px] font-bold text-app-muted uppercase flex items-center gap-1">
          <UserCheck className="w-3 h-3 text-violet-500" />
          Select Team Member
        </label>

        {/* Dropdown Trigger */}
        <button
          type="button"
          style={{ cursor: 'pointer' }}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-app-fg transition-all text-left cursor-pointer shadow-2xs"
        >
          {selectedMember ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-violet-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                {selectedMember.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs truncate leading-tight">{selectedMember.name}</span>
                <span className="text-[10px] text-app-muted truncate leading-tight">{selectedMember.role}</span>
              </div>
            </div>
          ) : (
            <span className="text-app-muted italic text-xs">-- Choose Member from Organization --</span>
          )}
          <ChevronDown className={`w-4 h-4 text-app-muted transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Custom Dropdown Popover List */}
        {isDropdownOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 space-y-1.5 max-h-60 overflow-y-auto ring-1 ring-black/5 animate-in fade-in zoom-in-95">
            {/* Search Filter */}
            {members.length > 4 && (
              <div className="relative px-1 pt-1 pb-1.5">
                <Search className="w-3.5 h-3.5 text-app-muted absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search team members..."
                  className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-app-fg focus:outline-none focus:border-violet-500"
                />
              </div>
            )}

            {filteredMembers.length > 0 ? (
              filteredMembers.map((m) => {
                const isSelected = m.userId === selectedMemberId
                return (
                  <button
                    key={m.userId}
                    type="button"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      onSelectMember(m.userId)
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold border border-violet-500/30'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-app-fg'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {m.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs leading-tight">{m.name}</span>
                        <span className="text-[10px] text-app-muted leading-tight">{m.role}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-violet-500 shrink-0" />}
                  </button>
                )
              })
            ) : (
              <p className="text-xs text-app-muted italic p-2 text-center">No members found</p>
            )}
          </div>
        )}
      </div>

      {/* Optional Custom Role Title */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-app-muted uppercase">Reviewer Role Title (Optional)</label>
        <input
          type="text"
          value={newRoleTitle}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder={selectedMember ? selectedMember.role : "e.g. Lead Architect"}
          className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-app-fg focus:outline-none focus:border-violet-500 font-medium"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          style={{ cursor: 'pointer' }}
          onClick={onCloseModal}
          className="px-3 py-1.5 text-xs font-semibold text-app-muted hover:text-app-fg cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          style={{ cursor: 'pointer' }}
          disabled={!selectedMember && !newRoleTitle.trim()}
          onClick={() => {
            if (selectedMember) {
              onAddReviewerMember(selectedMember, newRoleTitle)
            } else if (newRoleTitle.trim()) {
              onAddReviewerMember(
                { userId: `custom_${Date.now()}`, name: newRoleTitle.trim(), role: newRoleTitle.trim() },
                newRoleTitle.trim()
              )
            }
          }}
          className="px-3.5 py-1.5 text-xs font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Reviewer
        </button>
      </div>
    </div>
  )
}
