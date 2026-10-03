import { CheckCircle2, BookOpen, FileText, Compass, BarChart3 } from 'lucide-react'
import { DocumentItem } from '../types'

export const closureDocs: DocumentItem[] = [
  {
    id: 'closure_report',
    title: 'Closure Report',
    category: 'closure',
    suite: 'project',
    icon: CheckCircle2,
    description: 'Final deliverable sign-offs, financial reconciliation, and operational transition.',
    badge: 'Closure',
    guide: {
      purpose: 'Formally closes the project, transitions deliverables to operations, and releases resources.',
      audience: 'Project Sponsor, Operations Team, PMO',
      bestPractices: [
        'Verify all open change requests and sign-offs are finalized.',
        'Conduct a Lessons Learned retrospective before team release.',
      ],
    },
  },
  {
    id: 'lessons_learned',
    title: 'Lessons Learned',
    category: 'closure',
    suite: 'project',
    icon: BookOpen,
    description: 'Retrospective findings, what went well, opportunities for improvement & assets.',
    badge: 'Closure',
    guide: {
      purpose: 'Captures organizational process learnings to improve future project execution.',
      audience: 'PMO, Future Project Teams, Leadership',
      bestPractices: [
        'Conduct retrospective interviews across all project roles.',
        'Archive reusable templates and process improvements in PMO repository.',
      ],
    },
  },
  {
    id: 'release_notes',
    title: 'Release Notes',
    category: 'closure',
    suite: 'project',
    icon: FileText,
    description: 'User-facing release documentation, new feature summaries, and bug fix logs.',
    badge: 'Closure',
    guide: {
      purpose: 'Communicates new functionality and fixes to end users and support teams.',
      audience: 'End Users, Customer Support, Sales',
      bestPractices: [
        'Highlight customer-facing benefits over technical implementation details.',
        'Link to user documentation guides.',
      ],
    },
  },
  {
    id: 'handover_document',
    title: 'Final Handover',
    category: 'closure',
    suite: 'project',
    icon: Compass,
    description: 'Operational handover protocol, maintenance SOPs, and support escalation paths.',
    badge: 'Closure',
    guide: {
      purpose: 'Transitions project deliverables to operational support and maintenance teams.',
      audience: 'Operations Lead, Support Team, System Admin',
      bestPractices: [
        'Provide comprehensive Standard Operating Procedures (SOPs).',
        'Conduct knowledge transfer workshops prior to sign-off.',
      ],
    },
  },
  {
    id: 'post_implementation_review',
    title: 'PIR & ROI Review',
    category: 'closure',
    suite: 'project',
    icon: BarChart3,
    description: 'Post-implementation evaluation of business benefit realization & ROI.',
    badge: 'Closure',
    guide: {
      purpose: 'Measures actual business ROI achieved against the original business case after 3-6 months.',
      audience: 'Executive Sponsor, Financial Controller, PMO',
      bestPractices: [
        'Evaluate actual revenue/cost savings against baseline projections.',
        'Document operational bottlenecks impacting adoption.',
      ],
    },
  },
  {
    id: 'signoff_board',
    title: 'Closure Sign-offs',
    category: 'closure',
    suite: 'project',
    icon: CheckCircle2,
    description: 'Executive committee formal closure authorization and contract release board.',
    badge: 'Closure',
    guide: {
      purpose: 'Obtains final executive and legal sign-off to formally close contract liabilities.',
      audience: 'Executive Board, Legal, Project Sponsor',
      bestPractices: [
        'Verify contract liabilities and vendor payments are settled.',
        'Archive all project records in compliance repository.',
      ],
    },
  },
]
