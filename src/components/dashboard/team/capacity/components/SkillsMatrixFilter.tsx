'use client'

import { Search } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface SkillsMatrixFilterProps {
  search: string
  setSearch: (val: string) => void
  categoryFilter: string
  setCategoryFilter: (val: string) => void
  proficiencyFilter: string
  setProficiencyFilter: (val: string) => void
}

export function SkillsMatrixFilter({
  search, setSearch, categoryFilter, setCategoryFilter, proficiencyFilter, setProficiencyFilter
}: SkillsMatrixFilterProps) {
  return (
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
  )
}
