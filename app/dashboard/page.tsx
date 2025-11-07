'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import Link from 'next/link'
import { Plus, Calendar, Users, TrendingUp } from 'lucide-react'

type Election = Database['public']['Tables']['elections']['Row']

export default function DashboardPage() {
  const { user } = useAuth()
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchElections()
    }
  }, [user])

  const fetchElections = async () => {
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .eq('creator_id', user!.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setElections(data)
    }
    setLoading(false)
  }

  const getStatusColor = (status: Election['status']) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending_payment: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      paused: 'bg-orange-100 text-orange-800',
      completed: 'bg-purple-100 text-purple-800',
    }
    return colors[status]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">Loading elections...</div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Elections</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your elections, voters, and view real-time results
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/elections/create"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Election
          </Link>
        </div>
      </div>

      <div className="mt-8">
        {elections.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No elections</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new election.</p>
            <div className="mt-6">
              <Link
                href="/dashboard/elections/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Election
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {elections.map((election) => (
              <Link
                key={election.id}
                href={`/dashboard/elections/${election.id}`}
                className="block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {election.name}
                    </h3>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        election.status
                      )}`}
                    >
                      {election.status.replace('_', ' ')}
                    </span>
                  </div>
                  {election.organization && (
                    <p className="text-sm text-gray-500 mb-2">{election.organization}</p>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {election.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{election.total_voters} voters</span>
                    </div>
                    {election.is_voting_active && (
                      <div className="flex items-center text-green-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>Live</span>
                      </div>
                    )}
                  </div>
                  {election.voting_start_time && (
                    <div className="mt-2 text-xs text-gray-400">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {new Date(election.voting_start_time).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
