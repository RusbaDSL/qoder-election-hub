import Link from 'next/link'
import { Vote, CheckCircle, Users, BarChart } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img 
                src="https://res.cloudinary.com/dfsfskmha/image/upload/v1750365592/rusba/electionhub-logo_ney3fi.png" 
                alt="Election Hub" 
                className="h-10 w-auto"
              />
              <span className="ml-3 text-xl font-bold text-gray-900">Election Management</span>
            </div>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
            Manage Elections with
            <span className="block text-blue-600 mt-2">Real-Time Results</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Create, manage, and monitor elections seamlessly. From voter registration to
            live statistics, everything you need in one powerful platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg"
            >
              Create Your Election
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 text-lg font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 shadow-lg"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Voter Management</h3>
            <p className="text-gray-600">
              Add voters individually or in bulk via CSV upload. Manage eligible voters effortlessly.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Verification</h3>
            <p className="text-gray-600">
              Email and phone verification ensures only eligible voters can cast their votes.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <BarChart className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-Time Statistics</h3>
            <p className="text-gray-600">
              Watch results update live with beautiful, publicly accessible statistics pages.
            </p>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Flexible Pricing</h2>
          <p className="text-lg text-gray-600 mb-8">Pay only for what you need</p>
          <div className="bg-white p-8 rounded-xl shadow-md max-w-md mx-auto">
            <div className="space-y-3 text-left">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Up to 50 voters</span>
                <span className="font-semibold text-green-600">FREE</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">51 - 200 voters</span>
                <span className="font-semibold">₦50,000</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">201 - 500 voters</span>
                <span className="font-semibold">₦100,000</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Enterprise plans</span>
                <span className="font-semibold">Custom</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-24 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">© 2025 Election Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
