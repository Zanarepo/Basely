'use client'

import { Plus, Search, Clock, Zap, Sliders, ChevronRight, UserPlus, Edit2, Trash2 } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import CapacityPlannerModal from './CapacityPlannerModal'
import MemberSkillModal from './MemberSkillModal'
import AddMatrixMemberModal from './AddMatrixMemberModal'
import { type SkillCategory, type ProficiencyLevel } from '@/lib/team/capacity-actions'
import { ToastContainer } from '@/components/dashboard/Toast'
import { useSkillsMatrix, type WorkspaceMember, type MatrixSkill } from './hooks/useSkillsMatrix'
import { useCapacityGating } from './hooks/useCapacityGating'
import { useState } from 'react'

interface SkillsMatrixTableProps {
  organizationId: string
  projectId?: string
  methodology?: 'waterfall' | 'agile' | 'hybrid'
  workspaceMembers?: WorkspaceMember[]
  isPremium?: boolean
  canUpgrade?: boolean
}

export default function SkillsMatrixTable({
  organizationId,
  projectId = 'default_project',
  methodology = 'hybrid',
  workspaceMembers = [],
  isPremium = false,
  canUpgrade = false
}: SkillsMatrixTableProps) {
  const [restrictedFeature, setRestrictedFeature] = useState<{name: string, desc: string} | null>(null)
  const { permissions, RestrictedModal } = useCapacityGating(isPremium, canUpgrade)
  const {
    categoryFilter, setCategoryFilter,
    proficiencyFilter, setProficiencyFilter,
    search, setSearch,
    activeCapacityMember, setActiveCapacityMember,
    activeSkillModal, setActiveSkillModal,
    isAddMemberOpen, setIsAddMemberOpen,
    deletingSkillId, removingMemberId,
    toasts, showToast, dismissToast,
    members, setMembers,
    filteredMembers,
    handleDeleteSkill, handleDeleteMember
  } = useSkillsMatrix(organizationId, projectId, workspaceMembers)

  const getProficiencyBadge = (level: ProficiencyLevel) => {
    switch (level) {
      case 'expert':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase tracking-wide">
            ★ Expert
          </span>
        )
      case 'advanced':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30 uppercase tracking-wide">
            ◆ Advanced
          </span>
        )
      case 'intermediate':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30">
            ● Intermediate
          </span>
        )
      case 'beginner':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-normal bg-slate-500/15 text-slate-300 border border-slate-500/30">
            ○ Beginner
          </span>
        )
    }
  }

  const getCategoryColor = (category: SkillCategory) => {
    const map: Record<SkillCategory, string> = {
      frontend: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
      backend: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
      devops: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
      data_science: 'text-pink-400 border-pink-500/20 bg-pink-500/5',
      design: 'text-violet-400 border-violet-500/20 bg-violet-500/5',
      management: 'text-purple-400 border-purple-500/20 bg-purple-500/5'
    }
    return map[category] || 'text-app-muted'
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Module */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-app-surface border border-app-border shadow-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-black text-app-fg tracking-tight">
              Team Competency & Capacity Matrix
            </h1>
            <span className="text-xs uppercase px-2.5 py-0.5 rounded-full font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
              {methodology} resource engine
            </span>
          </div>
          <p className="text-sm text-app-muted">
            Retrieve database team specialists, assign technical competencies, and balance operational sprint velocity against billable man-hours.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (members.length >= permissions.maxSpecialists) {
              setRestrictedFeature({
                name: 'Matrix Size Limit Reached',
                desc: 'Free users can only add up to 5 specialists to the matrix. Upgrade to Premium to add unlimited team members.'
              })
              return
            }
            setIsAddMemberOpen(true)
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/35 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Specialist / Team Member</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-app-surface/60 border border-app-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
          <input
            type="text"
            placeholder="Search specialist by name, title, or specific technical competency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-app-input border border-app-border text-app-fg text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-48">
            <EnterpriseSelect
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              options={[
                { value: 'all', label: 'All Skill Sectors', description: 'Show all technical specialties' },
                { value: 'frontend', label: 'Frontend & UI', description: 'React, TypeScript & Design' },
                { value: 'backend', label: 'Backend & APIs', description: 'Node.js, Microservices & DB' },
                { value: 'devops', label: 'Cloud & DevOps', description: 'AWS, Docker, Kubernetes & CI/CD' },
                { value: 'data_science', label: 'Praz-AI & Data Science', description: 'LLM embeddings & SQL analytics' },
                { value: 'management', label: 'Agile & Management', description: 'Scrum Leadership & Architecture' }
              ]}
            />
          </div>

          <div className="w-44">
            <EnterpriseSelect
              value={proficiencyFilter}
              onChange={(val) => setProficiencyFilter(val)}
              options={[
                { value: 'all', label: 'Any Proficiency', description: 'Include all skill maturity levels' },
                { value: 'expert', label: '★ Experts Only', description: 'Staff & principal level proficiency' },
                { value: 'advanced', label: '◆ Advanced Only', description: 'Senior engineering specialists' },
                { value: 'intermediate', label: '● Intermediate', description: 'Independent execution proficiency' },
                { value: 'beginner', label: '○ Beginner', description: 'Fundamental knowledge' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Roster & Skills Heatmap Table */}
      <div className="overflow-x-auto rounded-2xl border border-app-border bg-app-surface shadow-xl">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-app-border bg-app-surface-solid text-[11px] font-extrabold uppercase tracking-wider text-app-subtle">
              <th className="p-4 pl-6 w-1/4">Resource Profile</th>
              <th className="p-4 w-1/2">Primary Competencies & Proficiency Heatmap</th>
              <th className="p-4">
                {methodology === 'agile' ? 'Sprint Velocity & Bandwidth' : methodology === 'waterfall' ? 'Billable Man-Hours Allocation' : 'Hybrid Capacity Profile'}
              </th>
              <th className="p-4 pr-6 text-right">Bandwidth Config</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border/40 text-sm">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-app-muted">
                  No specialists found matching your criteria. Click "+ Add Specialist / Team Member" above to register someone!
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr key={member.userId} className="hover:bg-app-input/50 transition-colors group">
                  
                  {/* Member Profile */}
                  <td className="p-4 pl-6 align-top">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center font-black text-violet-400 shrink-0 shadow-inner">
                        {member.avatar}
                      </div>
                      <div>
                        <h4 className="font-bold text-app-fg text-base tracking-tight group-hover:text-violet-300 transition-colors">
                          {member.name}
                        </h4>
                        <span className="text-xs font-semibold text-app-subtle">
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Skills Badges & Controls */}
                  <td className="p-4 align-top max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      {member.skills.length === 0 ? (
                        <span className="text-xs italic text-app-muted py-1">No technical skills mapped yet</span>
                      ) : (
                        member.skills.map((skill, i) => (
                          <div
                            key={skill.id || i}
                            className={`group/skill relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium shadow-2xs transition-all ${getCategoryColor(skill.category)} hover:border-violet-500/50`}
                          >
                            <span className="font-bold text-app-fg">{skill.name}</span>
                            <span className="text-[10px] text-app-subtle">({skill.years}y)</span>
                            {getProficiencyBadge(skill.level)}

                            {/* Hover Edit/Delete buttons */}
                            <div className="flex items-center gap-1 ml-1 pl-2 border-l border-app-border/40 opacity-0 group-hover/skill:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => setActiveSkillModal({
                                  userId: member.userId,
                                  name: member.name,
                                  skill: skill
                                })}
                                title="Edit competency"
                                className="p-1 hover:bg-violet-500/20 rounded text-violet-400 hover:text-violet-300 cursor-pointer transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={deletingSkillId === skill.id}
                                onClick={() => handleDeleteSkill(member.userId, skill.id, skill.name)}
                                title="Remove competency"
                                className="p-1 hover:bg-rose-500/20 rounded text-rose-400 hover:text-rose-300 cursor-pointer transition-colors"
                              >
                                {deletingSkillId === skill.id ? (
                                  <span className="inline-block w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))
                      )}

                      {/* Add Competency Button */}
                      <button
                        type="button"
                        onClick={() => setActiveSkillModal({ userId: member.userId, name: member.name, skill: null })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-app-muted-surface border border-dashed border-app-border text-xs font-bold text-violet-500 hover:text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/40 transition-all cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Competency</span>
                      </button>
                    </div>
                  </td>

                  {/* Capacity Metrics */}
                  <td className="p-4 align-top">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-app-fg">Bandwidth:</span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded ${
                          member.bandwidthPct >= 95 ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {member.bandwidthPct}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-app-muted">
                        {methodology !== 'agile' && (
                          <span title="Weekly available man-hours" className="flex items-center gap-1 font-semibold text-violet-400">
                            <Clock className="w-3.5 h-3.5" /> {member.capacityHours} h/wk
                          </span>
                        )}
                        {methodology !== 'waterfall' && (
                          <span title="Target sprint velocity in points" className="flex items-center gap-1 font-semibold text-amber-400">
                            <Zap className="w-3.5 h-3.5" /> {member.velocityPoints} pts/sprint
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="p-4 align-middle text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!permissions.canUseCapacityPlanner) {
                            setRestrictedFeature({
                              name: 'Advanced Capacity Planning',
                              desc: 'Configure Target Utilization % and explicitly manage weekly available bandwidth. Available on the Premium plan.'
                            })
                            return
                          }
                          setActiveCapacityMember({ userId: member.userId, name: member.name })
                        }}
                        className="px-3.5 py-2 rounded-xl border border-app-border bg-app-muted-surface hover:bg-violet-500/10 hover:border-violet-500/40 text-app-fg text-xs font-bold shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5 text-violet-500" />
                        <span>Configure Bandwidth</span>
                        <ChevronRight className="w-3.5 h-3.5 text-app-muted" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteMember(member.userId, member.name)}
                        disabled={removingMemberId === member.userId}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-all cursor-pointer disabled:opacity-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Remove from project matrix"
                      >
                        {removingMemberId === member.userId ? (
                          <span className="inline-block w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bandwidth Configuration Modal */}
      {activeCapacityMember && (
        <CapacityPlannerModal
          isOpen={!!activeCapacityMember}
          onClose={() => setActiveCapacityMember(null)}
          projectId={projectId}
          organizationId={organizationId}
          methodology={methodology}
          userId={activeCapacityMember.userId}
          memberName={activeCapacityMember.name}
          onSuccess={(newCap) => {
            setMembers((prev) =>
              prev.map((m) =>
                m.userId === activeCapacityMember.userId
                  ? { ...m, capacityHours: newCap.hours, velocityPoints: newCap.velocity, bandwidthPct: newCap.bandwidth }
                  : m
              )
            )
            setActiveCapacityMember(null)
          }}
          onShowToast={showToast}
        />
      )}

      {/* Member Competency Add/Edit Modal */}
      {activeSkillModal && (
        <MemberSkillModal
          isOpen={!!activeSkillModal}
          onClose={() => setActiveSkillModal(null)}
          userId={activeSkillModal.userId}
          organizationId={organizationId}
          memberName={activeSkillModal.name}
          initialSkill={activeSkillModal.skill ? {
            id: activeSkillModal.skill.id || '',
            organization_id: organizationId,
            user_id: activeSkillModal.userId,
            skill_name: activeSkillModal.skill.name,
            skill_category: activeSkillModal.skill.category,
            proficiency_level: activeSkillModal.skill.level,
            years_experience: activeSkillModal.skill.years,
            is_primary_specialization: activeSkillModal.skill.primary,
            updated_at: new Date().toISOString()
          } : null}
          onSuccess={(newSkill) => {
            setMembers((prev) =>
              prev.map((m) => {
                if (m.userId !== activeSkillModal.userId) return m
                const existingIndex = m.skills.findIndex(s => s.id === newSkill.id || (activeSkillModal.skill && s.name === activeSkillModal.skill.name))
                const nextSkill: MatrixSkill = {
                  id: newSkill.id,
                  name: newSkill.skill_name,
                  category: (newSkill.skill_category as SkillCategory) || 'frontend',
                  level: (newSkill.proficiency_level as ProficiencyLevel) || 'intermediate',
                  years: Number(newSkill.years_experience) || 1.0,
                  primary: !!newSkill.is_primary_specialization
                }
                if (existingIndex >= 0) {
                  const copy = [...m.skills]
                  copy[existingIndex] = nextSkill
                  return { ...m, skills: copy }
                } else {
                  return { ...m, skills: [...m.skills, nextSkill] }
                }
              })
            )
          }}
          onShowToast={showToast}
        />
      )}

      {/* Add Team Specialist / Member Modal */}
      {isAddMemberOpen && (
        <AddMatrixMemberModal
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          workspaceMembers={workspaceMembers}
          existingMemberIds={members.map(m => m.userId)}
          projectId={projectId}
          organizationId={organizationId}
          onSuccess={(newMember) => {
            setMembers((prev) => [
              ...prev,
              {
                userId: newMember.id,
                name: newMember.name,
                role: newMember.role,
                avatar: newMember.avatar,
                skills: [],
                capacityHours: newMember.availableHours,
                velocityPoints: newMember.sprintVelocity,
                bandwidthPct: newMember.bandwidthPct
              }
            ])
          }}
          onShowToast={showToast}
        />
      )}

      <RestrictedModal 
        isOpen={!!restrictedFeature} 
        onClose={() => setRestrictedFeature(null)} 
        featureName={restrictedFeature?.name || ''} 
        description={restrictedFeature?.desc || ''} 
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
