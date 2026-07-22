'use server'

export async function testTeamsWebhook(webhookUrl: string) {
  if (!webhookUrl) {
    return { success: false, error: 'Webhook URL is required' }
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "6264A7",
        "summary": "Integration Test",
        "sections": [{
          "activityTitle": "Hello from Baseline! 🎉",
          "activitySubtitle": "Your Microsoft Teams integration is working perfectly.",
          "markdown": true
        }]
      })
    })

    if (!res.ok) {
      return { success: false, error: await res.text() }
    }
    
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to send request' }
  }
}
