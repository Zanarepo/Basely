'use client'

import { useState, useEffect } from 'react'
import { X, Save, Award, Zap, Tag, ShieldCheck } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import { saveMemberSkill, type MemberSkillProfile, type SkillCategory, type ProficiencyLevel } from '@/lib/team/capacity-actions'

interface MemberSkillModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  organizationId: string
  memberName?: string
  initialSkill?: Partial<MemberSkillProfile> | null
  onSuccess?: (skill: MemberSkillProfile) => void
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void
}

const COMMON_SKILL_PRESETS = [
  'React & Next.js',
  'TypeScript & Node.js',
  'Python & AI/ML',
  'DevOps & AWS Cloud',
  'UI/UX & Design Systems',
  'Agile & Scrum Leadership',
  'PostgreSQL & Data Engineering',
  'System Architecture & DevOps'
]

export default function MemberSkillModal({
  isOpen,
  onClose,
  userId,
  organizationId,
  memberName = 'Team Member',
  initialSkill,
  onSuccess,
  onShowToast
}: MemberSkillModalProps) {
  const [skillName, setSkillName] = useState('')
  const [category, setCategory] = useState<SkillCategory>('frontend')
  const [proficiency, setProficiency] = useState<ProficiencyLevel>('intermediate')
  const [years, setYears] = useState('2.0')
  const [isPrimary, setIsPrimary] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialSkill) {
      setSkillName(initialSkill.skill_name || '')
      setCategory(initialSkill.skill_category || 'frontend')
      setProficiency(initialSkill.proficiency_level || 'intermediate')
      setYears(initialSkill.years_experience?.toString() || '2.0')
      setIsPrimary(!!initialSkill.is_primary_specialization)
    } else {
      setSkillName('')
      setCategory('frontend')
      setProficiency('intermediate')
      setYears('2.0')
      setIsPrimary(false)
    }
  }, [initialSkill, isOpen])

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!skillName.trim()) {
      setError('Please enter or select a competency name.')
      return
    }
    setIsSaving(true)
    setError(null)

    const parsedYears = parseFloat(years) || 1.0
    const isUuid = (str?: string) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
    const validId = initialSkill?.id && isUuid(initialSkill.id) ? initialSkill.id : undefined

    const payload: Partial<MemberSkillProfile> = {
      id: validId,
      organization_id: organizationId || 'default_org',
      user_id: userId,
      skill_name: skillName.trim(),
      skill_category: category,
      proficiency_level: proficiency,
      years_experience: parsedYears,
      is_primary_specialization: isPrimary
    }

    const res = await saveMemberSkill(payload)

    setIsSaving(false)
    if (res.ok) {
      onShowToast?.('success', initialSkill ? `Competency "${skillName}" updated successfully` : `Competency "${skillName}" assigned to ${memberName}`)
      const updatedSkill: MemberSkillProfile = (res.data || {
        id: validId || crypto.randomUUID(),
        organization_id: organizationId || 'default_org',
        user_id: userId,
        skill_name: skillName.trim(),
        skill_category: category,
        proficiency_level: proficiency,
        years_experience: parsedYears,
        is_primary_specialization: isPrimary,
        updated_at: new Date().toISOString()
      }) as MemberSkillProfile

      onSuccess?.(updatedSkill)
      onClose()
    } else {
      const msg = res.error || 'Failed to save competency'
      setError(msg)
      onShowToast?.('error', msg)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col bg-app-surface border border-app-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-transparent border-b border-app-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-500 flex items-center justify-center shadow-inner">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-app-fg">
                {initialSkill ? 'Edit Specialist Competency' : 'Assign Specialist Competency'}
              </h3>
              <p className="text-xs text-app-muted">
                {memberName ? `Configuring technical skillset for ${memberName}` : 'Map professional skills to resource profiles'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-app-muted hover:text-app-fg rounded-xl hover:bg-app-muted-surface border border-transparent hover:border-app-border transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Preset tags */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-500" /> Quick Select Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SKILL_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSkillName(preset)
                    if (preset.includes('React') || preset.includes('UI/UX') || preset.includes('Design')) setCategory('frontend')
                    else if (preset.includes('Node') || preset.includes('PostgreSQL') || preset.includes('Python')) setCategory('backend')
                    else if (preset.includes('DevOps') || preset.includes('AWS') || preset.includes('System')) setCategory('devops')
                    else if (preset.includes('Leadership') || preset.includes('Agile') || preset.includes('Scrum')) setCategory('management')
                    else if (preset.includes('AI/ML') || preset.includes('Data')) setCategory('data_science')
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                    skillName === preset
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-app-muted-surface text-app-fg border-app-border hover:border-indigo-500/30 hover:bg-indigo-500/10'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-app-muted block mb-1.5">
                Competency / Skill Name <span className="text-indigo-500">*</span>
              </label>
              <input
                type="text"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="e.g. React & Next.js, Cloud Architecture..."
                className="w-full h-10 px-3.5 rounded-xl bg-app-muted-surface border border-app-border text-sm font-medium text-app-fg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-app-muted block mb-1.5">
                  Domain Category
                </label>
                <EnterpriseSelect
                  value={category}
                  onChange={(val: string) => setCategory(val as SkillCategory)}
                  options={[
                    { value: 'frontend', label: 'Frontend & UI' },
                    { value: 'backend', label: 'Backend & Systems' },
                    { value: 'devops', label: 'DevOps & Cloud' },
                    { value: 'data_science', label: 'Data Science & AI' },
                    { value: 'design', label: 'UI/UX & Design' },
                    { value: 'management', label: 'Agile & Management' },
                  ]}
                  placeholder="Select category"
                  className="bg-app-muted-surface"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-app-muted block mb-1.5">
                  Proficiency Level
                </label>
                <EnterpriseSelect
                  value={proficiency}
                  onChange={(val: string) => setProficiency(val as ProficiencyLevel)}
                  options={[
                    { value: 'beginner', label: 'Beginner (1+ yr)' },
                    { value: 'intermediate', label: 'Intermediate (2-4 yrs)' },
                    { value: 'advanced', label: 'Advanced (4-6 yrs)' },
                    { value: 'expert', label: 'Expert / Lead (7+ yrs)' },
                  ]}
                  placeholder="Select proficiency"
                  className="bg-app-muted-surface"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-app-muted block mb-1.5 flex items-center justify-between">
                <span>Years of Experience</span>
                <span className="text-app-fg font-bold lowercase">{years} yrs</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl bg-app-muted-surface border border-app-border text-sm font-semibold text-app-fg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="primary-spec-checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-app-border bg-app-muted-surface cursor-pointer"
              />
              <label htmlFor="primary-spec-checkbox" className="text-sm font-semibold text-app-fg cursor-pointer select-none">
                Mark as Primary Specialization
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-app-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-app-muted hover:text-app-fg rounded-xl bg-app-muted-surface border border-app-border hover:bg-app-hover transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSaving ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{initialSkill ? 'Save Competency' : 'Assign Competency'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
