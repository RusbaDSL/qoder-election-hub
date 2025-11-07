'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Papa from 'papaparse'
import { Upload, UserPlus, X, AlertCircle } from 'lucide-react'

interface VoterFormProps {
  electionId: string
  onVoterAdded: () => void
  currentVoterCount?: number
  isVotingActive?: boolean
}

export default function VoterForm({ electionId, onVoterAdded, currentVoterCount = 0, isVotingActive = false }: VoterFormProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bulkData, setBulkData] = useState<any[]>([])
  const supabase = createClient()

  const handleSingleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!email && !phone) {
      setError('Either email or phone number is required')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('voters')
      .insert({
        election_id: electionId,
        name,
        email: email || null,
        phone_number: phone || null,
      })

    if (insertError) {
      setError(insertError.message)
    } else {
      setName('')
      setEmail('')
      setPhone('')
      setShowAddForm(false)
      onVoterAdded()
    }
    setLoading(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setBulkData(results.data)
      },
      error: (error) => {
        setError(error.message)
      },
    })
  }

  const handleBulkUpload = async () => {
    if (bulkData.length === 0) {
      setError('No data to upload')
      return
    }

    // Check if adding these voters will exceed free plan limit
    const totalAfterUpload = currentVoterCount + bulkData.length
    if (totalAfterUpload > 50) {
      const confirmMessage = `Adding ${bulkData.length} voters will bring your total to ${totalAfterUpload} voters.

This exceeds the free plan limit of 50 voters.
You will need to upgrade to a paid plan before voting can start.

Do you want to continue?`
      if (!confirm(confirmMessage)) {
        return
      }
    }

    setLoading(true)
    setError(null)

    const voters = bulkData.map((row: any) => ({
      election_id: electionId,
      name: row.name || row.Name,
      email: row.email || row.Email || null,
      phone_number: row.phone || row.Phone || row.phone_number || row['Phone Number'] || null,
    }))

    const { error: insertError } = await supabase
      .from('voters')
      .insert(voters)

    if (insertError) {
      setError(insertError.message)
    } else {
      setBulkData([])
      setShowBulkUpload(false)
      onVoterAdded()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* Voting Active Warning - Blocks voter additions */}
      {isVotingActive && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-semibold text-red-900">Voting is Active</h4>
              <p className="text-sm text-red-700 mt-1">
                New voters cannot be added while voting is in progress. Please pause voting first to add more voters.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Free Plan Warning */}
      {currentVoterCount >= 50 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-900">Paid Plan Required</h4>
              <p className="text-sm text-yellow-700 mt-1">
                You currently have {currentVoterCount} voters. Adding more voters requires a paid plan.
                Please complete payment before voting can be activated.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentVoterCount < 50 && currentVoterCount >= 40 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900">Approaching Free Plan Limit</h4>
              <p className="text-sm text-blue-700 mt-1">
                You have {currentVoterCount} of 50 free voters. Adding more than {50 - currentVoterCount} will require a paid plan.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => {
            setShowAddForm(!showAddForm)
            setShowBulkUpload(false)
          }}
          disabled={isVotingActive}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Single Voter
        </button>
        <button
          onClick={() => {
            setShowBulkUpload(!showBulkUpload)
            setShowAddForm(false)
          }}
          disabled={isVotingActive}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="h-4 w-4 mr-2" />
          Bulk Upload (CSV)
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="text-sm text-red-800">{error}</div>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="h-4 w-4 text-red-600" />
            </button>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Voter</h3>
          <form onSubmit={handleSingleAdd} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                id="name"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <p className="text-sm text-gray-500">* Either email or phone number is required</p>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Voter'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showBulkUpload && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Upload Voters</h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Upload a CSV file with columns: name, email, phone (or Phone Number)
            </p>
            <p className="text-xs text-gray-500 mb-4">
              At least one of email or phone is required for each voter.
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {bulkData.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Preview ({bulkData.length} voters):
              </p>
              <div className="max-h-60 overflow-auto mb-4 border border-gray-300 rounded">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bulkData.slice(0, 10).map((row: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.name || row.Name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{row.email || row.Email}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {row.phone || row.Phone || row.phone_number || row['Phone Number']}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBulkUpload}
                  disabled={loading}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : `Upload ${bulkData.length} Voters`}
                </button>
                <button
                  onClick={() => {
                    setBulkData([])
                    setShowBulkUpload(false)
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
