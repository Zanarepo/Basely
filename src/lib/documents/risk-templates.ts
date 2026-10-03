import type { DocumentSectionDef } from './types'

export interface RiskTemplateVariant {
  id: string
  name: string
  subtitle: string
  category: 'standard' | 'enterprise' | 'agile'
  bestFor: string
  iconName: string
  section_definitions: DocumentSectionDef[]
}

export const RISK_TEMPLATE_VARIANTS: Record<string, RiskTemplateVariant> = {
  default_risk_register: {
    id: 'default_risk_register',
    name: 'Default Risk Profile',
    subtitle: 'A data-bound risk log and executive summary.',
    category: 'standard',
    bestFor: 'Projects utilizing the dynamic risk register database.',
    iconName: 'AlertTriangle',
    section_definitions: [
      { key: 'executive_summary', title: 'Risk Summary & Profile', type: 'free_text', placeholder: 'High-level risk management overview.' },
      { key: 'risk_log', title: 'Detailed Risk & Mitigation Log', type: 'data_bound', source: 'register.risks' }
    ]
  },
  standard_risk_register: {
    id: 'standard_risk_register',
    name: 'Standard Risk Register',
    subtitle: 'Comprehensive 10-point risk register with assessment matrices and escalation paths.',
    category: 'enterprise',
    bestFor: 'Formal projects requiring a structured approach to risk management and tracking.',
    iconName: 'ShieldAlert',
    section_definitions: [
      { key: 'purpose', title: '1. Purpose', type: 'free_text', placeholder: 'Purpose of the risk register...' },
      { key: 'risk_management_approach', title: '2. Risk Management Approach', type: 'free_text', placeholder: 'Proactive risk management process steps...' },
      { key: 'risk_assessment_matrix', title: '3. Risk Assessment Matrix', type: 'free_text', placeholder: 'Probability Scale, Impact Scale, and Priority Matrix...' },
      { key: 'risk_register', title: '4. Risk Register', type: 'free_text', placeholder: 'Risk ID | Category | Probability | Impact | Score | Priority | Mitigation | Contingency | Owner | Status' },
      { key: 'top_project_risks', title: '5. Top Project Risks', type: 'free_text', placeholder: 'Risks requiring immediate attention...' },
      { key: 'risk_response_strategies', title: '6. Risk Response Strategies', type: 'free_text', placeholder: 'Avoid, Mitigate, Transfer, Accept...' },
      { key: 'risk_monitoring', title: '7. Risk Monitoring', type: 'free_text', placeholder: 'How risks are tracked and reviewed...' },
      { key: 'risk_escalation_process', title: '8. Risk Escalation Process', type: 'free_text', placeholder: 'Escalation paths based on priority...' },
      { key: 'risk_review_schedule', title: '9. Risk Review Schedule', type: 'free_text', placeholder: 'Frequency of risk reviews...' },
      { key: 'approval', title: '10. Approval', type: 'free_text', placeholder: 'Role | Responsibility | Sign-off' }
    ]
  }
}
