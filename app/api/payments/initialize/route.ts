import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { electionId } = await request.json()
    const supabase = await createClient()

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get election details
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select('*, creator_id, total_voters')
      .eq('id', electionId)
      .eq('creator_id', user.id)
      .single()

    if (electionError || !election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 })
    }

    // Check if election already paid
    if (election.payment_verified) {
      return NextResponse.json({ error: 'Election already paid' }, { status: 400 })
    }

    // Get appropriate pricing plan based on voter count
    const { data: plans } = await supabase
      .from('pricing_plans')
      .select('*')
      .lte('min_voters', election.total_voters || 0)
      .gte('max_voters', election.total_voters || 0)
      .eq('is_active', true)
      .single()

    if (!plans) {
      return NextResponse.json({ error: 'No pricing plan found for voter count' }, { status: 400 })
    }

    // If free plan (0-50 voters), auto-verify without payment
    if (plans.price === 0) {
      await supabase
        .from('elections')
        .update({ payment_verified: true, status: 'paid' } as any)
        .eq('id', electionId)

      // Create a free payment record for tracking
      await supabase
        .from('payments')
        .insert({
          election_id: electionId,
          user_id: user.id,
          pricing_plan_id: plans.id,
          amount: 0,
          currency: plans.currency,
          status: 'completed',
          verified_at: new Date().toISOString(),
        } as any)

      return NextResponse.json({ 
        success: true, 
        free: true,
        message: 'Free plan activated successfully'
      })
    }

    // Get Paystack keys from settings
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('*')
      .in('key', ['paystack_public_key', 'paystack_secret_key'])

    const paystackSecretKey = settings?.find(s => s.key === 'paystack_secret_key')?.value || process.env.PAYSTACK_SECRET_KEY

    if (!paystackSecretKey) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        election_id: electionId,
        user_id: user.id,
        pricing_plan_id: plans.id,
        amount: plans.price,
        currency: plans.currency,
        status: 'pending',
      } as any)
      .select()
      .single()

    if (paymentError) {
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
    }

    // Initialize Paystack transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: plans.price * 100, // Paystack expects amount in kobo
        reference: payment.id,
        metadata: {
          election_id: electionId,
          payment_id: payment.id,
          plan_name: plans.name,
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 })
    }

    // Update payment with Paystack reference
    await supabase
      .from('payments')
      .update({
        paystack_reference: paystackData.data.reference,
        paystack_access_code: paystackData.data.access_code,
      } as any)
      .eq('id', payment.id)

    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
    })

  } catch (error) {
    console.error('Payment initialization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
