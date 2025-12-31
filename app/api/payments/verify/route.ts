import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()
    const supabase = await createClient()

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get payment record
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', reference)
      .eq('user_id', user.id)
      .single()

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Type the payment properly
    const typedPayment = payment as any

    // Get Paystack secret key
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('key', 'paystack_secret_key')
      .single()

    // Type the settings properly
    const typedSettings = settings as any
    const paystackSecretKey = typedSettings?.value || process.env.PAYSTACK_SECRET_KEY

    // Verify payment with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
        },
      }
    )

    const verifyData = await verifyResponse.json()

    if (verifyData.status && verifyData.data.status === 'success') {
      // Update payment status - use upsert to avoid typing issue
      await supabase
        .from('payments')
        .upsert({
          id: typedPayment.id,
          status: 'completed',
          verified_at: new Date().toISOString(),
          metadata: verifyData.data,
        } as any)
        .eq('id', typedPayment.id)

      // Update election status - use upsert to avoid typing issue
      await supabase
        .from('elections')
        .upsert({
          id: typedPayment.election_id,
          payment_verified: true,
          status: 'paid',
        } as any)
        .eq('id', typedPayment.election_id)

      return NextResponse.json({ success: true, verified: true })
    } else {
      // Update payment as failed - use upsert to avoid typing issue
      await supabase
        .from('payments')
        .upsert({
          id: typedPayment.id,
          status: 'failed'
        } as any)
        .eq('id', typedPayment.id)

      return NextResponse.json({ success: false, verified: false })
    }
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}