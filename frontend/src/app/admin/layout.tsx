'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { login } from '@/services/api'
import {
  LayoutDashboard, Package, Tag, ClipboardList, BarChart2,
  Palette, Settings, Box, LogOut, ChefHat, Menu, X, Users,
} from 'lucide-react'
import toast from 'react-hot-toast'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Pedidos', icon: ClipboardList },
  { href: '/admin/products', label: 'Produtos', icon: Package },
  { href: '/admin/categories', label: 'Categorias', icon: Tag },
  { href: '/admin/stock', label: 'Estoque', icon: Box },
  { href: '/admin/reports', label: 'Relatórios', icon: BarChart2 },
  { href: '/admin/themes', label: 'Temas', icon: Palette },
  { href: '/admin/settings', label: 'Configurações', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token, setAuth, clearAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = await login(email, password)
      if (data.user.role !== 'admin') { toast.error('Acesso restrito a administradores'); return }
      setAuth(data.user, data.access_token)
    } catch { toast.error('Email ou senha inválidos') }
  }

  if (!token && !user) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4">
            <ChefHat size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">AgilizaDelivery</h1>
          <p className="text-gray-400 text-sm">Painel Administrativo</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" required className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          <button type="submit" className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors">Entrar</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-gray-900 text-white flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="p-4 flex items-center gap-3 border-b border-gray-700">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <ChefHat size={18} className="text-white" />
          </div>
          {sidebarOpen && <span className="font-bold truncate">AgilizaDelivery</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto text-gray-400 hover:text-white">
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${pathname === href ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700 space-y-2">
          {sidebarOpen && user && <p className="text-xs text-gray-400 truncate">{user.name}</p>}
          <button onClick={() => { clearAuth(); router.push('/admin') }}
            className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors w-full px-3 py-2">
            <LogOut size={18} />{sidebarOpen && <span className="text-sm">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <h2 className="font-semibold text-gray-700">{NAV.find((n) => n.href === pathname)?.label || 'Admin'}</h2>
          <div className="flex gap-3">
            <Link href="/totem" target="_blank" className="text-xs px-3 py-1 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors">🖥️ Totem</Link>
            <Link href="/kitchen" target="_blank" className="text-xs px-3 py-1 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors">👨‍🍳 Cozinha</Link>
            <Link href="/display" target="_blank" className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">📺 Display</Link>
            <Link href="/attendant" target="_blank" className="text-xs px-3 py-1 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors">👤 Atendente</Link>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
