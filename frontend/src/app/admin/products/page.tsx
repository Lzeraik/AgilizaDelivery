'use client'
import { useEffect, useState } from 'react'
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, uploadFile } from '@/services/api'
import type { Product, Category } from '@/types'
import { Plus, Pencil, Trash2, X, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [modal, setModal] = useState<Partial<Product> | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => getProducts().then(setProducts)

  useEffect(() => {
    load()
    getCategories().then(setCategories)
  }, [])

  const handleSave = async () => {
    if (!modal?.name || !modal?.price || !modal?.category_id) return toast.error('Preencha nome, preço e categoria')
    setSaving(true)
    try {
      if (modal.id) {
        await updateProduct(modal.id, modal)
        toast.success('Produto atualizado!')
      } else {
        await createProduct(modal)
        toast.success('Produto criado!')
      }
      load()
      setModal(null)
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir produto?')) return
    await deleteProduct(id)
    toast.success('Produto excluído')
    load()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { url } = await uploadFile('products', file)
      setModal((m) => m ? { ...m, image_url: url } : m)
      toast.success('Imagem enviada!')
    } catch { toast.error('Erro ao enviar imagem') }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
        <button onClick={() => setModal({ is_available: true, preparation_time: 15, display_order: 0 })}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors">
          <Plus size={18} /> Novo produto
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-sm text-gray-500 font-semibold">
            <tr>
              <th className="text-left px-6 py-4">Produto</th>
              <th className="text-left px-6 py-4">Categoria</th>
              <th className="text-left px-6 py-4">Preço</th>
              <th className="text-left px-6 py-4">Disponível</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 flex items-center gap-3">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                    : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">🍽️</div>}
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.description && <p className="text-xs text-gray-400 line-clamp-1">{p.description}</p>}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{categories.find((c) => c.id === p.category_id)?.name || '-'}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">R$ {Number(p.price).toFixed(2)}</td>
                <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${p.is_available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{p.is_available ? 'Sim' : 'Não'}</span></td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => setModal(p)} className="p-2 text-gray-400 hover:text-orange-500 transition-colors"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{modal.id ? 'Editar' : 'Novo'} Produto</h2>
              <button onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex gap-4 items-start">
                <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {modal.image_url
                    ? <img src={modal.image_url} alt="Produto" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>}
                </div>
                <label className="flex items-center gap-2 text-sm text-orange-500 font-medium cursor-pointer hover:text-orange-600">
                  <Upload size={16} /> Upload de imagem
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Nome *</label>
                  <input value={modal.name || ''} onChange={(e) => setModal({ ...modal, name: e.target.value })} className="w-full mt-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Descrição</label>
                  <textarea value={modal.description || ''} onChange={(e) => setModal({ ...modal, description: e.target.value })} rows={2} className="w-full mt-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Categoria *</label>
                  <select value={modal.category_id || ''} onChange={(e) => setModal({ ...modal, category_id: Number(e.target.value) })} className="w-full mt-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="">Selecione...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Preço (R$) *</label>
                  <input type="number" step="0.01" value={modal.price || ''} onChange={(e) => setModal({ ...modal, price: Number(e.target.value) })} className="w-full mt-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tempo preparo (min)</label>
                  <input type="number" value={modal.preparation_time || 15} onChange={(e) => setModal({ ...modal, preparation_time: Number(e.target.value) })} className="w-full mt-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input type="checkbox" id="available" checked={modal.is_available ?? true} onChange={(e) => setModal({ ...modal, is_available: e.target.checked })} className="w-4 h-4 accent-orange-500" />
                  <label htmlFor="available" className="text-sm font-medium text-gray-700">Disponível</label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setModal(null)} className="flex-1 border rounded-xl py-2 font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2 font-bold transition-colors disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
