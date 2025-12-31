'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Clock } from 'lucide-react'

interface ElectionScheduleEditorProps {
  election: any
  onUpdate: () => void
}

export default function ElectionScheduleEditor({ election, onUpdate }: ElectionScheduleEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [startDate, setStartDate] = useState(election.voting_start_time ? new Date(election.voting_start_time).toISOString().slice(0, 16) : '')
  const [endDate, setEndDate] = useState(election.voting_end_time ? new Date(election.voting_end_time).toISOString().slice(0, 16) : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    
    // Validate dates
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date')
      setLoading(false)
      return
    }
    
    try {
      const { error: updateError } = await supabase
        .from('elections')
        .upsert({
          id: election.id,
          voting_start_time: startDate ? new Date(startDate).toISOString() : null,
          voting_end_time: endDate ? new Date(endDate).toISOString() : null,
        } as any)
        .eq('id', election.id)
      
      if (updateError) {
        throw new Error(updateError.message)
      }
      
      onUpdate()
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating schedule:', err)
      setError(err instanceof Error ? err.message : 'Failed to update schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setStartDate(election.voting_start_time ? new Date(election.voting_start_time).toISOString().slice(0, 16) : '')
    setEndDate(election.voting_end_time ? new Date(election.voting_end_time).toISOString().slice(0, 16) : '')
    setError(null)
    setIsEditing(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Election Schedule</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Edit Schedule
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date & Time
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
              End Date & Time
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
              <Clock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 inline-flex justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {election.voting_start_time ? (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                <span className="font-medium">Start:</span>{' '}
                {new Date(election.voting_start_time).toLocaleString()}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No start date set</p>
          )}

          {election.voting_end_time ? (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span>
                <span className="font-medium">End:</span>{' '}
                {new Date(election.voting_end_time).toLocaleString()}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No end date set</p>
          )}

          {!election.voting_start_time && !election.voting_end_time && (
            <p className="text-sm text-gray-500 italic">
              Schedule not set. Click "Edit Schedule" to set dates.
            </p>
          )}
        </div>
      )}
    </div>
  )
}