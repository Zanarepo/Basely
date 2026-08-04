import { NextRequest, NextResponse } from 'next/server'
import { PaystackAdapter } from '@/lib/payments/paystack-adapter'
import { createAdminClient } from '@/utils/supabase/admin'
import { enforceDowngradeLocks, invalidateSubscriptionCache } from '@/lib/organizations/tier-logic'
import { sendDirectEmail } from '@/lib/notifications/actions'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const gateway = new PaystackAdapter()
    const isValid = gateway.verifyWebhookSignature({
      type: 'paystack',
      data: null,
      rawBody,
      signature
    })

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody)
    const supabase = createAdminClient()

    // Idempotency check: see if event.data.id or event.event was already processed
    // In Paystack, event.data.id is unique for transactions
    const eventId = event.data.id?.toString() || `${event.event}_${Date.now()}`
    
    // Check if event exists
    const { data: existingEvent } = await supabase
      .from('payment_events') 
      .select('id')
      .eq('id', eventId)
      .single()
      
    if (existingEvent) {
      return NextResponse.json({ message: 'Event already processed' })
    }

    // Save event for idempotency
    await supabase.from('payment_events').insert({
      id: eventId,
      type: event.event,
      status: 'processing'
    })

    // Process the event
    if (event.event === 'charge.success') {
      const { metadata, customer, plan } = event.data
      const customFields = metadata?.custom_fields || []
      
      const getCustomField = (name: string) => {
        const field = customFields.find((f: any) => f.variable_name === name)
        return field ? field.value : null
      }

      const orgId = getCustomField('organization_id')
      const targetTier = getCustomField('target_tier')
      const isAutoRenew = getCustomField('auto_renew') === 'true'

      if (orgId && targetTier) {
        // 1. Find existing subscription
        const { data: sub } = await supabase
          .from('organization_subscriptions')
          .select('*')
          .eq('organization_id', orgId)
          .single()
          
        const now = new Date()
        const oneMonthLater = new Date(now.setMonth(now.getMonth() + 1))

        if (sub) {
          // Update
          await supabase.from('organization_subscriptions')
            .update({
              tier_id: targetTier,
              status: 'active',
              current_period_end: oneMonthLater.toISOString()
            })
            .eq('organization_id', orgId)
        } else {
          // Insert
          await supabase.from('organization_subscriptions')
            .insert({
              organization_id: orgId,
              tier_id: targetTier,
              seat_count: 1, // Default, would need to sync properly later
              status: 'active',
              current_period_end: oneMonthLater.toISOString()
            })
        }

        // Enforce downgrade locks immediately to unlock projects on upgrade
        await enforceDowngradeLocks(orgId, targetTier as any)
        
        // Immediately invalidate the server cache so the user sees the upgrade the second they return!
        invalidateSubscriptionCache(orgId)

        // Save Paystack Customer Code to Org
        if (customer?.customer_code) {
          await supabase.from('organizations')
            .update({ payment_customer_id: customer.customer_code })
            .eq('id', orgId)
        }
      }
    } else if (event.event === 'invoice.payment_failed') {
      // Dunning / Grace period
      // Paystack failed to charge a subscription
      const customerCode = event.data.customer?.customer_code
      if (customerCode) {
        // Find org by customer code
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('payment_customer_id', customerCode)
          .single()

        if (org) {
          // Mark subscription past due. The downgrade locking logic handles enforcement.
          await supabase.from('organization_subscriptions')
            .update({ status: 'past_due' })
            .eq('organization_id', org.id)
            
          // Notify Account Managers
          const { data: assignments } = await supabase
            .from('account_assignments')
            .select('internal_staff(email)')
            .eq('organization_id', org.id)

          if (assignments && assignments.length > 0) {
            for (const assignment of assignments) {
              const staffEmail = (assignment as any).internal_staff?.email
              if (staffEmail) {
                await sendDirectEmail(staffEmail, {
                  subject: `[Urgent] Payment Failed for Organization ${org.id}`,
                  title: `Payment Failure Alert`,
                  message: `A Paystack subscription payment has failed for organization ${org.id}. The subscription has been marked as past due. Please contact the customer to resolve this issue.`,
                  actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/backoffice/tenants/${org.id}`
                }).catch(err => console.error('Failed to email account manager:', err))
              }
            }
          }
        }
      }
    }

    // Mark completed
    await supabase.from('payment_events')
      .update({ status: 'processed' })
      .eq('id', eventId)

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
