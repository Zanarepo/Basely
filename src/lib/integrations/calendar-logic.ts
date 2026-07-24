import { google } from 'googleapis'
import { createClient } from '@/utils/supabase/server'
import { buildGoogleCalendarEventBody } from './calendar-formatting'

// Initialize Google OAuth2 client using env vars
export function getGoogleOAuthClient() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/calendar/google/callback`

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

// Generate the URL the user will click to authorize the app
export function generateGoogleAuthUrl(state?: string) {
  const oauth2Client = getGoogleOAuthClient()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required to get a refresh token
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    prompt: 'consent', // Forces Google to always return a refresh token
    state
  })
}

// Push milestones to Google Calendar
export async function syncMilestonesToGoogleCalendar(connectionId: string, projectId: string) {
  const supabase = await createClient()

  // 1. Get the calendar connection
  const { data: connection, error: connError } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('id', connectionId)
    .single()

  if (connError || !connection) {
    console.error('Failed to retrieve connection', connError)
    return { ok: false, error: 'Connection not found' }
  }

  // 2. Set the credentials on the OAuth client
  const oauth2Client = getGoogleOAuthClient()
  oauth2Client.setCredentials({
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    expiry_date: connection.expires_at ? new Date(connection.expires_at).getTime() : null,
  })

  // Listen for automatic token refreshes from the Google SDK and save them to the DB
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token || tokens.access_token) {
      await supabase
        .from('calendar_connections')
        .update({
          access_token: tokens.access_token || connection.access_token,
          refresh_token: tokens.refresh_token || connection.refresh_token,
          expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : connection.expires_at
        })
        .eq('id', connectionId)
    }
  })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  // 3. Get the stakeholder profile for this user in this project
  const { data: stakeholder } = await supabase
    .from('stakeholders')
    .select('id')
    .eq('project_id', projectId)
    .eq('linked_user_id', connection.user_id)
    .single()

  let assignedWbsIds: string[] = []
  if (stakeholder) {
    const { data: assignments } = await supabase
      .from('raci_assignments')
      .select('wbs_element_id')
      .eq('stakeholder_id', stakeholder.id)

    if (assignments) {
      assignedWbsIds = assignments.map(a => a.wbs_element_id)
    }
  }

  // 4. Get the project milestones and tasks
  const { data: milestones, error } = await supabase
    .from('activities')
    .select(`
      id, name, es, ef, type, constraint_date, wbs_element_id,
      wbs_elements (
        description,
        deliverables_data,
        acceptance_criteria_data,
        raci_assignments (
          role_type,
          stakeholders (
            name,
            email
          )
        )
      )
    `)
    .eq('project_id', projectId)
    .in('type', ['Task', 'Milestone'])

  // 4b. Fetch all activities and dependencies to map predecessors
  const { data: allActivities } = await supabase
    .from('activities')
    .select(`
      id, name, es, ef, type, constraint_date, wbs_element_id,
      wbs_elements (
        status,
        description,
        deliverables_data,
        acceptance_criteria_data,
        raci_assignments (
          role_type,
          stakeholders (
            name,
            email
          )
        )
      )
    `)
    .eq('project_id', projectId)

  const { data: dependencies } = await supabase
    .from('dependencies')
    .select('successor_id, predecessor_id, type, lag_days')
    .eq('project_id', projectId)

  const depMap = new Map<string, any[]>()
  if (dependencies && allActivities) {
    const actMap = new Map(allActivities.map(a => [a.id, a]))
    dependencies.forEach(d => {
      if (!depMap.has(d.successor_id)) depMap.set(d.successor_id, [])
      
      const pred = actMap.get(d.predecessor_id)
      
      let responsibleStr = 'Unassigned'
      const wbsInfo = pred?.wbs_elements as any
      if (wbsInfo?.raci_assignments) {
        const resp = wbsInfo.raci_assignments.find((r: any) => r.role_type === 'Responsible')
        if (resp && resp.stakeholders) {
          responsibleStr = `${resp.stakeholders.name} ${resp.stakeholders.email ? `(${resp.stakeholders.email})` : ''}`
        }
      }

      const scheduleStr = (pred?.es && pred?.ef) ? ` | ${pred.es} to ${pred.ef}` : ''

      depMap.get(d.successor_id)!.push({
        name: pred?.name || 'Unknown Task',
        type: d.type,
        lag: d.lag_days,
        scheduleStr,
        responsibleStr
      })
    })
  }

  if (!milestones || milestones.length === 0) return { ok: true, message: 'No tasks or milestones to sync' }

  // 5. Filter to only sync tasks assigned to the user
  const userTasks = milestones.filter(m => assignedWbsIds.includes(m.wbs_element_id))

  if (userTasks.length === 0) return { ok: true, message: 'No tasks assigned to you to sync' }

  const results = []

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // 6. Create or update events on the user's primary calendar
  for (const milestone of userTasks) {
    try {
      const taskDeps = depMap.get(milestone.id)
      const eventBody = buildGoogleCalendarEventBody(milestone, projectId, taskDeps, appUrl)

      try {
        // Try to get the event first (this is strongly consistent, unlike searching by extended property)
        await calendar.events.get({
          calendarId: 'primary',
          eventId: eventBody.id
        })

        // If it succeeds, the event exists, so we update it
        await calendar.events.update({
          calendarId: 'primary',
          eventId: eventBody.id,
          requestBody: eventBody
        })
      } catch (err: any) {
        // If it returns a 404, it means it doesn't exist, so we create it
        if (err.code === 404) {
          await calendar.events.insert({
            calendarId: 'primary',
            requestBody: eventBody
          })
        } else {
          throw err // Re-throw if it's a different error (like 403 Forbidden)
        }
      }

      results.push({ id: milestone.id, status: 'synced' })
    } catch (e) {
      console.error(`Error syncing milestone ${milestone.name}`, e)
      results.push({ milestone: milestone.name, status: 'failed' })
    }
  }

  return { ok: true, results }
}
