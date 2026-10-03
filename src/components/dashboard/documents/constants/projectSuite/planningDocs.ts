import { Layers, Users, Compass, Clock, BarChart3, SlidersHorizontal } from 'lucide-react'
import { DocumentItem } from '../types'

export const planningDocs: DocumentItem[] = [
  {
    id: 'scope_statement',
    title: 'Scope Statement',
    category: 'planning',
    suite: 'project',
    icon: Layers,
    description: 'Detailed scope inclusions, exclusions, constraints, and deliverable boundaries.',
    badge: 'Planning',
    guide: {
      purpose: 'Prevents scope creep by defining exact project boundaries and acceptance conditions.',
      audience: 'Project Team, Clients, PMO',
      bestPractices: [
        'Include an explicit Out-of-Scope list.',
        'Define clear acceptance criteria for major milestone deliverables.',
      ],
    },
  },
  {
    id: 'communication_plan',
    title: 'Communication Plan',
    category: 'planning',
    suite: 'project',
    icon: Users,
    description: 'Stakeholder update cadences, reporting formats, escalation protocols, and channels.',
    badge: 'Planning',
    guide: {
      purpose: 'Defines how and when information is distributed to project stakeholders.',
      audience: 'Project Team, Stakeholders, External Clients',
      bestPractices: [
        'Establish standard templates for weekly status updates.',
        'Specify explicit escalation channels for project emergencies.',
      ],
    },
  },
  {
    id: 'procurement_plan',
    title: 'Procurement Plan',
    category: 'planning',
    suite: 'project',
    icon: Compass,
    description: 'Vendor management, contract types, SOW specs, and procurement schedules.',
    badge: 'Planning',
    guide: {
      purpose: 'Governs external vendor sourcing, contracts, and material acquisitions.',
      audience: 'Procurement Leads, Legal, Project Manager',
      bestPractices: [
        'Detail Make-vs-Buy decisions for major components.',
        'Set key performance SLAs for vendor contracts.',
      ],
    },
  },
  {
    id: 'schedule_document',
    title: 'Schedule Document',
    category: 'planning',
    suite: 'project',
    icon: Clock,
    description: 'Critical path schedule summary, milestone dates, and sequencing baseline.',
    badge: 'Planning',
    guide: {
      purpose: 'Documents the master project timeline, dependencies, and critical path items.',
      audience: 'Schedulers, Project Managers, Team Leads',
      bestPractices: [
        'Identify and monitor the Critical Path continuously.',
        'Baseline schedule prior to executing work packages.',
      ],
    },
  },
  {
    id: 'budget_baseline',
    title: 'Budget Baseline',
    category: 'planning',
    suite: 'project',
    icon: BarChart3,
    description: 'Cost baseline breakdown, BAC, contingency reserves, and cash flow projections.',
    badge: 'Planning',
    guide: {
      purpose: 'Establishes the approved project budget against which cost variance is measured.',
      audience: 'Financial Controller, PMO, Project Manager',
      bestPractices: [
        'Separate Management Reserve from Contingency Reserve.',
        'Track Earned Value metrics against the Cost Baseline.',
      ],
    },
  },
  {
    id: 'change_management_plan',
    title: 'Change Management Plan',
    category: 'planning',
    suite: 'project',
    icon: SlidersHorizontal,
    description: 'Scope change request workflow, CCB review thresholds, and baseline update protocol.',
    badge: 'Planning',
    guide: {
      purpose: 'Governs how changes to scope, schedule, or budget are formally requested and approved.',
      audience: 'Change Control Board, PMO, Project Manager',
      bestPractices: [
        'Require cost and schedule impact assessments for every Change Request.',
        'Maintain a centralized Change Log.',
      ],
    },
  },
]
