'use client'
import { useState } from 'react'
import { getUsers, createUser, updateUser, deleteUser } from '@/services/api'
import type { User } from '@/types'
import { useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE_LABELS: Record<string, string> = { admin: '👑 Admin', attendant: '👤 Atendente', kitchen: '👨‍🍳 Cozinha' }

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [modal, setModal] = useState<Partial<User & { password: string }> | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => getUsers().then(setUsers)

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!modal?.name || !modal?.email) return toast.error('Nome e email são obrigatórios')
    setSaving(true)
    try {
      if (modal.id) {
        await updateUser(modal.id, modal)
        toast.success('Usuário atualizado!')
      } else {
        if (!modal.password) { toast.error('Senha obrigatória'); setSaving(false); return }
        await createUser({ name: modal.name, email: modal.email, password: modal.password, role: modal.role || 'attendant' })
        toast.success('Usuário criado!')
      }
      load(); setModal(null)
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir usuário?')) return
    await deleteUser(id); toast.success('Excluído'); load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuários & Configurações</h1>
        <button onClick={() => setModal({ role: 'attendant', is_active: true })}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors">
          <Plus size={18} /> Novo usuário
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 font-semibold">
            <tr>
              <th className="text-left px-6 py-4">Nome</th>
              <th className="text-left px-6 py-4">Email</th>
              <th className="text-left px-6 py-4">Função</th>
              <th className="text-left px-6 py-4">Status</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                <td className="px-6 py-4 text-gray-600">{u.email}</td>
                <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{ROLE_LABELS[u.role]}</span></td>
                <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{u.is_active ? 'Ativo' : 'Inativo'}</span></td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setModal(u)} className="p-2 text-gray-400 hover:text-orange-500"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(u.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-lg">{modal.id ? 'Editar' : 'Novo'} Usuário</h2>
              <button onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome *</label>
                <input value={modal.name || ''} onChange={(e) => setModal({ ...modal, name: e.target.value })} className="w-full mt-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email *</label>
                <input type="email" value={modal.email || ''} onChange={(e) => setModal({ ...modal, email: e.target.value })} className="w-full mt-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              {!modal.id && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Senha *</label>
                  <input type="password" value={modal.password || ''} onChange={(e) => setModal({ ...modal, password: e.target.value })} className="w-full mt-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Função</label>
                <select value={modal.role || 'attendant'} onChange={(e) => setModal({ ...modal, role: e.target.value as User['role'] })} className="w-full mt-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400">
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={modal.is_active ?? true} onChange={(e) => setModal({ ...modal, is_active: e.target.checked })} className="w-4 h-4 accent-orange-500" />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">Usuário ativo</label>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setModal(null)} className="flex-1 border rounded-xl py-2 font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2 font-bold disabled:opacity-50 transition-colors">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
