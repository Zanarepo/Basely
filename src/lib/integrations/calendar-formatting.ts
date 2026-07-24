export function buildGoogleCalendarEventBody(
  milestone: any,
  projectId: string,
  taskDeps: any[] | undefined,
  appUrl: string
) {
  const eventId = milestone.id.replace(/-/g, '') // UUIDs without hyphens are valid base32hex (a-f, 0-9)

  const isMilestone = milestone.type === 'Milestone'
  
  // 1. Status Indicator & Prefix
  const wbsData = milestone.wbs_elements as any
  const statusRaw = wbsData?.status || 'Not Started'
  const statusEmoji = statusRaw === 'Completed' ? '✅' : statusRaw === 'In Progress' ? '⏳' : '⚪'
  const prefix = isMilestone ? '🎯 Milestone' : '📅 Task'
  const summary = `${prefix}: ${milestone.name}`

  // 2. Dates
  const startDateStr = milestone.es || milestone.constraint_date || new Date().toISOString().split('T')[0]
  const endDateStr = milestone.ef || milestone.constraint_date || startDateStr

  // 3. Description formatting (Using HTML for Google Calendar)
  let descriptionStr = `<b>Status:</b> ${statusEmoji} ${statusRaw}<br/><br/>`
  if (wbsData) {
    if (wbsData.description) {
      descriptionStr += `<b>Description:</b><br/><i>${wbsData.description}</i><br/><br/>`
    }
    
    if (wbsData.deliverables_data && wbsData.deliverables_data.length > 0) {
      const validDeliverables = wbsData.deliverables_data.filter((d: any) => d.text && d.text.trim().length > 0)
      if (validDeliverables.length > 0) {
        descriptionStr += `<b>Deliverables:</b><br/>`
        validDeliverables.forEach((d: any) => {
          descriptionStr += `${d.completed ? '✅' : '⬜'} ${d.text}<br/>`
        })
        descriptionStr += '<br/>'
      }
    }

    if (wbsData.acceptance_criteria_data && wbsData.acceptance_criteria_data.length > 0) {
      const validCriteria = wbsData.acceptance_criteria_data.filter((c: any) => c.text && c.text.trim().length > 0)
      if (validCriteria.length > 0) {
        descriptionStr += `<b>Acceptance Criteria:</b><br/>`
        validCriteria.forEach((c: any) => {
          descriptionStr += `${c.completed ? '✅' : '⬜'} ${c.text}<br/>`
        })
        descriptionStr += '<br/>'
      }
    }

    // Find Accountable person
    const accountableAssignment = wbsData.raci_assignments?.find((r: any) => r.role_type === 'Accountable')
    if (accountableAssignment && accountableAssignment.stakeholders) {
      const st = accountableAssignment.stakeholders
      descriptionStr += `<b>Accountable:</b> ${st.name} ${st.email ? `(<a href="mailto:${st.email}">${st.email}</a>)` : ''}<br/><br/>`
    }
  }

  // 4. Dependencies
  if (taskDeps && taskDeps.length > 0) {
    descriptionStr += `<b>Dependencies (Predecessors):</b><br/>`
    taskDeps.forEach((d: any) => {
      const lagStr = d.lag > 0 ? ` + ${d.lag} days` : (d.lag < 0 ? ` - ${Math.abs(d.lag)} days` : '')
      descriptionStr += `⏳ ${d.name} <i>(${d.type}${lagStr})</i>${d.scheduleStr} | <b>R:</b> ${d.responsibleStr}<br/>`
    })
    descriptionStr += '<br/>'
  }

  // 5. Deep Link
  const deepLink = `${appUrl}/dashboard/projects/${projectId}?tab=wbs&elementId=${milestone.wbs_element_id}`
  descriptionStr += `<hr/><br/>🔗 <a href="${deepLink}"><b>View Task in BasePro</b></a><br/><i>Synced from BasePro App</i>`

  // 6. Color Coding
  // Google Calendar Colors: 11 = Red (Tomato), 9 = Blue (Blueberry), 5 = Yellow (Banana), 10 = Green (Basil)
  let colorId = isMilestone ? '11' : '9' // Default: Milestones Red, Tasks Blue
  if (statusRaw === 'Completed') {
    colorId = '10' // Green if completed!
  }

  return {
    id: eventId,
    summary: summary,
    description: descriptionStr,
    colorId: colorId,
    start: {
      date: new Date(startDateStr).toISOString().split('T')[0],
    },
    end: {
      // Google all-day events require the end date to be exclusive (the next day)
      date: new Date(new Date(endDateStr).getTime() + 86400000).toISOString().split('T')[0],
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // Email 1 day before
        { method: 'popup', minutes: 9 * 60 }   // Popup reminder at 9 AM the day of
      ]
    },
    extendedProperties: {
      private: {
        milestoneId: milestone.id,
        projectId: projectId
      }
    }
  }
}
