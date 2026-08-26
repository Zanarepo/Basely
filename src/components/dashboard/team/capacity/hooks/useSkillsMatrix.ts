import { useState, useEffect } from 'react'
import { getTeamSkillsMatrix, getMemberCapacityAllocations, deleteMemberSkill, removeMemberCapacity, type MemberSkillProfile, type SkillCategory, type ProficiencyLevel } from '@/lib/team/capacity-actions'
import { useWbsToasts } from '@/components/dashboard/wbs/workspace/hooks/useWbsToasts'

export interface WorkspaceMember {
  userId: string
  name: string
  email: string
  role: string
}

export interface MatrixSkill {
  id?: string
  name: string
  category: SkillCategory
  level: ProficiencyLevel
  years: number
  primary: boolean
}

export interface MatrixMember {
  userId: string
  name: string
  role: string
  avatar: string
  skills: MatrixSkill[]
  capacityHours: number
  velocityPoints: number
  bandwidthPct: number
}

export function useSkillsMatrix(organizationId: string, projectId: string, workspaceMembers: WorkspaceMember[]) {
  const [loading, setLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [proficiencyFilter, setProficiencyFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [activeCapacityMember, setActiveCapacityMember] = useState<{ userId: string; name: string } | null>(null)
  const [activeSkillModal, setActiveSkillModal] = useState<{ userId: string; name: string; skill?: MatrixSkill | null } | null>(null)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const { toasts, showToast, dismissToast } = useWbsToasts()

  const [members, setMembers] = useState<MatrixMember[]>([
    {
      userId: 'usr-1',
      name: 'Alex Rivera',
      role: 'Principal Cloud Architect',
      avatar: 'AR',
      capacityHours: 40,
      velocityPoints: 18,
      bandwidthPct: 90,
      skills: [
        { id: 'sk-1', name: 'AWS & Kubernetes', category: 'devops', level: 'expert', years: 7.5, primary: true },
        { id: 'sk-2', name: 'Node.js Microservices', category: 'backend', level: 'advanced', years: 5, primary: false },
        { id: 'sk-3', name: 'Docker CI/CD', category: 'devops', level: 'expert', years: 6, primary: false }
      ]
    },
    {
      userId: 'usr-2',
      name: 'Elena Rostova',
      role: 'Lead UI/UX Engineer',
      avatar: 'ER',
      capacityHours: 35,
      velocityPoints: 22,
      bandwidthPct: 100,
      skills: [
        { id: 'sk-4', name: 'React & Next.js', category: 'frontend', level: 'expert', years: 6, primary: true },
        { id: 'sk-5', name: 'Tailwind & Vanilla CSS', category: 'design', level: 'expert', years: 8, primary: true },
        { id: 'sk-6', name: 'TypeScript', category: 'frontend', level: 'advanced', years: 4, primary: false }
      ]
    },
    {
      userId: 'usr-3',
      name: 'Marcus Vance',
      role: 'Staff Database Specialist',
      avatar: 'MV',
      capacityHours: 40,
      velocityPoints: 14,
      bandwidthPct: 75,
      skills: [
        { id: 'sk-7', name: 'PostgreSQL & RLS', category: 'backend', level: 'expert', years: 9, primary: true },
        { id: 'sk-8', name: 'Data Pipeline Optimization', category: 'data_science', level: 'advanced', years: 5, primary: false },
        { id: 'sk-9', name: 'Python Analytics', category: 'data_science', level: 'intermediate', years: 3, primary: false }
      ]
    },
    {
      userId: 'usr-4',
      name: 'Sophia Chen',
      role: 'Praz-AI & Telemetry Lead',
      avatar: 'SC',
      capacityHours: 40,
      velocityPoints: 20,
      bandwidthPct: 85,
      skills: [
        { id: 'sk-10', name: 'LLM Embeddings & Vector DB', category: 'data_science', level: 'expert', years: 3, primary: true },
        { id: 'sk-11', name: 'FastAPI & Python', category: 'backend', level: 'advanced', years: 4, primary: false }
      ]
    }
  ])

  useEffect(() => {
    async function fetchTeamData() {
      setLoading(true)
      try {
        const [skillsRes, capRes] = await Promise.all([
          getTeamSkillsMatrix(organizationId),
          getMemberCapacityAllocations(projectId)
        ])

        const dbSkills = (skillsRes.data || []) as MemberSkillProfile[]
        const dbCapacities = capRes.data || []

        const newMembersMap = new Map<string, MatrixMember>()

        if (workspaceMembers.length > 0) {
          workspaceMembers.forEach((wm) => {
            const initials = wm.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'TM'
            newMembersMap.set(wm.userId, {
              userId: wm.userId,
              name: wm.name,
              role: wm.role || 'Project Specialist',
              avatar: initials,
              skills: [],
              capacityHours: 40,
              velocityPoints: 15,
              bandwidthPct: 100
            })
          })
        }

        dbCapacities.forEach((cap: any) => {
          if (!newMembersMap.has(cap.user_id)) {
            const name = cap.member_name || cap.user_id
            const initials = cap.avatar_initials || name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'SP'
            newMembersMap.set(cap.user_id, {
              userId: cap.user_id,
              name: name,
              role: cap.member_role || 'Specialist Resource',
              avatar: initials,
              skills: [],
              capacityHours: cap.available_hours_per_week || 40,
              velocityPoints: cap.sprint_velocity_points || 15,
              bandwidthPct: cap.allocated_percentage ?? 100
            })
          } else {
            const m = newMembersMap.get(cap.user_id)!
            m.capacityHours = cap.available_hours_per_week || m.capacityHours
            m.velocityPoints = cap.sprint_velocity_points || m.velocityPoints
            m.bandwidthPct = cap.allocated_percentage ?? m.bandwidthPct
          }
        })

        dbSkills.forEach((sk) => {
          if (newMembersMap.has(sk.user_id)) {
            const m = newMembersMap.get(sk.user_id)!
            m.skills.push({
              id: sk.id,
              name: sk.skill_name,
              category: (sk.skill_category as SkillCategory) || 'frontend',
              level: (sk.proficiency_level as ProficiencyLevel) || 'intermediate',
              years: Number(sk.years_experience) || 1.0,
              primary: !!sk.is_primary_specialization
            })
          } else if (workspaceMembers.length === 0) {
            setMembers((prev) =>
              prev.map((m) =>
                m.userId === sk.user_id
                  ? {
                      ...m,
                      skills: [
                        ...m.skills.filter(s => s.id !== sk.id && s.name !== sk.skill_name),
                        {
                          id: sk.id,
                          name: sk.skill_name,
                          category: (sk.skill_category as SkillCategory) || 'frontend',
                          level: (sk.proficiency_level as ProficiencyLevel) || 'intermediate',
                          years: Number(sk.years_experience) || 1.0,
                          primary: !!sk.is_primary_specialization
                        }
                      ]
                    }
                  : m
              )
            )
          }
        })

        if (newMembersMap.size > 0) {
          setMembers(Array.from(newMembersMap.values()))
        }
      } catch (err) {
        console.error('Error fetching matrix team data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTeamData()
  }, [organizationId, projectId, workspaceMembers])

  const handleDeleteSkill = async (userId: string, skillId?: string, skillName?: string) => {
    if (!skillId) {
      setMembers(prev =>
        prev.map(m =>
          m.userId === userId
            ? { ...m, skills: m.skills.filter(s => s.name !== skillName) }
            : m
        )
      )
      showToast('info', `Removed competency "${skillName}"`)
      return
    }

    setDeletingSkillId(skillId)
    const res = await deleteMemberSkill(skillId)
    setDeletingSkillId(null)
    if (res.ok) {
      setMembers(prev =>
        prev.map(m =>
          m.userId === userId
            ? { ...m, skills: m.skills.filter(s => s.id !== skillId) }
            : m
        )
      )
      showToast('success', `Competency "${skillName}" removed from database`)
    } else {
      showToast('error', res.error || 'Failed to remove competency')
    }
  }

  const handleDeleteMember = async (userId: string, name: string) => {
    const confirm = window.confirm(`Are you sure you want to completely remove ${name} from this project's capacity matrix?`)
    if (!confirm) return

    setRemovingMemberId(userId)
    const res = await removeMemberCapacity(projectId, userId)
    setRemovingMemberId(null)
    if (res.ok) {
      setMembers(prev => prev.filter(m => m.userId !== userId))
      showToast('success', `${name} removed from capacity matrix`)
    } else {
      showToast('error', res.error || 'Failed to remove member')
    }
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(search.toLowerCase()) ||
                          member.role.toLowerCase().includes(search.toLowerCase()) ||
                          member.skills.some(s => s.name.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || member.skills.some(s => s.category === categoryFilter)
    const matchesProficiency = proficiencyFilter === 'all' || member.skills.some(s => s.level === proficiencyFilter)
    return matchesSearch && matchesCategory && matchesProficiency
  })

  return {
    loading,
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
    handleDeleteSkill,
    handleDeleteMember
  }
}
