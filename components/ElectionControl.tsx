'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Play, Pause, CheckCircle, AlertCircle } from 'lucide-react'

interface ElectionControlProps {
  election: any
  onUpdate: () => void
}

export default function ElectionControl({ election, onUpdate }: ElectionControlProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const canStartVoting = () => {
    if (!election.payment_verified) {
      if (election.total_voters > 50) {
        return { allowed: false, reason: 'Payment required for elections with more than 50 voters' }
      }
      // For free plan (≤50 voters), auto-verify if not already verified
      return { allowed: false, reason: 'Please activate your free plan in the Payment tab' }
    }
    if (election.total_voters === 0) {
      return { allowed: false, reason: 'No voters added' }
    }
    return { allowed: true, reason: '' }
  }

  const toggleVoting = async () => {
    const check = canStartVoting()
    if (!election.is_voting_active && !check.allowed) {
      alert(`Cannot start voting: ${check.reason}`)
      return
    }

    if (election.is_voting_active) {
      if (!confirm('Are you sure you want to pause voting?')) return
    } else {
      if (!confirm('Are you sure you want to start voting?')) return
    }

    setLoading(true)

    try {
      const newStatus = !election.is_voting_active
      const { error: updateError } = await supabase
        .from('elections')
        .update({
          is_voting_active: newStatus,
          status: newStatus ? 'active' : 'paused',
        } as any)
        .eq('id', election.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      onUpdate()
    } catch (err) {
      console.error('Error updating voting status:', err)
      alert(err instanceof Error ? err.message : 'Failed to update voting status')
    } finally {
      setLoading(false)
    }
  }

  const check = canStartVoting()

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Voting Controls</h3>

      {/* Status Display */}
      <div className="mb-6" role="status" aria-live="polite" aria-atomic="true">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`h-4 w-4 rounded-full ${
              election.is_voting_active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}
            aria-hidden="true"
          />
          <span className="text-lg font-medium">
            Status: {election.is_voting_active ? 'Voting is LIVE' : 'Voting is Paused'}
          </span>
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center gap-2">
          {election.payment_verified ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <span className={election.payment_verified ? 'text-green-700' : 'text-red-700'}>
            {election.payment_verified 
              ? 'Payment Verified' 
              : election.total_voters <= 50 
                ? 'Free Plan Available - Activate in Payment tab'
                : 'Payment Required (>50 voters)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {election.total_voters > 0 ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <span className={election.total_voters > 0 ? 'text-green-700' : 'text-red-700'}>
            {election.total_voters} Voters Added
          </span>
        </div>
      </div>

      {/* Control Button */}
      <div>
        {election.is_voting_active ? (
          <button
            onClick={toggleVoting}
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            <Pause className="h-5 w-5 mr-2" />
            {loading ? 'Pausing...' : 'Pause Voting'}
          </button>
        ) : (
          <button
            onClick={toggleVoting}
            disabled={loading || !check.allowed}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            title={check.allowed ? '' : check.reason}
          >
            <Play className="h-5 w-5 mr-2" />
            {loading ? 'Starting...' : 'Start Voting'}
          </button>
        )}

        {!check.allowed && !election.is_voting_active && (
          <p className="mt-2 text-sm text-red-600 text-center">{check.reason}</p>
        )}
      </div>

      {/* Additional Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total Votes:</span>
            <div className="font-semibold text-gray-900">{election.total_votes_cast}</div>
          </div>
          <div>
            <span className="text-gray-500">Turnout:</span>
            <div className="font-semibold text-gray-900">
              {election.total_voters > 0
                ? `${((election.total_votes_cast / election.total_voters) * 100).toFixed(1)}%`
                : '0%'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
