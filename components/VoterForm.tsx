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

    // Check for duplicates before inserting
    const duplicateCheck = []
    
    if (email) {
      const { data: emailDupe } = await supabase
        .from('voters')
        .select('id')
        .eq('election_id', electionId)
        .ilike('email', email)
        .limit(1)
      
      if (emailDupe && emailDupe.length > 0) {
        duplicateCheck.push('email')
      }
    }

    if (phone) {
      const { data: phoneDupe } = await supabase
        .from('voters')
        .select('id')
        .eq('election_id', electionId)
        .eq('phone_number', phone)
        .limit(1)
      
      if (phoneDupe && phoneDupe.length > 0) {
        duplicateCheck.push('phone number')
      }
    }

    const { data: nameDupe } = await supabase
      .from('voters')
      .select('id')
      .eq('election_id', electionId)
      .ilike('name', name)
      .limit(1)
    
    if (nameDupe && nameDupe.length > 0) {
      duplicateCheck.push('name')
    }

    if (duplicateCheck.length > 0) {
      setError(`A voter with this ${duplicateCheck.join(' and ')} already exists in this election`)
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
      } as any)

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

    // Fetch existing voters for duplicate detection
    const { data: existingVoters } = await supabase
      .from('voters')
      .select('name, email, phone_number')
      .eq('election_id', electionId)

    // Type the existingVoters properly
    const typedExistingVoters = existingVoters as any

    const existingEmails = new Set(
      typedExistingVoters?.filter((v: any) => v.email).map((v: any) => v.email!.toLowerCase()) || []
    )
    const existingPhones = new Set(
      typedExistingVoters?.filter((v: any) => v.phone_number).map((v: any) => v.phone_number!) || []
    )
    const existingNames = new Set(
      typedExistingVoters?.filter((v: any) => v.name).map((v: any) => v.name.toLowerCase()) || []
    )

    // Deduplicate within CSV and against existing voters
    const seenInCSV = {
      emails: new Set<string>(),
      phones: new Set<string>(),
      names: new Set<string>()
    }

    const validVoters: any[] = []
    const duplicates: any[] = []
    const skipped: any[] = []

    bulkData.forEach((row: any) => {
      const name = (row.name || row.Name || '').trim()
      const email = (row.email || row.Email || '').trim().toLowerCase()
      const phone = (row.phone || row.Phone || row.phone_number || row['Phone Number'] || '').trim()

      if (!name) {
        skipped.push({ reason: 'Missing name', row })
        return
      }

      if (!email && !phone) {
        skipped.push({ reason: 'Missing email and phone', row })
        return
      }

      // Check for duplicates
      const reasons: string[] = []

      if (email && existingEmails.has(email)) {
        reasons.push('email exists')
      }
      if (phone && existingPhones.has(phone)) {
        reasons.push('phone exists')
      }
      if (existingNames.has(name.toLowerCase())) {
        reasons.push('name exists')
      }
      if (email && seenInCSV.emails.has(email)) {
        reasons.push('duplicate email in CSV')
      }
      if (phone && seenInCSV.phones.has(phone)) {
        reasons.push('duplicate phone in CSV')
      }
      if (seenInCSV.names.has(name.toLowerCase())) {
        reasons.push('duplicate name in CSV')
      }

      if (reasons.length > 0) {
        duplicates.push({ name, email, phone, reasons: reasons.join(', ') })
        return
      }

      // Mark as seen in CSV
      if (email) seenInCSV.emails.add(email)
      if (phone) seenInCSV.phones.add(phone)
      seenInCSV.names.add(name.toLowerCase())

      validVoters.push({
        election_id: electionId,
        name,
        email: email || null,
        phone_number: phone || null,
      })
    })

    // Show summary if there are duplicates or skipped rows
    if (duplicates.length > 0 || skipped.length > 0) {
      let message = `Found issues in CSV:\n\n`
      
      if (duplicates.length > 0) {
        message += `Duplicates (${duplicates.length}):\n`
        duplicates.slice(0, 5).forEach(d => {
          message += `- ${d.name}: ${d.reasons}\n`
        })
        if (duplicates.length > 5) {
          message += `... and ${duplicates.length - 5} more\n`
        }
        message += '\n'
      }

      if (skipped.length > 0) {
        message += `Skipped (${skipped.length}):\n`
        skipped.slice(0, 5).forEach(s => {
          message += `- ${s.reason}\n`
        })
        if (skipped.length > 5) {
          message += `... and ${skipped.length - 5} more\n`
        }
        message += '\n'
      }

      if (validVoters.length > 0) {
        message += `${validVoters.length} valid voters will be added.\n\nContinue?`
        if (!confirm(message)) {
          setLoading(false)
          return
        }
      } else {
        alert(message + 'No valid voters to add.')
        setLoading(false)
        return
      }
    }

    if (validVoters.length === 0) {
      setError('No valid voters to upload after deduplication')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('voters')
      .insert(validVoters as any)

    if (insertError) {
      setError(insertError.message)
    } else {
      const message = `Successfully added ${validVoters.length} voter(s)${
        duplicates.length > 0 || skipped.length > 0 
          ? `. Skipped ${duplicates.length + skipped.length} duplicate(s)/invalid row(s).` 
          : '.'
      }`
      alert(message)
      setBulkData([])
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
                aria-required="true"
                autoComplete="name"
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
                autoComplete="email"
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
                autoComplete="tel"
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
              aria-label="Upload CSV file with voter information"
              aria-describedby="csv-format-description"
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p id="csv-format-description" className="text-xs text-gray-500 mt-1">
              CSV should have columns: name, email, phone
            </p>
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
