'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Users, FileText, Play, Pause, Calendar } from 'lucide-react'
import VoterForm from '@/components/VoterForm'
import VoterList from '@/components/VoterList'
import PositionManager from '@/components/PositionManager'
import PaymentSection from '@/components/PaymentSection'
import ElectionControl from '@/components/ElectionControl'

export default function ElectionDetailPage() {
  const params = useParams()
  const electionId = params.id as string
  const [election, setElection] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [voterRefresh, setVoterRefresh] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    fetchElection()
  }, [electionId])

  const fetchElection = async () => {
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .eq('id', electionId)
      .single()

    if (!error && data) {
      setElection(data)
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>
  }

  if (!election) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Election not found</h3>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{election.name}</h1>
              {election.organization && (
                <p className="mt-1 text-sm text-gray-600">{election.organization}</p>
              )}
            </div>
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
              {election.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('voters')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'voters'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Voters
            </button>
            <button
              onClick={() => setActiveTab('positions')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'positions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Positions
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'payment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{election.description || 'No description provided'}</p>
              </div>

              <ElectionControl election={election} onUpdate={fetchElection} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Total Voters</p>
                      <p className="text-2xl font-semibold text-gray-900">{election.total_voters}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Votes Cast</p>
                      <p className="text-2xl font-semibold text-gray-900">{election.total_votes_cast}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    {election.is_voting_active ? (
                      <Play className="h-8 w-8 text-green-600" />
                    ) : (
                      <Pause className="h-8 w-8 text-gray-600" />
                    )}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {election.is_voting_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {(election.voting_start_time || election.voting_end_time) && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule</h3>
                  <div className="space-y-2">
                    {election.voting_start_time && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Start: {new Date(election.voting_start_time).toLocaleString()}</span>
                      </div>
                    )}
                    {election.voting_end_time && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>End: {new Date(election.voting_end_time).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <Link
                  href={`/election/${election.id}/stats`}
                  target="_blank"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  View Public Statistics Page
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'voters' && (
            <div className="space-y-6">
              <VoterForm 
                electionId={electionId} 
                onVoterAdded={() => {
                  setVoterRefresh(prev => prev + 1)
                  fetchElection() // Refresh election data to get updated voter count
                }} 
                currentVoterCount={election.total_voters}
                isVotingActive={election.is_voting_active}
              />
              <VoterList 
                electionId={electionId} 
                refreshTrigger={voterRefresh} 
                isVotingActive={election.is_voting_active}
              />
            </div>
          )}

          {activeTab === 'positions' && (
            <div>
              <PositionManager electionId={electionId} isVotingActive={election.is_voting_active} />
            </div>
          )}

          {activeTab === 'payment' && (
            <div>
              <PaymentSection electionId={electionId} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
