'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, CheckCircle, XCircle } from 'lucide-react'

interface VoterListProps {
  electionId: string
  refreshTrigger: number
  isVotingActive?: boolean
}

export default function VoterList({ electionId, refreshTrigger, isVotingActive = false }: VoterListProps) {
  const [voters, setVoters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchVoters()
  }, [electionId, refreshTrigger])

  const fetchVoters = async () => {
    const { data, error } = await supabase
      .from('voters')
      .select('*')
      .eq('election_id', electionId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setVoters(data)
    }
    setLoading(false)
  }

  const deleteVoter = async (voterId: string) => {
    if (isVotingActive) {
      alert('Cannot delete voters while voting is active. Please pause voting first.')
      return
    }
    
    if (!confirm('Are you sure you want to delete this voter?')) return

    const { error } = await supabase
      .from('voters')
      .delete()
      .eq('id', voterId)

    if (!error) {
      fetchVoters()
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading voters...</div>
  }

  if (voters.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No voters added yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {voters.map((voter) => (
            <tr key={voter.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {voter.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {voter.email || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {voter.phone_number || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {voter.has_voted ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Voted
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Voted
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => deleteVoter(voter.id)}
                  className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={voter.has_voted || isVotingActive}
                  title={
                    isVotingActive 
                      ? 'Cannot delete voters while voting is active'
                      : voter.has_voted 
                        ? 'Cannot delete voter who has already voted' 
                        : 'Delete voter'
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
