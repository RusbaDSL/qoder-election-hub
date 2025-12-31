'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Edit } from 'lucide-react'
import CandidateManager from './CandidateManager'

interface PositionManagerProps {
  electionId: string
  isVotingActive?: boolean
}

export default function PositionManager({ electionId, isVotingActive = false }: PositionManagerProps) {
  const [positions, setPositions] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchPositions()
  }, [electionId])

  const fetchPositions = async () => {
    const { data } = await supabase
      .from('positions')
      .select('*')
      .eq('election_id', electionId)
      .order('display_order', { ascending: true })

    if (data) {
      setPositions(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isVotingActive) {
      alert('Cannot modify positions while voting is active. Please pause voting first.')
      return
    }
    
    setLoading(true)

    if (editingId) {
      await supabase
        .from('positions')
        .upsert({ 
          id: editingId, 
          title, 
          description 
        } as any)
        .eq('id', editingId)
    } else {
      await supabase
        .from('positions')
        .insert({
          election_id: electionId,
          title,
          description,
          display_order: positions.length,
        } as any)
    }

    setTitle('')
    setDescription('')
    setEditingId(null)
    setShowForm(false)
    setLoading(false)
    fetchPositions()
  }

  const handleEdit = (position: any) => {
    setEditingId(position.id)
    setTitle(position.title)
    setDescription(position.description || '')
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (isVotingActive) {
      alert('Cannot delete positions while voting is active. Please pause voting first.')
      return
    }
    
    if (!confirm('Delete this position? All candidates for this position will also be deleted.')) return

    await supabase.from('positions').delete().eq('id', id)
    fetchPositions()
  }

  return (
    <div className="space-y-4">
      {isVotingActive && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div>
              <h4 className="text-sm font-semibold text-red-900">Voting is Active</h4>
              <p className="text-sm text-red-700 mt-1">
                Positions cannot be modified while voting is in progress. Please pause voting first.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Positions</h3>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setTitle('')
            setDescription('')
          }}
          disabled={isVotingActive}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Position
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            {editingId ? 'Edit Position' : 'Add New Position'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Position Title *
              </label>
              <input
                type="text"
                id="title"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., President, Secretary"
                aria-required="true"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the responsibilities..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingId ? 'Update' : 'Add Position'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {positions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No positions added yet</p>
          </div>
        ) : (
          positions.map((position) => (
            <div key={position.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-md font-semibold text-gray-900">{position.title}</h4>
                  {position.description && (
                    <p className="mt-1 text-sm text-gray-600">{position.description}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(position)}
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isVotingActive}
                    title={isVotingActive ? 'Cannot edit while voting is active' : 'Edit position'}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(position.id)}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isVotingActive}
                    title={isVotingActive ? 'Cannot delete while voting is active' : 'Delete position'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Candidate Manager for this position */}
              <CandidateManager 
                electionId={electionId} 
                positionId={position.id}
                isVotingActive={isVotingActive}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
