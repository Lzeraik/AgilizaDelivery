'use client'
import { useEffect, useState, useCallback } from 'react'
import { getKitchenQueue, getTheme, startPreparing, markReady } from '@/services/api'
import type { Order, Theme } from '@/types'
import { useWebSocket } from '@/hooks/useWebSocket'
import { CheckCircle, Clock, ChefHat, Utensils, Flame } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando',
  preparing: 'Preparando',
  ready: 'Pronto',
}

export default function KitchenPage() {
  const [theme, setTheme] = useState<Theme | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const loadQueue = useCallback(async () => {
    try {
      const data = await getKitchenQueue()
      setOrders(data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    getTheme('kitchen').then(setTheme)
    loadQueue()
  }, [loadQueue])

  useWebSocket('/kitchen/ws', useCallback((event: string, data: unknown) => {
    if (event === 'new_order') {
      setOrders((prev) => {
        const order = data as Order
        if (prev.find((o) => o.id === order.id)) return prev
        toast('Novo pedido #' + order.order_number, { icon: '🔔' })
        return [...prev, order]
      })
    }
  }, []))

  const handlePrepare = async (orderId: number) => {
    try {
      const updated = await startPreparing(orderId)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)))
    } catch { /* silent */ }
  }

  const handleReady = async (orderId: number) => {
    try {
      await markReady(orderId)
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
      toast.success('Pedido marcado como pronto!')
    } catch { /* silent */ }
  }

  if (!theme || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  )

  const pending = orders.filter((o) => o.status === 'pending')
  const preparing = orders.filter((o) => o.status === 'preparing')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 px-6 py-4 flex items-center gap-4 shadow-lg">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <ChefHat size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Cozinha — {theme.restaurant_name}</h1>
          <p className="text-xs text-gray-400">Fila de pedidos em tempo real</p>
        </div>
        <div className="ml-auto flex gap-3">
          <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-xl text-sm font-semibold flex items-center gap-1.5">
            <Clock size={14} /> {pending.length} aguardando
          </div>
          <div className="bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-xl text-sm font-semibold flex items-center gap-1.5">
            <Flame size={14} /> {preparing.length} preparando
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <Utensils size={36} className="text-gray-300" />
            </div>
            <p className="text-xl font-medium">Nenhum pedido na fila</p>
            <p className="text-sm text-gray-300">Os pedidos aparecem aqui em tempo real</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => (
              <div key={order.id}
                className={`bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden animate-slide-in border-l-4 ${order.status === 'preparing' ? 'border-orange-500' : 'border-yellow-400'}`}>
                <div className="p-4">
                  {/* Order header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl font-black text-gray-900">#{order.order_number}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${order.status === 'preparing' ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-700'}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <Clock size={11} />
                    <span>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ptBR })}</span>
                    <span className="ml-auto font-medium text-gray-500">{order.order_type === 'dine_in' ? '🍽️ Local' : '🛍️ Viagem'}</span>
                  </div>

                  {order.customer_name && (
                    <div className="bg-gray-50 rounded-lg px-3 py-1.5 mb-3">
                      <p className="text-xs text-gray-500">Cliente: <strong className="text-gray-700">{order.customer_name}</strong></p>
                    </div>
                  )}

                  {/* Items */}
                  <ul className="space-y-1.5 mb-4">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-start gap-2 text-sm">
                        <span className="font-bold text-orange-500 min-w-[24px]">{item.quantity}x</span>
                        <span className="text-gray-700">{item.product_name}</span>
                        {item.notes && <span className="text-xs text-yellow-600 italic ml-auto">({item.notes})</span>}
                      </li>
                    ))}
                  </ul>

                  {order.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 mb-3">
                      <p className="text-xs text-yellow-700">📝 {order.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {order.status === 'pending' && (
                    <button onClick={() => handlePrepare(order.id)}
                      className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors shadow-sm">
                      Iniciar preparo
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button onClick={() => handleReady(order.id)}
                      className="w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                      <CheckCircle size={16} /> Pronto!
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
