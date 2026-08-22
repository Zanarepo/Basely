export interface HandoverTemplateVariant {
  id: string
  name: string
  subtitle: string
  category: 'standard' | 'enterprise' | 'agile'
  iconName: string
  section_definitions: Array<{
    key: string
    title: string
    type: 'free_text' | 'data_bound'
    source?: string
  }>
}

export const HANDOVER_TEMPLATE_VARIANTS: Record<string, HandoverTemplateVariant> = {
  standard_handover: {
    id: 'standard_handover',
    name: 'Default Handover Document',
    subtitle: 'Classic operations transition document matching the original layout.',
    category: 'standard',
    iconName: 'FileCheck',
    section_definitions: [
      { key: 'operational_instructions', title: 'Operational & Acceptance Instructions', type: 'free_text' },
      { key: 'deliverables_summary', title: 'Transferred WBS Deliverables', type: 'data_bound', source: 'closure.deliverables_table' },
      { key: 'ongoing_owners', title: 'Ongoing Ownership & Support RACI', type: 'data_bound', source: 'closure.ongoing_owners' },
      { key: 'support_escalation', title: 'Support & Escalation Procedures', type: 'free_text' },
      { key: 'transition_notes', title: 'Transition & Archival Notes', type: 'free_text' }
    ]
  },
  technical_handover: {
    id: 'technical_handover',
    name: 'Technical / IT Service Handover',
    subtitle: 'Detailed IT systems, infrastructure, and code transition plan.',
    category: 'enterprise',
    iconName: 'Zap',
    section_definitions: [
      { key: 'system_architecture', title: 'System Architecture & Infrastructure', type: 'free_text' },
      { key: 'operational_instructions', title: 'Runbooks & Operational Instructions', type: 'free_text' },
      { key: 'security_compliance', title: 'Security & Compliance Controls', type: 'free_text' },
      { key: 'support_escalation', title: 'L1/L2/L3 Support Escalation Matrix', type: 'free_text' },
      { key: 'known_issues', title: 'Known Issues & Tech Debt', type: 'free_text' }
    ]
  },
  client_handover: {
    id: 'client_handover',
    name: 'Customer / Client Handover',
    subtitle: 'Client-facing transition document for external project delivery.',
    category: 'enterprise',
    iconName: 'Users',
    section_definitions: [
      { key: 'executive_context', title: 'Executive Summary & Project Outcomes', type: 'free_text' },
      { key: 'deliverables_summary', title: 'Final Deliverables Acceptance', type: 'free_text' },
      { key: 'training_materials', title: 'User Training & Documentation', type: 'free_text' },
      { key: 'ongoing_owners', title: 'Client Ownership & Administrator Roles', type: 'free_text' },
      { key: 'warranty_support', title: 'Warranty Period & Ongoing Support', type: 'free_text' }
    ]
  },
  agile_handover: {
    id: 'agile_handover',
    name: 'Agile Product Handover',
    subtitle: 'Continuous delivery handover for product increments.',
    category: 'agile',
    iconName: 'Layers',
    section_definitions: [
      { key: 'release_summary', title: 'Release Summary & Feature Notes', type: 'free_text' },
      { key: 'operational_instructions', title: 'Operational Changes & Feature Flags', type: 'free_text' },
      { key: 'support_escalation', title: 'Product Support & Escalation', type: 'free_text' },
      { key: 'backlog_transfer', title: 'Remaining Backlog & Next Steps', type: 'free_text' }
    ]
  },
  minimal_handover: {
    id: 'minimal_handover',
    name: 'Minimal Handover Protocol',
    subtitle: 'Streamlined transition notes for small or internal projects.',
    category: 'standard',
    iconName: 'FileText',
    section_definitions: [
      { key: 'executive_context', title: 'Summary & Scope', type: 'free_text' },
      { key: 'operational_instructions', title: 'Operational Instructions', type: 'free_text' },
      { key: 'ongoing_owners', title: 'Ownership & Support', type: 'free_text' }
    ]
  },
  physical_construction_handover: {
    id: 'physical_construction_handover',
    name: 'Physical / Construction Handover',
    subtitle: 'O&M manuals, physical asset transfer, and site handover protocol.',
    category: 'enterprise',
    iconName: 'HardHat',
    section_definitions: [
      { key: 'executive_context', title: 'Site summary & Project Scope', type: 'free_text' },
      { key: 'safety_compliance', title: 'Safety & Compliance Certificates', type: 'free_text' },
      { key: 'om_manuals', title: 'O&M Manuals & As-Built Drawings', type: 'free_text' },
      { key: 'asset_inventory', title: 'Physical Asset Inventory & Keys', type: 'free_text' },
      { key: 'warranty_defects', title: 'Warranty Terms & Defects Liability Period', type: 'free_text' },
      { key: 'ongoing_owners', title: 'Facility Management Ownership', type: 'free_text' }
    ]
  }
}
