'use client'
import { useEffect, useState } from 'react'
import { getStock, updateStock } from '@/services/api'
import type { Stock } from '@/types'
import { AlertCircle, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StockPage() {
  const [stock, setStock] = useState<Stock[]>([])
  const [edits, setEdits] = useState<Record<number, { quantity: number; min_quantity: number }>>({})

  useEffect(() => { getStock().then(setStock) }, [])

  const handleSave = async (productId: number) => {
    const edit = edits[productId]
    if (!edit) return
    try {
      await updateStock(productId, edit.quantity, edit.min_quantity)
      toast.success('Estoque atualizado')
      getStock().then(setStock)
      setEdits((e) => { const n = { ...e }; delete n[productId]; return n })
    } catch { toast.error('Erro ao atualizar') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Estoque</h1>
        {stock.filter((s) => s.is_low).length > 0 && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-xl text-sm font-medium">
            <AlertCircle size={16} />
            {stock.filter((s) => s.is_low).length} produto(s) com estoque baixo
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 font-semibold">
            <tr>
              <th className="text-left px-6 py-4">Produto</th>
              <th className="text-left px-6 py-4">Quantidade</th>
              <th className="text-left px-6 py-4">Estoque Mínimo</th>
              <th className="text-left px-6 py-4">Status</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {stock.map((s) => {
              const edit = edits[s.product_id]
              const qty = edit?.quantity ?? s.quantity
              const min = edit?.min_quantity ?? s.min_quantity
              return (
                <tr key={s.product_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{s.product_name}</td>
                  <td className="px-6 py-4">
                    <input type="number" min={0} value={qty}
                      onChange={(e) => setEdits((ed) => ({ ...ed, [s.product_id]: { quantity: Number(e.target.value), min_quantity: min } }))}
                      className="w-24 border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </td>
                  <td className="px-6 py-4">
                    <input type="number" min={0} value={min}
                      onChange={(e) => setEdits((ed) => ({ ...ed, [s.product_id]: { quantity: qty, min_quantity: Number(e.target.value) } }))}
                      className="w-24 border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.is_low ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {s.is_low ? '⚠️ Baixo' : '✅ OK'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {edits[s.product_id] && (
                      <button onClick={() => handleSave(s.product_id)} className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium text-xs">
                        <Save size={14} /> Salvar
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
