'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Vote, TrendingUp, Users, BarChart3 } from 'lucide-react'
import VoterVerificationModal from '@/components/VoterVerificationModal'

export default function ElectionStatsPage() {
  const params = useParams()
  const electionId = params.id as string
  const [election, setElection] = useState<any>(null)
  const [positions, setPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showVoteModal, setShowVoteModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchElectionData()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('election-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates',
          filter: `position_id=in.(${positions.map(p => p.id).join(',')})`
        },
        () => {
          fetchElectionData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'elections',
          filter: `id=eq.${electionId}`
        },
        () => {
          fetchElectionData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [electionId])

  const fetchElectionData = async () => {
    // Fetch election details
    const { data: electionData } = await supabase
      .from('elections')
      .select('*')
      .eq('id', electionId)
      .single()

    if (electionData) {
      setElection(electionData)
    }

    // Fetch positions with candidates
    const { data: positionsData } = await supabase
      .from('positions')
      .select(`
        *,
        candidates (
          *,
          voters:voter_id (name, email)
        )
      `)
      .eq('election_id', electionId)
      .order('display_order', { ascending: true })

    if (positionsData) {
      setPositions(positionsData)
    }

    setLoading(false)
  }

  const calculatePercentage = (voteCount: number, totalVotes: number) => {
    if (totalVotes === 0) return 0
    return ((voteCount / totalVotes) * 100).toFixed(1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading election data...</div>
      </div>
    )
  }

  if (!election) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Election not found</div>
      </div>
    )
  }

  const totalVotesCast = election.total_votes_cast || 0
  const totalVoters = election.total_voters || 0
  const turnoutPercentage = totalVoters > 0 ? ((totalVotesCast / totalVoters) * 100).toFixed(1) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Vote className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{election.name}</h1>
          {election.organization && (
            <p className="text-xl text-gray-600 mb-4">{election.organization}</p>
          )}
          {election.description && (
            <p className="text-gray-600 max-w-2xl mx-auto">{election.description}</p>
          )}
          {election.is_voting_active && (
            <div className="mt-6">
              <button
                onClick={() => setShowVoteModal(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-lg"
              >
                <Vote className="h-5 w-5 mr-2" />
                Click Here to Vote
              </button>
            </div>
          )}
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" role="region" aria-label="Election statistics summary">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Users className="h-10 w-10 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Voters</p>
                <p className="text-3xl font-bold text-gray-900">{totalVoters}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <BarChart3 className="h-10 w-10 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Votes Cast</p>
                <p className="text-3xl font-bold text-gray-900">{totalVotesCast}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <TrendingUp className="h-10 w-10 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Turnout</p>
                <p className="text-3xl font-bold text-gray-900">{turnoutPercentage}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Voting Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-center" role="status" aria-live="polite">
          <div className="inline-flex items-center">
            <div
              className={`h-3 w-3 rounded-full mr-3 ${
                election.is_voting_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-lg font-semibold text-gray-900">
              Voting is {election.is_voting_active ? 'LIVE' : 'CLOSED'}
            </span>
          </div>
        </div>

        {/* Positions and Results */}
        <div className="space-y-8">
          {positions.map((position) => {
            const positionVotes = position.candidates?.reduce(
              (sum: number, c: any) => sum + (c.vote_count || 0),
              0
            ) || 0

            return (
              <div key={position.id} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{position.title}</h2>
                {position.description && (
                  <p className="text-gray-600 mb-6">{position.description}</p>
                )}

                <div className="space-y-4">
                  {position.candidates && position.candidates.length > 0 ? (
                    position.candidates
                      .sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))
                      .map((candidate: any, index: number) => {
                        const percentage = calculatePercentage(candidate.vote_count || 0, positionVotes)
                        const isLeading = index === 0 && positionVotes > 0

                        return (
                          <div
                            key={candidate.id}
                            className={`p-4 rounded-lg border-2 ${
                              isLeading ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-4">
                                {candidate.photo_url ? (
                                  <img
                                    src={candidate.photo_url}
                                    alt={candidate.voters?.name}
                                    className="h-16 w-16 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                                    <Users className="h-8 w-8 text-gray-600" />
                                  </div>
                                )}
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {candidate.voters?.name}
                                    {isLeading && (
                                      <span className="ml-2 text-sm font-normal text-yellow-600">
                                        (Leading)
                                      </span>
                                    )}
                                  </h3>
                                  {candidate.bio && (
                                    <p className="text-sm text-gray-600">{candidate.bio}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">
                                  {candidate.vote_count || 0}
                                </div>
                                <div className="text-sm text-gray-500">{percentage}%</div>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className={`h-3 rounded-full transition-all duration-500 ${
                                  isLeading ? 'bg-yellow-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                  ) : (
                    <p className="text-center text-gray-500 py-8">No candidates for this position</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {positions.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No positions have been set up yet</p>
          </div>
        )}
      </div>

      {showVoteModal && (
        <VoterVerificationModal
          electionId={electionId}
          onClose={() => setShowVoteModal(false)}
        />
      )}
    </div>
  )
}
