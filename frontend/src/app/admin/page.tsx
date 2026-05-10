'use client'
import { useEffect, useState } from 'react'
import { getDailySummary, getTopProducts, getPeakHours, getLowStock, getRevenue } from '@/services/api'
import type { DailySummary, TopProduct, PeakHour, Stock } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, ShoppingBag, DollarSign, AlertCircle, Clock } from 'lucide-react'

export default function AdminDashboard() {
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [peakHours, setPeakHours] = useState<PeakHour[]>([])
  const [lowStock, setLowStock] = useState<Stock[]>([])
  const [revenue, setRevenue] = useState<{ date: string; revenue: number }[]>([])

  useEffect(() => {
    getDailySummary().then(setSummary)
    getTopProducts(30, 5).then(setTopProducts)
    getPeakHours(30).then(setPeakHours)
    getLowStock().then(setLowStock)
    getRevenue(30).then(setRevenue)
  }, [])

  const cards = summary ? [
    { label: 'Pedidos Hoje', value: summary.total_orders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Receita Hoje', value: `R$ ${summary.total_revenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Em Preparo', value: summary.preparing, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Entregues', value: summary.delivered, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ] : []

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
              <card.icon className={card.color} size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-red-700">Estoque baixo</p>
            <p className="text-sm text-red-600">{lowStock.map((s) => `${s.product_name} (${s.quantity})`).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        {revenue.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Receita (30 dias)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Receita']} />
                <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Peak hours */}
        {peakHours.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Horários de Pico</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}h`} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(v) => `${v}h`} formatter={(v: number) => [v, 'Pedidos']} />
                <Bar dataKey="order_count" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top products */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Produtos Mais Vendidos (30 dias)</h3>
          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div key={p.product_id} className="flex items-center gap-4">
                <span className="text-lg font-black text-gray-300 w-6">{idx + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{p.product_name}</span>
                    <span className="text-sm text-gray-500">{p.total_sold} vendas · R$ {p.total_revenue.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(p.total_sold / topProducts[0].total_sold) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
