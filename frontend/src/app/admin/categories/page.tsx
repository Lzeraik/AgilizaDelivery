'use client'
import { useEffect, useState } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/api'
import type { Category } from '@/types'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

const ICONS = ['🍽️', '🍔', '🍕', '🍣', '🍜', '🥗', '🍰', '🍰', '🧁', '🍦', '🥤', '🧃', '🍺', '🍸', '☕', '🥩', '🌮', '🥪']

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [modal, setModal] = useState<Partial<Category> | null>(null)

  const load = () => getCategories().then(setCategories)

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!modal?.name) return toast.error('Nome obrigatório')
    try {
      if (modal.id) { await updateCategory(modal.id, modal); toast.success('Categoria atualizada!') }
      else { await createCategory(modal); toast.success('Categoria criada!') }
      load(); setModal(null)
    } catch { toast.error('Erro ao salvar') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir categoria?')) return
    await deleteCategory(id); toast.success('Excluída'); load()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
        <button onClick={() => setModal({ is_active: true, icon: '🍽️', display_order: 0 })}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors">
          <Plus size={18} /> Nova categoria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
            <span className="text-4xl">{cat.icon}</span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{cat.name}</p>
              {cat.description && <p className="text-sm text-gray-400">{cat.description}</p>}
              <span className={`text-xs px-2 py-0.5 rounded-full ${cat.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{cat.is_active ? 'Ativa' : 'Inativa'}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModal(cat)} className="p-2 text-gray-400 hover:text-orange-500"><Pencil size={16} /></button>
              <button onClick={() => handleDelete(cat.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{modal.id ? 'Editar' : 'Nova'} Categoria</h2>
              <button onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome *</label>
                <input value={modal.name || ''} onChange={(e) => setModal({ ...modal, name: e.target.value })} className="w-full mt-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <input value={modal.description || ''} onChange={(e) => setModal({ ...modal, description: e.target.value })} className="w-full mt-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Ícone</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ICONS.map((icon) => (
                    <button key={icon} onClick={() => setModal({ ...modal, icon })}
                      className={`text-2xl p-1 rounded-lg transition-all ${modal.icon === icon ? 'bg-orange-100 ring-2 ring-orange-400' : 'hover:bg-gray-100'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={modal.is_active ?? true} onChange={(e) => setModal({ ...modal, is_active: e.target.checked })} className="w-4 h-4 accent-orange-500" />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">Categoria ativa</label>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setModal(null)} className="flex-1 border rounded-xl py-2 font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2 font-bold transition-colors">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
