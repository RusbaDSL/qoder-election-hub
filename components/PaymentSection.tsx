'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DollarSign, CheckCircle, AlertCircle } from 'lucide-react'

interface PaymentSectionProps {
  electionId: string
}

export default function PaymentSection({ electionId }: PaymentSectionProps) {
  const [election, setElection] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      // Fetch election data
      const { data: electionData } = await supabase
        .from('elections')
        .select('*')
        .eq('id', electionId)
        .single()

      if (electionData) {
        setElection(electionData)
        
        // Type the electionData properly
        const typedElectionData = electionData as any

        // Fetch pricing plan based on voter count
        const { data: planData } = await supabase
          .from('pricing_plans')
          .select('*')
          .lte('min_voters', typedElectionData.total_voters || 0)
          .gte('max_voters', typedElectionData.total_voters || 0)
          .eq('is_active', true)
          .single()

        if (planData) {
          setPlan(planData)
        }
      }

      // Fetch payment if exists
      const { data: paymentData } = await supabase
        .from('payments')
        .select('*')
        .eq('election_id', electionId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (paymentData && paymentData.length > 0) {
        setPayment(paymentData[0])
      }
      
      setLoading(false)
    }
    
    fetchData()
  }, [electionId])

  const handlePayment = async () => {
    setProcessing(true)

    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ electionId }),
      })

      const data = await response.json()

      if (data.free) {
        alert('This election is free! No payment required.')
        // Fetch data again to update state
        const { data: electionData } = await supabase
          .from('elections')
          .select('*')
          .eq('id', electionId)
          .single()

        if (electionData) {
          setElection(electionData)
          
          // Type the electionData properly
          const typedElectionData = electionData as any

          const { data: planData } = await supabase
            .from('pricing_plans')
            .select('*')
            .lte('min_voters', typedElectionData.total_voters || 0)
            .gte('max_voters', typedElectionData.total_voters || 0)
            .eq('is_active', true)
            .single()

          if (planData) {
            setPlan(planData)
          }
        }

        // Fetch payment if exists
        const { data: paymentData } = await supabase
          .from('payments')
          .select('*')
          .eq('election_id', electionId)
          .order('created_at', { ascending: false })
          .limit(1)

        if (paymentData && paymentData.length > 0) {
          setPayment(paymentData[0])
        }
      } else if (data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url
      } else {
        alert('Failed to initialize payment')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('An error occurred while processing payment')
    }

    setProcessing(false)
  }

  if (loading) {
    return <div className="text-center py-8">Loading payment information...</div>
  }

  if (!election || !plan) {
    return <div className="text-center py-8 text-gray-500">Unable to load payment information</div>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Plan Selection Info */}
      <div className={`border rounded-lg p-6 ${
        election.total_voters <= 50 
          ? 'bg-green-50 border-green-200' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <DollarSign className={`h-6 w-6 ${
            election.total_voters <= 50 ? 'text-green-600' : 'text-blue-600'
          }`} />
          <h3 className={`text-lg font-semibold ${
            election.total_voters <= 50 ? 'text-green-900' : 'text-blue-900'
          }`}>
            {election.total_voters <= 50 ? 'Free Plan Available' : 'Paid Plan Required'}
          </h3>
        </div>
        <p className={`text-sm ${
          election.total_voters <= 50 ? 'text-green-700' : 'text-blue-700'
        }`}>
          {election.total_voters <= 50 
            ? `Your election has ${election.total_voters} voters and qualifies for our free plan. Click the button below to activate.`
            : `Your election has ${election.total_voters} voters and requires a paid plan to proceed with voting.`
          }
        </p>
      </div>

      {/* Payment Status */}
      {election.payment_verified ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-green-900">Payment Verified</h3>
              <p className="text-sm text-green-700">Your election has been paid for and is ready to go live.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-yellow-900">Payment Required</h3>
              <p className="text-sm text-yellow-700">
                Please complete payment to activate voting for this election.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <DollarSign className="h-6 w-6 mr-2 text-blue-600" />
          Pricing Details
        </h3>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="text-gray-700">Number of Voters:</span>
            <span className="font-semibold text-gray-900">{election.total_voters}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="text-gray-700">Selected Plan:</span>
            <span className="font-semibold text-gray-900">{plan.name}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="text-gray-700">Plan Range:</span>
            <span className="text-sm text-gray-600">
              {plan.min_voters} - {plan.max_voters} voters
            </span>
          </div>

          <div className="flex justify-between items-center py-4 bg-gray-50 rounded-lg px-4">
            <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
            <span className="text-2xl font-bold text-blue-600">
              {formatCurrency(plan.price)}
            </span>
          </div>
        </div>

        {!election.payment_verified && (
          <div className="mt-6">
            {plan.price === 0 ? (
              <div>
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Activate Free Election'}
                </button>
                <p className="mt-2 text-sm text-green-700 text-center">
                  Your election qualifies for our free plan!
                </p>
              </div>
            ) : (
              <div>
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : `Pay ${formatCurrency(plan.price)}`}
                </button>
                <p className="mt-2 text-sm text-gray-600 text-center">
                  Payment required for elections with more than 50 voters
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment History */}
      {payment && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-semibold ${
                payment.status === 'completed' ? 'text-green-600' :
                payment.status === 'pending' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {payment.status.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold">{formatCurrency(payment.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="text-gray-900">
                {new Date(payment.created_at).toLocaleString()}
              </span>
            </div>
            {payment.paystack_reference && (
              <div className="flex justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="text-gray-900 font-mono text-xs">
                  {payment.paystack_reference}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
