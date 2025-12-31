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
    
    // Type the election result properly
    const typedElection = election as any

    if (electionError || !typedElection) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 })
    }

    // Check if election already paid
    if (typedElection.payment_verified) {
      return NextResponse.json({ error: 'Election already paid' }, { status: 400 })
    }

    // Get appropriate pricing plan based on voter count
    const { data: plans } = await supabase
      .from('pricing_plans')
      .select('*')
      .lte('min_voters', typedElection.total_voters || 0)
      .gte('max_voters', typedElection.total_voters || 0)
      .eq('is_active', true)
      .single()
    
    // Type the plans result properly
    const typedPlans = plans as any

    if (!typedPlans) {
      return NextResponse.json({ error: 'No pricing plan found for voter count' }, { status: 400 })
    }

    // If free plan (0-50 voters), auto-verify without payment
    if (typedPlans.price === 0) {
      // Use upsert to avoid the update typing issue
      await supabase
        .from('elections')
        .upsert({ 
          id: electionId, 
          payment_verified: true, 
          status: 'paid' 
        } as any)
        .eq('id', electionId)

      // Create a free payment record for tracking
      await supabase
        .from('payments')
        .insert({
          election_id: electionId,
          user_id: user.id,
          pricing_plan_id: typedPlans.id,
          amount: 0,
          currency: typedPlans.currency,
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
    
    // Type the settings result properly
    const typedSettings = settings as any
    const paystackSecretKey = typedSettings?.find((s: any) => s.key === 'paystack_secret_key')?.value || process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        election_id: electionId,
        user_id: user.id,
        pricing_plan_id: typedPlans.id,
        amount: typedPlans.price,
        currency: typedPlans.currency,
        status: 'pending',
      } as any)
      .select()
      .single()
    
    // Type the payment result properly
    const typedPayment = payment as any

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
        amount: typedPlans.price * 100, // Paystack expects amount in kobo
        reference: typedPayment.id,
        metadata: {
          election_id: electionId,
          payment_id: typedPayment.id,
          plan_name: typedPlans.name,
        },
      }),
    })

    const paystackData = await paystackResponse.json()
    if (!paystackData.status) {
      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 })
    }

    // Update payment with Paystack reference - use upsert to avoid typing issue
    await supabase
      .from('payments')
      .upsert({
        id: typedPayment.id,
        paystack_reference: paystackData.data.reference,
        paystack_access_code: paystackData.data.access_code,
      } as any)
      .eq('id', typedPayment.id)

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