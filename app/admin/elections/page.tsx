'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Eye, Edit, Calendar, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function AdminElectionsPage() {
  const [elections, setElections] = useState<any[]>([])
  const [filteredElections, setFilteredElections] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const electionsPerPage = 10
  const supabase = createClient()

  useEffect(() => {
    fetchElections()
  }, [])

  useEffect(() => {
    filterElections()
  }, [searchTerm, elections])

  const fetchElections = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('elections')
        .select(`
          *,
          creator:profiles(full_name, email),
          positions(count),
          voters(count)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching elections:', error)
        setError('Failed to load elections: ' + error.message)
        setElections([])
        setFilteredElections([])
      } else if (data) {
        setElections(data)
        setFilteredElections(data)
      }
    } catch (err) {
      console.error('Error fetching elections:', err)
      setError('Failed to load elections: ' + (err as Error).message)
      setElections([])
      setFilteredElections([])
    } finally {
      setLoading(false)
    }
  }

  const filterElections = () => {
    if (!searchTerm) {
      setFilteredElections(elections)
      return
    }

    const filtered = elections.filter(election => 
      election.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      election.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      election.creator?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      election.creator?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    setFilteredElections(filtered)
  }

  // Pagination
  const indexOfLastElection = currentPage * electionsPerPage
  const indexOfFirstElection = indexOfLastElection - electionsPerPage
  const currentElections = filteredElections.slice(indexOfFirstElection, indexOfLastElection)
  const totalPages = Math.ceil(filteredElections.length / electionsPerPage)

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      draft: 'bg-gray-100 text-gray-800',
      pending_payment: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-orange-100 text-orange-800',
      completed: 'bg-purple-100 text-purple-800',
    }

    const statusText = {
      draft: 'Draft',
      pending_payment: 'Pending Payment',
      paid: 'Paid',
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {statusText[status as keyof typeof statusText] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">Loading elections...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-red-600">Error: {error}</div>
        <button 
          onClick={fetchElections}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Elections Management</h1>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search elections by name, organization, creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Elections Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Election
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creator
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentElections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'No elections found matching your search.' : 'No elections found.'}
                  </td>
                </tr>
              ) : (
                currentElections.map((election) => (
                  <tr key={election.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{election.name}</div>
                      {election.organization && (
                        <div className="text-sm text-gray-500">{election.organization}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{election.creator?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{election.creator?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {formatDate(election.voting_start_time)}
                      </div>
                      <div className="text-sm text-gray-500">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {formatDate(election.voting_end_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="h-4 w-4 mr-1" />
                        {election.voters?.length || 0} voters
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        {election.positions?.length || 0} positions
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(election.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/admin/elections/${election.id}`} 
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                      <Link 
                        href={`/dashboard/elections/${election.id}`} 
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstElection + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(indexOfLastElection, filteredElections.length)}</span> of{' '}
                  <span className="font-medium">{filteredElections.length}</span> elections
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === i + 1
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}