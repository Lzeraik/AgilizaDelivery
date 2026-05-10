import { Suspense } from 'react'
import TrackClient from './TrackClient'

export default function TrackPage({ params }: { params: { token: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full" /></div>}>
      <TrackClient token={params.token} />
    </Suspense>
  )
}
