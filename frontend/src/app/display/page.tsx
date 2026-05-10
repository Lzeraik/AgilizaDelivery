'use client'
import { useEffect, useState, useCallback } from 'react'
import { getDisplayOrders, getTheme } from '@/services/api'
import type { Order, Theme } from '@/types'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Clock, CheckCircle, Utensils, ChefHat } from 'lucide-react'

export default function DisplayPage() {
  const [theme, setTheme] = useState<Theme | null>(null)
  const [preparing, setPreparing] = useState<Order[]>([])
  const [ready, setReady] = useState<Order[]>([])
  const [time, setTime] = useState(new Date())

  const loadOrders = useCallback(async () => {
    try {
      const data = await getDisplayOrders()
      setPreparing(data.preparing)
      setReady(data.ready)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    getTheme('display').then(setTheme)
    loadOrders()
    const dataInterval = setInterval(loadOrders, 30000)
    const clockInterval = setInterval(() => setTime(new Date()), 1000)
    return () => { clearInterval(dataInterval); clearInterval(clockInterval) }
  }, [loadOrders])

  useWebSocket('/display/ws', useCallback((event: string, data: unknown) => {
    const order = data as Order
    if (event === 'new_order') {
      setPreparing((prev) => prev.find((o) => o.id === order.id) ? prev : [...prev, order])
    }
    if (event === 'order_status_update') {
      if (order.status === 'preparing') {
        setPreparing((prev) => prev.find((o) => o.id === order.id)
          ? prev.map((o) => o.id === order.id ? order : o)
          : [...prev, order])
        setReady((prev) => prev.filter((o) => o.id !== order.id))
      }
    }
    if (event === 'order_ready') {
      setPreparing((prev) => prev.filter((o) => o.id !== order.id))
      setReady((prev) => [order, ...prev.filter((o) => o.id !== order.id)].slice(0, 20))
    }
  }, []))

  if (!theme) return <div className="min-h-screen bg-gray-50" />

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 px-8 py-5 flex items-center gap-4 shadow-lg">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
          {theme.logo_url
            ? <img src={theme.logo_url} alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
            : <ChefHat size={22} className="text-white" />}
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide">{theme.restaurant_name}</h1>
          <p className="text-xs text-gray-400">Acompanhe seu pedido</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-bold text-white tabular-nums">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-gray-400">
            {time.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
          </p>
        </div>
      </header>

      {/* Columns */}
      <div className="flex flex-1 gap-0">
        {/* Preparing */}
        <section className="flex-1 flex flex-col p-6 border-r border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock size={22} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Em Preparo</h2>
              <p className="text-xs text-gray-400">{preparing.length} pedido{preparing.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {preparing.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-300 gap-3">
                <Utensils size={40} />
                <p className="text-sm">Nenhum pedido em preparo</p>
              </div>
            ) : preparing.map((order) => (
              <div key={order.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-4 flex items-center gap-4 border-l-4 border-orange-400 animate-slide-in">
                <span className="text-4xl font-black text-orange-500 min-w-[72px]">#{order.order_number}</span>
                <div className="flex-1 min-w-0">
                  {order.customer_name && <p className="font-semibold text-gray-900 truncate">{order.customer_name}</p>}
                  <p className="text-sm text-gray-500 truncate">{order.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    <span className="text-xs text-orange-500 font-medium">Preparando...</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ready */}
        <section className="flex-1 flex flex-col p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={22} className="text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Pronto para Retirar</h2>
              <p className="text-xs text-gray-400">{ready.length} pedido{ready.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {ready.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-300 gap-3">
                <CheckCircle size={40} />
                <p className="text-sm">Nenhum pedido pronto</p>
              </div>
            ) : ready.map((order) => (
              <div key={order.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-4 flex items-center gap-4 border-l-4 border-green-400 animate-slide-in">
                <span className="text-4xl font-black text-green-500 min-w-[72px]">#{order.order_number}</span>
                <div className="flex-1 min-w-0">
                  {order.customer_name && <p className="font-semibold text-gray-900 truncate">{order.customer_name}</p>}
                  <div className="flex items-center gap-1.5 mt-1">
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="text-sm text-green-600 font-semibold">Retire no balcão</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
