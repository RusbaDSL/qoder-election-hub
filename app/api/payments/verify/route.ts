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

    // Get Paystack secret key
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('key', 'paystack_secret_key')
      .single()

    const paystackSecretKey = (settings?.value as any) || process.env.PAYSTACK_SECRET_KEY

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
      // Update payment status
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          verified_at: new Date().toISOString(),
          metadata: verifyData.data,
        } as any)
        .eq('id', payment.id)

      // Update election status
      await supabase
        .from('elections')
        .update({
          payment_verified: true,
          status: 'paid',
        } as any)
        .eq('id', (payment as any).election_id)

      return NextResponse.json({ success: true, verified: true })
    } else {
      // Update payment as failed
      await supabase
        .from('payments')
        .update({ status: 'failed' } as any)
        .eq('id', payment.id)

      return NextResponse.json({ success: false, verified: false })
    }
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
