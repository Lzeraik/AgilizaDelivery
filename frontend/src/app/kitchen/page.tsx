'use client'
import { useEffect, useState, useCallback } from 'react'
import { getKitchenQueue, getTheme, startPreparing, markReady } from '@/services/api'
import type { Order, Theme } from '@/types'
import { useWebSocket } from '@/hooks/useWebSocket'
import { CheckCircle, Clock, ChefHat, Utensils } from 'lucide-react'
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
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getTheme('kitchen').then(setTheme)
    loadQueue()
  }, [loadQueue])

  useWebSocket('/kitchen/ws', useCallback((event: string, data: unknown) => {
    if (event === 'new_order') {
      setOrders((prev) => {
        const order = data as Order
        const exists = prev.find((o) => o.id === order.id)
        if (exists) return prev
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

  const themeStyle = theme ? {
    '--primary': theme.primary_color,
    backgroundColor: theme.bg_color,
    color: theme.text_color,
    fontFamily: theme.font_family,
  } as React.CSSProperties : {}

  if (!theme || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="animate-spin w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col" style={themeStyle}>
      <header className="px-6 py-4 flex items-center gap-3" style={{ backgroundColor: theme.primary_color }}>
        <ChefHat className="text-white" size={28} />
        <h1 className="text-2xl font-bold text-white">Cozinha — {theme.restaurant_name}</h1>
        <span className="ml-auto bg-white/20 text-white px-3 py-1 rounded-full text-sm font-semibold">{orders.length} pedido{orders.length !== 1 ? 's' : ''}</span>
      </header>

      <main className="flex-1 p-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-50">
            <Utensils size={64} />
            <p className="text-xl font-medium">Nenhum pedido na fila</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => (
              <div key={order.id} className={`rounded-2xl overflow-hidden shadow-lg border-l-4 animate-slide-in`}
                style={{
                  backgroundColor: order.status === 'preparing' ? '#1f2937' : '#111827',
                  borderLeftColor: order.status === 'preparing' ? theme.primary_color : theme.accent_color,
                }}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-black" style={{ color: theme.primary_color }}>#{order.order_number}</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${order.status === 'preparing' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <Clock size={12} />
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ptBR })}
                    <span className="ml-auto">{order.order_type === 'dine_in' ? '🍽️ Local' : '🛍️ Viagem'}</span>
                  </div>

                  {order.customer_name && (
                    <p className="text-sm text-gray-300 mb-2">Cliente: <strong>{order.customer_name}</strong></p>
                  )}

                  <ul className="space-y-1 mb-4">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-start gap-2 text-sm">
                        <span className="font-bold text-white min-w-[24px]">{item.quantity}x</span>
                        <span className="text-gray-200">{item.product_name}</span>
                        {item.notes && <span className="text-xs text-yellow-400 italic">({item.notes})</span>}
                      </li>
                    ))}
                  </ul>

                  {order.notes && (
                    <p className="text-xs text-yellow-300 bg-yellow-900/30 rounded-lg p-2 mb-3">📝 {order.notes}</p>
                  )}

                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <button onClick={() => handlePrepare(order.id)}
                        className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: theme.primary_color }}>
                        Iniciar preparo
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button onClick={() => handleReady(order.id)}
                        className="flex-1 py-2 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1 transition-all hover:opacity-90"
                        style={{ backgroundColor: '#22c55e' }}>
                        <CheckCircle size={16} /> Pronto!
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
