import { Suspense } from 'react'
import PaymentCallbackClient from './PaymentCallbackClient'

// This page uses client-side hooks and cannot be prerendered
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function PaymentCallbackPage({ searchParams }: PageProps) {
  const reference = searchParams.reference as string | undefined
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4">Loading...</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <PaymentCallbackClient reference={reference} />
    </Suspense>
  )
}