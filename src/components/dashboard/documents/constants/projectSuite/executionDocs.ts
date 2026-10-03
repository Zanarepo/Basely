import { ShieldCheck, SlidersHorizontal, BarChart3, FileText, Compass, CheckCircle2 } from 'lucide-react'
import { DocumentItem } from '../types'

export const executionDocs: DocumentItem[] = [
  {
    id: 'risk_register',
    title: 'Risk Register',
    category: 'execution',
    suite: 'project',
    icon: ShieldCheck,
    description: 'Probability/impact scoring, risk responses, mitigation owners & contingency plans.',
    badge: 'Execution',
    guide: {
      purpose: 'Identifies, assesses, and manages project risks before they impact schedule or cost.',
      audience: 'Project Team, Risk Manager, Steering Committee',
      bestPractices: [
        'Assign a dedicated risk owner to every high-severity item.',
        'Review risk probability and impact ratings weekly.',
      ],
    },
  },
  {
    id: 'issue_log',
    title: 'Issue Log',
    category: 'execution',
    suite: 'project',
    icon: SlidersHorizontal,
    description: 'Active project issues, resolution tracking, severity levels, and target fix dates.',
    badge: 'Execution',
    guide: {
      purpose: 'Tracks active issues causing project variance and ensures timely resolution.',
      audience: 'Project Manager, Execution Team, Subcontractors',
      bestPractices: [
        'Differentiate between future Risks and current active Issues.',
        'Escalate unresolved critical issues to the Steering Committee.',
      ],
    },
  },
  {
    id: 'meeting_minutes',
    title: 'Meeting Minutes',
    category: 'execution',
    suite: 'project',
    icon: FileText,
    description: 'Structured meeting notes, attendee rosters, key decisions, and action item logs.',
    badge: 'Execution',
    guide: {
      purpose: 'Captures decisions, action items, and owners from project alignment meetings.',
      audience: 'Meeting Attendees, Project Team',
      bestPractices: [
        'Distribute minutes within 24 hours of meeting conclusion.',
        'Track action item completion status in weekly standups.',
      ],
    },
  },
  {
    id: 'change_requests',
    title: 'Change Requests',
    category: 'execution',
    suite: 'project',
    icon: SlidersHorizontal,
    description: 'Formal change proposals, impact evaluations, CCB decisions, and sign-offs.',
    badge: 'Execution',
    guide: {
      purpose: 'Evaluates the impact of proposed changes on project baselines before approval.',
      audience: 'Change Control Board, Project Manager, Sponsor',
      bestPractices: [
        'Quantify exact cost and schedule impacts in days/currency.',
        'Obtain sponsor approval for baseline modifications.',
      ],
    },
  },
  {
    id: 'deployment_report',
    title: 'Deployment Report',
    category: 'execution',
    suite: 'project',
    icon: Compass,
    description: 'Production deployment checklist, environment readiness, and go-live verification.',
    badge: 'Execution',
    guide: {
      purpose: 'Documents deployment readiness, release steps, and post-deployment sanity checks.',
      audience: 'DevOps, Site Leads, Tech Leads',
      bestPractices: [
        'Include an explicit Rollback Procedure in case of critical failures.',
        'Conduct dry-run deployments in staging prior to production go-live.',
      ],
    },
  },
  {
    id: 'test_summary_report',
    title: 'Test Summary Report',
    category: 'execution',
    suite: 'project',
    icon: ShieldCheck,
    description: 'QA test execution metrics, defect pass/fail rates, and acceptance sign-offs.',
    badge: 'Execution',
    guide: {
      purpose: 'Summarizes testing results and defect metrics prior to release sign-off.',
      audience: 'QA Manager, Product Manager, Tech Lead',
      bestPractices: [
        'Verify zero unresolved Blocker/Critical defects.',
        'Attach automated test coverage reports.',
      ],
    },
  },
  {
    id: 'deliverables',
    title: 'Deliverable Sign-offs',
    category: 'execution',
    suite: 'project',
    icon: CheckCircle2,
    description: 'Formal milestone deliverable acceptance forms and client sign-off sheets.',
    badge: 'Execution',
    guide: {
      purpose: 'Records client or sponsor formal acceptance of completed project deliverables.',
      audience: 'Client Representative, Sponsor, Project Manager',
      bestPractices: [
        'Attach explicit acceptance criteria verification logs.',
        'Obtain signed approval before billing milestone payments.',
      ],
    },
  },
]
