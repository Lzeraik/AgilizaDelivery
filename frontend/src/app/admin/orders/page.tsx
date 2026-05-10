'use client'
import { useEffect, useState } from 'react'
import { listOrders, updateOrderStatus, emitirNFCe } from '@/services/api'
import type { Order, OrderStatus } from '@/types'
import { RefreshCw, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-600',
  preparing: 'bg-blue-50 text-blue-600',
  ready: 'bg-green-50 text-green-600',
  delivered: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-50 text-red-500',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando', preparing: 'Preparando', ready: 'Pronto', delivered: 'Entregue', cancelled: 'Cancelado',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<OrderStatus | ''>('')
  const [selected, setSelected] = useState<Order | null>(null)

  const load = () => listOrders({ status: filter as OrderStatus || undefined, limit: 100 }).then(setOrders)

  useEffect(() => { load() }, [filter])

  const handleStatus = async (orderId: number, status: OrderStatus) => {
    await updateOrderStatus(orderId, status)
    toast.success('Status atualizado')
    load()
  }

  const handleNFCe = async (orderId: number) => {
    try {
      const result = await emitirNFCe(orderId)
      toast.success(`NFC-e emitida: ${result.chave}`)
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Erro ao emitir NFC-e')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <div className="flex gap-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value as OrderStatus | '')} className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={load} className="p-2 text-gray-500 hover:text-orange-500 border rounded-xl"><RefreshCw size={16} /></button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 font-semibold">
            <tr>
              <th className="text-left px-6 py-4">#</th>
              <th className="text-left px-6 py-4">Origem</th>
              <th className="text-left px-6 py-4">Cliente</th>
              <th className="text-left px-6 py-4">Tipo</th>
              <th className="text-left px-6 py-4">Total</th>
              <th className="text-left px-6 py-4">Status</th>
              <th className="text-left px-6 py-4">Horário</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(o)}>
                <td className="px-6 py-4 font-bold text-gray-900">#{o.order_number}</td>
                <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.source === 'totem' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'}`}>{o.source === 'totem' ? '🖥️ Totem' : '👤 Atendente'}</span></td>
                <td className="px-6 py-4 text-gray-600">{o.customer_name || '—'}</td>
                <td className="px-6 py-4">{o.order_type === 'dine_in' ? '🍽️ Local' : '🛍️ Viagem'}</td>
                <td className="px-6 py-4 font-semibold">R$ {Number(o.total_amount).toFixed(2)}</td>
                <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span></td>
                <td className="px-6 py-4 text-gray-400">{new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleNFCe(o.id)} className="p-1 text-gray-400 hover:text-green-500" title="Emitir NFC-e"><FileText size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <div className="text-center py-16 text-gray-400">Nenhum pedido encontrado</div>}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">Pedido #{selected.order_number}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[selected.status]}`}>{STATUS_LABELS[selected.status]}</span>
            </div>
            <div className="p-6 space-y-3">
              {selected.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.product_name}</span>
                  <span className="text-gray-500">R$ {(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Total</span><span>R$ {Number(selected.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {(['preparing', 'ready', 'delivered', 'cancelled'] as OrderStatus[]).map((s) => (
                  <button key={s} onClick={() => { handleStatus(selected.id, s); setSelected(null) }}
                    className="px-3 py-1 rounded-full text-xs font-semibold border hover:bg-gray-50 transition-colors">
                    → {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
