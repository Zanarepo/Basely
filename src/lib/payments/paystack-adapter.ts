import crypto from 'crypto'
import { PaymentGatewayAdapter, SubscriptionCheckoutData, CheckoutResult, WebhookEvent } from './types'

export class PaystackAdapter implements PaymentGatewayAdapter {
  private secretKey: string
  private baseUrl = 'https://api.paystack.co'

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || ''
    if (!this.secretKey) {
      console.warn('Missing PAYSTACK_SECRET_KEY in environment variables')
    }
  }

  private async fetchApi(endpoint: string, method: string = 'GET', body?: any) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })
    const data = await res.json()
    if (!res.ok) {
      console.error('Paystack API Error:', data)
      throw new Error(data.message || 'Paystack API Request failed')
    }
    return data
  }

  async initializeTransaction(data: SubscriptionCheckoutData): Promise<CheckoutResult> {
    try {
      // If Auto-Renew, we dynamically create a Plan first
      let planCode: string | undefined = undefined

      if (data.autoRenew) {
        // Create a plan on the fly for this specific price
        // Amount in kobo/cents for Paystack (multiply by 100)
        const orgName = data.orgName ? data.orgName : 'Workspace'
        const planData = await this.fetchApi('/plan', 'POST', {
          name: `${orgName} ${data.tierId.toUpperCase()} - ${data.organizationId}`,
          amount: data.amount * 100, 
          interval: 'monthly',
          currency: data.currency
        })
        planCode = planData.data.plan_code
      }

      const txBody: any = {
        email: data.customerEmail,
        amount: data.amount * 100, // Paystack requires smallest currency unit
        currency: data.currency,
        reference: `txn_${data.organizationId}_${Date.now()}`,
        metadata: {
          custom_fields: [
            {
              display_name: 'Organization ID',
              variable_name: 'organization_id',
              value: data.organizationId
            },
            {
              display_name: 'Target Tier',
              variable_name: 'target_tier',
              value: data.tierId
            },
            {
              display_name: 'Auto Renew',
              variable_name: 'auto_renew',
              value: data.autoRenew.toString()
            }
          ]
        }
      }

      if (planCode) {
        txBody.plan = planCode
      }

      const txData = await this.fetchApi('/transaction/initialize', 'POST', txBody)
      
      return {
        ok: true,
        url: txData.data.authorization_url
      }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  }

  verifyWebhookSignature(event: WebhookEvent): boolean {
    const hash = crypto.createHmac('sha512', this.secretKey).update(event.rawBody).digest('hex')
    return hash === event.signature
  }
}
