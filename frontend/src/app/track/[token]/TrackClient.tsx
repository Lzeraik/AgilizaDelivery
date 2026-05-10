'use client'
import { useEffect, useState, useCallback } from 'react'
import { trackOrder } from '@/services/api'
import type { Order } from '@/types'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Clock, CheckCircle, Package, ChefHat } from 'lucide-react'

const STEPS = [
  { status: 'pending', label: 'Pedido recebido', icon: Package, color: '#F59E0B' },
  { status: 'preparing', label: 'Em preparo', icon: ChefHat, color: '#3B82F6' },
  { status: 'ready', label: 'Pronto para retirar!', icon: CheckCircle, color: '#22C55E' },
  { status: 'delivered', label: 'Entregue', icon: Clock, color: '#6B7280' },
]

export default function TrackClient({ token }: { token: string }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    trackOrder(token)
      .then(setOrder)
      .catch(() => setError('Pedido não encontrado'))
  }, [token])

  useWebSocket(`/display/ws/order/${token}`, useCallback((_event: string, data: unknown) => {
    setOrder(data as Order)
  }, []))

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      <div className="text-center"><p className="text-5xl mb-4">😕</p><p className="text-xl">{error}</p></div>
    </div>
  )

  if (!order) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full" />
    </div>
  )

  const currentStepIndex = STEPS.findIndex((s) => s.status === order.status)

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-1">Acompanhe seu pedido</p>
          <h1 className="text-6xl font-black text-blue-400">#{order.order_number}</h1>
          {order.customer_name && <p className="text-gray-300 mt-2">{order.customer_name}</p>}
        </div>

        {/* Status steps */}
        <div className="space-y-4">
          {STEPS.slice(0, 3).map((step, idx) => {
            const Icon = step.icon
            const isActive = idx === currentStepIndex
            const isDone = idx < currentStepIndex
            return (
              <div key={step.status} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-gray-800 ring-2 ring-offset-0' : isDone ? 'bg-gray-900' : 'bg-gray-900 opacity-40'}`}
                style={isActive ? { outline: `2px solid ${step.color}` } : {}}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? 'animate-pulse' : ''}`}
                  style={{ backgroundColor: (isActive || isDone) ? step.color + '33' : '#374151' }}>
                  <Icon size={24} style={{ color: (isActive || isDone) ? step.color : '#6B7280' }} />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: (isActive || isDone) ? step.color : '#9CA3AF' }}>{step.label}</p>
                  {isActive && <p className="text-sm text-gray-400">Aguarde...</p>}
                  {isDone && <p className="text-sm text-gray-500">✓ Concluído</p>}
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-gray-800 rounded-2xl p-4">
          <p className="text-sm text-gray-400 mb-2">Itens do pedido:</p>
          {order.items.map((item) => (
            <p key={item.id} className="text-sm text-gray-200">{item.quantity}x {item.product_name}</p>
          ))}
          <div className="border-t border-gray-700 mt-3 pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-blue-400">R$ {Number(order.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
