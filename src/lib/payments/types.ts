export interface SubscriptionCheckoutData {
  organizationId: string
  orgName?: string
  tierId: 'free' | 'premium' | 'enterprise'
  amount: number
  currency: string
  autoRenew: boolean
  customerEmail: string
}

export interface CheckoutResult {
  ok: boolean
  url?: string
  error?: string
}

export interface WebhookEvent {
  type: string
  data: any
  rawBody: string
  signature: string
}

export interface PaymentGatewayAdapter {
  initializeTransaction(data: SubscriptionCheckoutData): Promise<CheckoutResult>
  verifyWebhookSignature(event: WebhookEvent): boolean
  createCustomer?(email: string, name?: string): Promise<string>
}
