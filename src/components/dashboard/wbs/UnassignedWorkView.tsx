import { WbsElement } from '@/lib/wbs/constants'
import { AlertCircle, ArrowRight } from 'lucide-react'

type UnassignedWorkViewProps = {
  elements: WbsElement[]
  onSelect: (id: string) => void
}

export function UnassignedWorkView({ elements, onSelect }: UnassignedWorkViewProps) {
  // Find all work packages that lack a Responsible or Accountable assignment
  const unassignedElements = elements.filter(t => {
    if (!t.isWorkPackage) return false
    
    const hasResponsible = t.raciAssignments?.some(a => a.roleType === 'Responsible')
    const hasAccountable = t.raciAssignments?.some(a => a.roleType === 'Accountable')
    return !hasResponsible || !hasAccountable
  })

  if (unassignedElements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[300px] text-center">
        <div className="p-4 rounded-full bg-emerald-500/10 mb-4">
          <AlertCircle className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-app-fg mb-2">All Clear!</h3>
        <p className="text-sm text-app-muted max-w-sm">
          Every item in your WBS has both a Responsible and Accountable stakeholder assigned.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 h-[600px] overflow-y-auto">
      <div className="mb-6 flex items-center gap-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 p-4 rounded-xl border border-amber-500/20">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">
          Found {unassignedElements.length} {unassignedElements.length === 1 ? 'item' : 'items'} missing a Responsible or Accountable assignment.
        </p>
      </div>

      <div className="space-y-3">
        {unassignedElements.map(element => {
          const missingResponsible = !element.raciAssignments?.some(a => a.roleType === 'Responsible')
          const missingAccountable = !element.raciAssignments?.some(a => a.roleType === 'Accountable')
          
          const tags = []
          if (missingResponsible) tags.push('Missing Responsible')
          if (missingAccountable) tags.push('Missing Accountable')

          return (
            <div 
              key={element.id}
              onClick={() => onSelect(element.id)}
              className="flex items-center justify-between p-4 bg-app-surface-solid border border-app-border rounded-xl cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded">
                    {element.code}
                  </span>
                  <span className="text-sm font-bold text-app-fg">
                    {element.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {tags.map(tag => (
                    <span key={tag} className="text-[10px] font-bold tracking-wide uppercase px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                      {tag}
                    </span>
                  ))}
                  <span className="text-xs text-app-muted ml-2">
                    Status: {element.status}
                  </span>
                </div>
              </div>
              <div className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                <span className="text-xs font-semibold">Assign Now</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
