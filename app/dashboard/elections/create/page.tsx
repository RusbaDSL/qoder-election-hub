'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Import the notification function
async function sendElectionCreatedNotification(electionId: string) {
  try {
    const response = await fetch('/api/election/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        electionId,
        type: 'created',
      }),
    })
    
    if (!response.ok) {
      console.error('Failed to send election created notification')
    }
  } catch (error) {
    console.error('Error sending election created notification:', error)
  }
}

export default function CreateElectionPage() {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [organization, setOrganization] = useState('')
  const [votingStartTime, setVotingStartTime] = useState('')
  const [votingEndTime, setVotingEndTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const electionData: Database['public']['Tables']['elections']['Insert'] = {
      creator_id: user!.id,
      name,
      description,
      organization,
      voting_start_time: votingStartTime || null,
      voting_end_time: votingEndTime || null,
      status: 'draft',
    }

    const { data, error: insertError } = await supabase
      .from('elections')
      .insert(electionData as any)
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else if (data) {
      // Type the data properly
      const typedData = data as any
      
      // Send notification email to election creator
      await sendElectionCreatedNotification(typedData.id)
      router.push(`/dashboard/elections/${typedData.id}`)
    }
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

      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Create New Election</h2>
            <p className="mt-1 text-sm text-gray-600">
              Set up your election details. You can add voters and positions later.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Election Name *
              </label>
              <input
                type="text"
                id="name"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Student Council Election 2025"
              />
            </div>

            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                Organization
              </label>
              <input
                type="text"
                id="organization"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g., ABC University"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose and details of this election..."
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="voting-start-time"
                  className="block text-sm font-medium text-gray-700"
                >
                  Voting Start Time
                </label>
                <input
                  type="datetime-local"
                  id="voting-start-time"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  value={votingStartTime}
                  onChange={(e) => setVotingStartTime(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="voting-end-time"
                  className="block text-sm font-medium text-gray-700"
                >
                  Voting End Time
                </label>
                <input
                  type="datetime-local"
                  id="voting-end-time"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  value={votingEndTime}
                  onChange={(e) => setVotingEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Election'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
