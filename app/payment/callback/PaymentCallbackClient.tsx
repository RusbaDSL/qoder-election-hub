'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface PaymentCallbackClientProps {
  reference?: string
}

export default function PaymentCallbackClient({ reference }: PaymentCallbackClientProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (reference) {
      verifyPayment(reference)
    } else {
      setStatus('error')
      setMessage('Invalid payment reference')
    }
  }, [reference])

  const verifyPayment = async (ref: string) => {
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference: ref }),
      })

      const data = await response.json()

      if (data.verified) {
        setStatus('success')
        setMessage('Payment verified successfully!')
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        setStatus('error')
        setMessage('Payment verification failed. Please contact support.')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred during verification.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}