'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'
import { Settings, Users, DollarSign, Vote, LayoutDashboard, LogOut } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/dashboard')
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Settings className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold text-white">
                  Admin Panel
                </span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/admin"
                  className="text-gray-300 hover:text-white inline-flex items-center px-1 pt-1 text-sm font-medium"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
                <Link
                  href="/admin/elections"
                  className="text-gray-300 hover:text-white inline-flex items-center px-1 pt-1 text-sm font-medium"
                >
                  <Vote className="h-4 w-4 mr-2" />
                  Elections
                </Link>
                <Link
                  href="/admin/users"
                  className="text-gray-300 hover:text-white inline-flex items-center px-1 pt-1 text-sm font-medium"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </Link>
                <Link
                  href="/admin/payments"
                  className="text-gray-300 hover:text-white inline-flex items-center px-1 pt-1 text-sm font-medium"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Payments
                </Link>
                <Link
                  href="/admin/settings"
                  className="text-gray-300 hover:text-white inline-flex items-center px-1 pt-1 text-sm font-medium"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="text-gray-300 hover:text-white text-sm mr-4"
              >
                User Dashboard
              </Link>
              <span className="text-sm text-gray-400 mr-4">
                {profile?.full_name || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
