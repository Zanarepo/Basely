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

import { SkillsMatrixHeader } from './components/SkillsMatrixHeader'
import { SkillsMatrixFilter } from './components/SkillsMatrixFilter'
import { SkillsMatrixList } from './components/SkillsMatrixList'
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


  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SkillsMatrixHeader
        methodology={methodology}
        membersCount={members.length}
        maxSpecialists={permissions.maxSpecialists}
        onAddClick={() => setIsAddMemberOpen(true)}
        onLimitReached={() => {
          setRestrictedFeature({
            name: 'Matrix Size Limit Reached',
            desc: 'Free users can only add up to 5 specialists to the matrix. Upgrade to Premium to add unlimited team members.'
          })
        }}
      />

      <SkillsMatrixFilter
        search={search}
        setSearch={setSearch}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        proficiencyFilter={proficiencyFilter}
        setProficiencyFilter={setProficiencyFilter}
      />

      <SkillsMatrixList
        methodology={methodology}
        filteredMembers={filteredMembers}
        permissions={permissions}
        deletingSkillId={deletingSkillId}
        removingMemberId={removingMemberId}
        onLimitReached={() => {
          setRestrictedFeature({
            name: 'Advanced Capacity Planning',
            desc: 'Configure Target Utilization % and explicitly manage weekly available bandwidth. Available on the Premium plan.'
          })
        }}
        setActiveSkillModal={setActiveSkillModal}
        handleDeleteSkill={handleDeleteSkill}
        setActiveCapacityMember={setActiveCapacityMember}
        handleDeleteMember={handleDeleteMember}
      />

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

