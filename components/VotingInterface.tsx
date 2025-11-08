'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, User } from 'lucide-react'

interface VotingInterfaceProps {
  electionId: string
  voterId: string
  onVoteSuccess: () => void
}

export default function VotingInterface({
  electionId,
  voterId,
  onVoteSuccess,
}: VotingInterfaceProps) {
  const [positions, setPositions] = useState<any[]>([])
  const [selectedCandidates, setSelectedCandidates] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchPositions()
  }, [electionId])

  const fetchPositions = async () => {
    const { data } = await supabase
      .from('positions')
      .select(`
        *,
        candidates (
          *,
          voters:voter_id (name)
        )
      `)
      .eq('election_id', electionId)
      .order('display_order', { ascending: true })

    if (data) {
      setPositions(data)
    }
    setLoading(false)
  }

  const handleCandidateSelect = (positionId: string, candidateId: string) => {
    setSelectedCandidates((prev) => ({
      ...prev,
      [positionId]: candidateId,
    }))
  }

  const handleSubmitVote = async () => {
    if (Object.keys(selectedCandidates).length !== positions.length) {
      setError('Please vote for all positions')
      return
    }

    setSubmitting(true)
    setError(null)

    const votes = Object.entries(selectedCandidates).map(([positionId, candidateId]) => ({
      election_id: electionId,
      voter_id: voterId,
      candidate_id: candidateId,
      position_id: positionId,
    }))

    const { error: insertError } = await supabase
      .from('votes')
      .insert(votes as any)

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
    } else {
      onVoteSuccess()
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading ballot...</div>
  }

  return (
    <div className="space-y-6" role="form" aria-label="Election ballot">
      {error && (
        <div className="rounded-md bg-red-50 p-4" role="alert" aria-live="assertive">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" role="note">
        <p className="text-sm text-blue-800">
          <strong>Instructions:</strong> Select one candidate for each position.
          You must vote for all positions to submit your ballot.
        </p>
      </div>

      {positions.map((position) => (
        <fieldset key={position.id} className="border border-gray-200 rounded-lg p-4">
          <legend className="text-lg font-semibold text-gray-900 mb-2">{position.title}</legend>
          {position.description && (
            <p className="text-sm text-gray-600 mb-4">{position.description}</p>
          )}

          <div className="space-y-3">
            {position.candidates && position.candidates.length > 0 ? (
              position.candidates.map((candidate: any) => {
                const isSelected = selectedCandidates[position.id] === candidate.id

                return (
                  <button
                    key={candidate.id}
                    onClick={() => handleCandidateSelect(position.id, candidate.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {candidate.photo_url ? (
                        <img
                          src={candidate.photo_url}
                          alt={candidate.voters?.name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <h4 className="text-base font-semibold text-gray-900">
                        {candidate.voters?.name}
                      </h4>
                      {candidate.bio && (
                        <p className="text-sm text-gray-600 mt-1">{candidate.bio}</p>
                      )}
                    </div>

                    {isSelected && (
                      <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                )
              })
            ) : (
              <p className="text-center text-gray-500 py-4">No candidates for this position</p>
            )}
          </div>
        </fieldset>
      ))}

      <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200">
        <button
          onClick={handleSubmitVote}
          disabled={submitting || Object.keys(selectedCandidates).length !== positions.length}
          className="w-full px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : `Submit Ballot (${Object.keys(selectedCandidates).length}/${positions.length} positions)`}
        </button>
      </div>
    </div>
  )
}
