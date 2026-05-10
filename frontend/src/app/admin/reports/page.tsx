'use client'
import { useEffect, useState } from 'react'
import { getDailySummary, getTopProducts, getPeakHours, getRevenue } from '@/services/api'
import type { DailySummary, TopProduct, PeakHour } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function ReportsPage() {
  const [days, setDays] = useState(30)
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [peakHours, setPeakHours] = useState<PeakHour[]>([])
  const [revenue, setRevenue] = useState<{ date: string; revenue: number; orders: number }[]>([])

  useEffect(() => {
    getDailySummary().then(setSummary)
    getTopProducts(days).then(setTopProducts)
    getPeakHours(days).then(setPeakHours)
    getRevenue(days).then(setRevenue)
  }, [days])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
          <option value={7}>Últimos 7 dias</option>
          <option value={30}>Últimos 30 dias</option>
          <option value={90}>Últimos 90 dias</option>
        </select>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pedidos hoje', value: summary.total_orders },
            { label: 'Receita hoje', value: `R$ ${summary.total_revenue.toFixed(2)}` },
            { label: 'Entregues hoje', value: summary.delivered },
            { label: 'Em preparo', value: summary.preparing },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <p className="text-3xl font-black text-orange-500">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Receita por dia</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Receita']} />
              <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Horários de Pico</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}h`} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip labelFormatter={(v) => `${v}:00h`} formatter={(v: number) => [v, 'Pedidos']} />
              <Bar dataKey="order_count" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-5">Produtos Mais Vendidos</h3>
        <div className="space-y-4">
          {topProducts.map((p, idx) => (
            <div key={p.product_id} className="flex items-center gap-4">
              <span className="text-xl font-black text-gray-200 w-8 text-right">{idx + 1}</span>
              <div className="flex-1">
                <div className="flex justify-between mb-1 text-sm">
                  <span className="font-medium text-gray-800">{p.product_name}</span>
                  <span className="text-gray-400">{p.total_sold}x · R$ {p.total_revenue.toFixed(2)}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-400 to-orange-300 rounded-full" style={{ width: `${(p.total_sold / topProducts[0].total_sold) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
          {topProducts.length === 0 && <p className="text-gray-400 text-center py-8">Sem dados neste período</p>}
        </div>
      </div>
    </div>
  )
}
