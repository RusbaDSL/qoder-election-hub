'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, User } from 'lucide-react'

interface CandidateManagerProps {
  electionId: string
  positionId: string
  isVotingActive?: boolean
}

export default function CandidateManager({ electionId, positionId, isVotingActive = false }: CandidateManagerProps) {
  const [candidates, setCandidates] = useState<any[]>([])
  const [voters, setVoters] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedVoterId, setSelectedVoterId] = useState('')
  const [bio, setBio] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchCandidates()
    fetchVoters()
  }, [positionId])

  const fetchCandidates = async () => {
    const { data } = await supabase
      .from('candidates')
      .select(`
        *,
        voters:voter_id (*)
      `)
      .eq('position_id', positionId)

    if (data) {
      setCandidates(data)
    }
  }

  const fetchVoters = async () => {
    const { data } = await supabase
      .from('voters')
      .select('*')
      .eq('election_id', electionId)
      .order('name')

    if (data) {
      setVoters(data)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadPhoto = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `candidate-photos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('election-assets')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('election-assets')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isVotingActive) {
      alert('Cannot add candidates while voting is active. Please pause voting first.')
      return
    }
    
    setLoading(true)

    let photoUrl = null
    if (photoFile) {
      photoUrl = await uploadPhoto(photoFile)
    }

    await supabase
      .from('candidates')
      .insert({
        position_id: positionId,
        voter_id: selectedVoterId,
        bio,
        photo_url: photoUrl,
      } as any)

    setSelectedVoterId('')
    setBio('')
    setPhotoFile(null)
    setPhotoPreview(null)
    setShowForm(false)
    setLoading(false)
    fetchCandidates()
  }

  const handleDelete = async (id: string) => {
    if (isVotingActive) {
      alert('Cannot remove candidates while voting is active. Please pause voting first.')
      return
    }
    
    if (!confirm('Remove this candidate?')) return

    await supabase.from('candidates').delete().eq('id', id)
    fetchCandidates()
  }

  const availableVoters = voters.filter(
    (voter) => !candidates.some((c) => c.voter_id === voter.id)
  )

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <h4 className="text-md font-medium text-gray-700">Candidates</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={isVotingActive}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title={isVotingActive ? 'Cannot add candidates while voting is active' : 'Add candidate'}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Candidate
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="text-sm font-medium text-gray-900 mb-3">Add Candidate</h5>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="voter" className="block text-sm font-medium text-gray-700">
                Select Voter *
              </label>
              <select
                id="voter"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={selectedVoterId}
                onChange={(e) => setSelectedVoterId(e.target.value)}
              >
                <option value="">Choose a voter...</option>
                {availableVoters.map((voter) => (
                  <option key={voter.id} value={voter.id}>
                    {voter.name} {voter.email ? `(${voter.email})` : ''}
                  </option>
                ))}
              </select>
              {availableVoters.length === 0 && (
                <p className="mt-1 text-xs text-red-600">
                  All voters have been added as candidates or no voters available
                </p>
              )}
            </div>

            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                Photo
              </label>
              <input
                type="file"
                id="photo"
                accept="image/*"
                onChange={handlePhotoChange}
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="mt-2 h-24 w-24 object-cover rounded-lg"
                />
              )}
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                id="bio"
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief biography..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !selectedVoterId}
                className="px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Candidate'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {candidates.length === 0 ? (
          <div className="col-span-2 text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">No candidates added yet</p>
          </div>
        ) : (
          candidates.map((candidate) => (
            <div key={candidate.id} className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {candidate.photo_url ? (
                    <img
                      src={candidate.photo_url}
                      alt={candidate.voters?.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-semibold text-gray-900 truncate">
                    {candidate.voters?.name}
                  </h5>
                  {candidate.bio && (
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">{candidate.bio}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Votes: {candidate.vote_count}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(candidate.id)}
                  className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isVotingActive}
                  title={isVotingActive ? 'Cannot remove candidates while voting is active' : 'Remove candidate'}
                  aria-label={`Remove ${candidate.voters?.name || 'candidate'}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
