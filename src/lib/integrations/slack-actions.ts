'use server'

export async function testSlackWebhook(webhookUrl: string) {
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
        text: 'Hello from BasePro! 🎉 Your integration is working perfectly.'
      })
    })

    if (!res.ok) {
      return { success: false, error: await res.text() }
    }
    
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Failed to send request' }
  }
}
