'use client'
import { useEffect, useState, useCallback } from 'react'
import { getDisplayOrders, getTheme } from '@/services/api'
import type { Order, Theme } from '@/types'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Clock, CheckCircle, Utensils } from 'lucide-react'

export default function DisplayPage() {
  const [theme, setTheme] = useState<Theme | null>(null)
  const [preparing, setPreparing] = useState<Order[]>([])
  const [ready, setReady] = useState<Order[]>([])

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
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [loadOrders])

  useWebSocket('/display/ws', useCallback((event: string, data: unknown) => {
    const order = data as Order
    if (event === 'new_order') {
      setPreparing((prev) => prev.find((o) => o.id === order.id) ? prev : [...prev, order])
    }
    if (event === 'order_status_update') {
      if (order.status === 'preparing') {
        setPreparing((prev) => prev.find((o) => o.id === order.id) ? prev.map((o) => o.id === order.id ? order : o) : [...prev, order])
        setReady((prev) => prev.filter((o) => o.id !== order.id))
      }
    }
    if (event === 'order_ready') {
      setPreparing((prev) => prev.filter((o) => o.id !== order.id))
      setReady((prev) => [order, ...prev.filter((o) => o.id !== order.id)].slice(0, 20))
    }
  }, []))

  const themeStyle = theme ? {
    backgroundColor: theme.bg_color,
    color: theme.text_color,
    fontFamily: theme.font_family,
  } as React.CSSProperties : {}

  if (!theme) return <div className="min-h-screen bg-gray-950" />

  return (
    <div className="min-h-screen flex flex-col" style={themeStyle}>
      <header className="px-8 py-5 flex items-center gap-3" style={{ backgroundColor: theme.primary_color }}>
        {theme.logo_url && <img src={theme.logo_url} alt="Logo" className="h-10 w-10 rounded-full object-cover" />}
        <h1 className="text-3xl font-black text-white tracking-wide">{theme.restaurant_name}</h1>
        <div className="ml-auto text-white text-sm opacity-80">
          {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      <div className="flex flex-1 divide-x divide-gray-700">
        {/* Preparing */}
        <section className="flex-1 flex flex-col p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock size={28} style={{ color: theme.accent_color }} />
            <h2 className="text-2xl font-bold">Em Preparo</h2>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {preparing.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 opacity-30 gap-3">
                <Utensils size={40} />
                <p>Nenhum pedido em preparo</p>
              </div>
            ) : preparing.map((order) => (
              <div key={order.id} className="rounded-2xl p-4 flex items-center gap-4 animate-fade-in" style={{ backgroundColor: theme.primary_color + '22', borderLeft: `4px solid ${theme.accent_color}` }}>
                <span className="text-4xl font-black min-w-[80px]" style={{ color: theme.accent_color }}>#{order.order_number}</span>
                <div>
                  {order.customer_name && <p className="font-semibold">{order.customer_name}</p>}
                  <p className="text-sm opacity-70">{order.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ready */}
        <section className="flex-1 flex flex-col p-6">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle size={28} style={{ color: theme.accent_color }} />
            <h2 className="text-2xl font-bold">Pronto para Retirar</h2>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {ready.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 opacity-30 gap-3">
                <CheckCircle size={40} />
                <p>Nenhum pedido pronto</p>
              </div>
            ) : ready.map((order) => (
              <div key={order.id} className="rounded-2xl p-4 flex items-center gap-4 animate-fade-in" style={{ backgroundColor: theme.accent_color + '22', borderLeft: `4px solid ${theme.accent_color}` }}>
                <span className="text-4xl font-black min-w-[80px]" style={{ color: theme.accent_color }}>#{order.order_number}</span>
                <div>
                  {order.customer_name && <p className="font-semibold">{order.customer_name}</p>}
                  <p className="text-sm" style={{ color: theme.accent_color }}>✅ Retire no balcão</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
