'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Mail, Phone } from 'lucide-react'
import VotingInterface from './VotingInterface'

interface VoterVerificationModalProps {
  electionId: string
  onClose: () => void
}

export default function VoterVerificationModal({
  electionId,
  onClose,
}: VoterVerificationModalProps) {
  const [step, setStep] = useState<'input' | 'verify' | 'vote'>('input')
  const [contactType, setContactType] = useState<'email' | 'phone'>('email')
  const [contactValue, setContactValue] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voterId, setVoterId] = useState<string | null>(null)
  const supabase = createClient()

  const sendVerificationCode = async () => {
    setLoading(true)
    setError(null)

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes

    // Find voter and update verification code
    const query = contactType === 'email'
      ? { email: contactValue }
      : { phone_number: contactValue }

    const { data: voters, error: fetchError } = await supabase
      .from('voters')
      .select('*')
      .eq('election_id', electionId)
      .match(query)

    if (fetchError || !voters || voters.length === 0) {
      setError('No voter found with this contact information')
      setLoading(false)
      return
    }

    const voter = voters[0]

    if (voter.has_voted) {
      setError('You have already voted in this election')
      setLoading(false)
      return
    }

    // Update voter with verification code
    const { error: updateError } = await supabase
      .from('voters')
      .update({
        verification_code: code,
        verification_code_expires_at: expiresAt,
      } as any)
      .eq('id', voter.id)

    if (updateError) {
      setError('Failed to send verification code')
      setLoading(false)
      return
    }

    // Send verification code via email or show alert for phone
    if (contactType === 'email') {
      // Get election name for email context
      const { data: election } = await supabase
        .from('elections')
        .select('name')
        .eq('id', electionId)
        .single()

      // Send verification email via Mailtrap
      const emailResponse = await fetch('/api/verification/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contactValue,
          code,
          electionName: election?.name,
        }),
      })

      if (!emailResponse.ok) {
        setError('Failed to send verification email. Please try again.')
        setLoading(false)
        return
      }
    } else {
      // Phone/SMS not implemented yet - show code in alert
      alert(`Your verification code is: ${code}\n\n(SMS integration coming soon)`)
    }

    setVoterId(voter.id)
    setStep('verify')
    setLoading(false)
  }

  const verifyCode = async () => {
    setLoading(true)
    setError(null)

    const { data: voter, error: fetchError } = await supabase
      .from('voters')
      .select('*')
      .eq('id', voterId!)
      .single()

    if (fetchError || !voter) {
      setError('Verification failed')
      setLoading(false)
      return
    }

    if (voter.verification_code !== verificationCode) {
      setError('Invalid verification code')
      setLoading(false)
      return
    }

    if (new Date(voter.verification_code_expires_at!) < new Date()) {
      setError('Verification code has expired')
      setLoading(false)
      return
    }

    setStep('vote')
    setLoading(false)
  }

  const handleVoteSuccess = () => {
    alert('Your vote has been submitted successfully!')
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-dialog-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 id="verification-dialog-title" className="text-xl font-bold text-gray-900">
            {step === 'input' && 'Voter Verification'}
            {step === 'verify' && 'Enter Verification Code'}
            {step === 'vote' && 'Cast Your Vote'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close verification dialog"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4" role="alert" aria-live="assertive">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Method
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setContactType('email')}
                    className={`flex-1 flex items-center justify-center px-4 py-3 border-2 rounded-lg ${
                      contactType === 'email'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    <span className="font-medium">Email</span>
                  </button>
                  <button
                    onClick={() => setContactType('phone')}
                    className={`flex-1 flex items-center justify-center px-4 py-3 border-2 rounded-lg ${
                      contactType === 'phone'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    <span className="font-medium">Phone</span>
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {contactType === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <input
                  type={contactType === 'email' ? 'email' : 'tel'}
                  id="contact"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  placeholder={
                    contactType === 'email' ? 'your@email.com' : '+234...'
                  }
                  aria-required="true"
                  aria-describedby={error ? 'contact-error' : undefined}
                />
              </div>

              <button
                onClick={sendVerificationCode}
                disabled={loading || !contactValue}
                className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                A verification code has been sent to your {contactType}.
                Please enter it below.
              </p>

              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Verification Code
                </label>
                <input
                  type="text"
                  id="code"
                  maxLength={6}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-center text-2xl font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  aria-required="true"
                  aria-describedby="code-instructions"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <p id="code-instructions" className="sr-only">Enter the 6-digit verification code sent to your {contactType}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={verifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button
                  onClick={() => {
                    setStep('input')
                    setVerificationCode('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {step === 'vote' && voterId && (
            <VotingInterface
              electionId={electionId}
              voterId={voterId}
              onVoteSuccess={handleVoteSuccess}
            />
          )}
        </div>
      </div>
    </div>
  )
}
