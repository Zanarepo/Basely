import { FileCheck, Layers, Users, BookOpen } from 'lucide-react'
import { DocumentItem } from '../types'

export const initiationDocs: DocumentItem[] = [
  {
    id: 'charter',
    title: 'Project Charter',
    category: 'initiation',
    suite: 'project',
    icon: FileCheck,
    description: 'High-level project mandate, objectives, budget baseline, and authority sign-off.',
    badge: 'Initiation',
    guide: {
      purpose: 'Authorizes the project, establishes project manager authority, and sets initial scope/budget constraints.',
      audience: 'Project Sponsor, PMO, Project Manager',
      bestPractices: [
        'Obtain formal sign-off from Executive Sponsor before execution.',
        'Clearly state measurable business success metrics.',
      ],
    },
  },
  {
    id: 'wbs_dictionary',
    title: 'WBS Dictionary',
    category: 'initiation',
    suite: 'project',
    icon: Layers,
    description: 'Detailed work package descriptions, deliverables, acceptance criteria, and cost estimates.',
    badge: 'Initiation',
    guide: {
      purpose: 'Provides granular details for every WBS node, defining exact deliverables and work package boundaries.',
      audience: 'Project Team, Subcontractors, Lead Engineers',
      bestPractices: [
        'Define explicit completion criteria for every work package.',
        'Assign a responsible owner to every dictionary entry.',
      ],
    },
  },
  {
    id: 'raci',
    title: 'RACI Matrix',
    category: 'initiation',
    suite: 'project',
    icon: Users,
    description: 'Responsible, Accountable, Consulted, and Informed governance assignment matrix.',
    badge: 'Initiation',
    guide: {
      purpose: 'Assigns clear operational roles across all major project deliverables.',
      audience: 'Project Manager, Steering Committee, Team Leads',
      bestPractices: [
        'Ensure exactly ONE Accountable (A) role per task.',
        'Keep Informed (I) channels streamlined to prevent noise.',
      ],
    },
  },
  {
    id: 'project_management_plan',
    title: 'Project Management Plan',
    category: 'initiation',
    suite: 'project',
    icon: BookOpen,
    description: 'Comprehensive master plan synthesizing scope, schedule, cost, and quality baselines.',
    badge: 'Initiation',
    guide: {
      purpose: 'Master integration document governing how the project is executed, monitored, and closed.',
      audience: 'PMO, Steering Committee, Project Managers',
      bestPractices: [
        'Baseline before starting execution phase.',
        'Require formal Change Control Board approval for baseline edits.',
      ],
    },
  },
  {
    id: 'stakeholder_register',
    title: 'Stakeholder Register',
    category: 'initiation',
    suite: 'project',
    icon: Users,
    description: 'Stakeholder identification, power/interest grid, and engagement strategies.',
    badge: 'Initiation',
    guide: {
      purpose: 'Maps key stakeholders, their expectations, and communication frequency.',
      audience: 'Project Manager, Change Lead, Executive Sponsor',
      bestPractices: [
        'Categorize stakeholders by Power vs. Interest matrix.',
        'Review monthly to adapt engagement strategies.',
      ],
    },
  },
]
