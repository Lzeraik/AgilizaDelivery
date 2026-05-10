'use client'
import { useEffect, useState, useCallback } from 'react'
import { getCategories, getProducts, getTheme, createOrder, initiatePayment, confirmPayment } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import type { Category, Product, Theme, Order } from '@/types'
import { login } from '@/services/api'
import { ShoppingBag, LogOut, ChevronRight, Plus, Minus, ArrowLeft, CreditCard, Banknote, QrCode, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'

type Step = 'login' | 'menu' | 'cart' | 'order-type' | 'payment' | 'success'

export default function AttendantPage() {
  const { user, setAuth, clearAuth } = useAuthStore()
  const [theme, setTheme] = useState<Theme | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [step, setStep] = useState<Step>(user ? 'menu' : 'login')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { items, addItem, updateQuantity, clearCart, total, count, orderType, setOrderType } = useCartStore()

  useEffect(() => {
    getTheme('attendant').then(setTheme)
  }, [])

  useEffect(() => {
    if (user) {
      getCategories(true).then((cats) => {
        setCategories(cats)
        if (cats.length) setActiveCategory(cats[0].id)
      })
    }
  }, [user])

  useEffect(() => {
    if (activeCategory) getProducts({ category_id: activeCategory, available_only: true }).then(setProducts)
  }, [activeCategory])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = await login(email, password)
      if (data.user.role === 'kitchen') { toast.error('Acesso não permitido'); return }
      setAuth(data.user, data.access_token)
      setStep('menu')
    } catch { toast.error('Email ou senha inválidos') }
  }

  const handlePay = async () => {
    if (!paymentMethod) return toast.error('Selecione um método de pagamento')
    setIsProcessing(true)
    try {
      const order = await createOrder({
        source: 'attendant',
        order_type: orderType,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity, notes: i.notes })),
        attendant_id: user?.id,
        customer_name: customerName || undefined,
      })
      await initiatePayment(order.id, paymentMethod)
      await confirmPayment(order.id)
      setCompletedOrder(order)
      setStep('success')
      clearCart()
      setCustomerName('')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Erro ao processar pagamento'
      toast.error(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  const themeStyle = theme ? {
    '--primary': theme.primary_color,
    backgroundColor: theme.bg_color,
    color: theme.text_color,
    fontFamily: theme.font_family,
  } as React.CSSProperties : {}

  if (!theme) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" /></div>

  // Login screen
  if (!user || step === 'login') return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg_color }}>
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          {theme.logo_url ? <img src={theme.logo_url} alt="Logo" className="h-16 w-16 rounded-full object-cover mb-3" /> : <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: theme.primary_color }}><User size={32} className="text-white" /></div>}
          <h1 className="text-2xl font-bold">{theme.restaurant_name}</h1>
          <p className="text-gray-500 text-sm">Acesso do Atendente</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" required className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2" />
          <button type="submit" className="w-full py-3 rounded-xl text-white font-bold" style={{ backgroundColor: theme.primary_color }}>Entrar</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col" style={themeStyle}>
      <header className="px-6 py-4 flex items-center justify-between shadow-md" style={{ backgroundColor: theme.primary_color }}>
        <div className="flex items-center gap-3">
          {theme.logo_url && <img src={theme.logo_url} alt="Logo" className="h-9 w-9 rounded-full object-cover" />}
          <div>
            <h1 className="text-xl font-bold text-white">{theme.restaurant_name}</h1>
            <p className="text-xs text-white/70">Atendente: {user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {step === 'menu' && (
            <button onClick={() => setStep('cart')} className="relative flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full">
              <ShoppingBag size={18} />
              {count() > 0 && <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{count()}</span>}
            </button>
          )}
          <button onClick={() => { clearAuth(); setStep('login') }} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full"><LogOut size={18} /></button>
        </div>
      </header>

      {step === 'menu' && (
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-44 flex-shrink-0 border-r overflow-y-auto" style={{ borderColor: theme.primary_color + '33' }}>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className="w-full px-3 py-4 flex flex-col items-center gap-1 text-xs font-medium transition-all border-b"
                style={activeCategory === cat.id ? { backgroundColor: theme.primary_color, color: 'white' } : { borderColor: '#e5e7eb' }}>
                <span className="text-xl">{cat.icon}</span>{cat.name}
              </button>
            ))}
          </aside>
          <main className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((product) => {
                const inCart = items.find((i) => i.product.id === product.id)
                return (
                  <div key={product.id} className="bg-white rounded-2xl shadow overflow-hidden cursor-pointer hover:shadow-lg transition-all" onClick={() => { addItem(product); toast.success('Adicionado!') }}>
                    <div className="h-32 bg-gray-100">
                      {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>}
                    </div>
                    <div className="p-2">
                      <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-bold text-sm" style={{ color: theme.primary_color }}>R$ {Number(product.price).toFixed(2)}</span>
                        {inCart && <span className="text-xs bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-full">{inCart.quantity}x</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </main>
        </div>
      )}

      {step === 'cart' && (
        <div className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full">
          <button onClick={() => setStep('menu')} className="flex items-center gap-2 mb-4 text-gray-600"><ArrowLeft size={20} /> Voltar</button>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600">Nome do cliente (opcional)</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ex: João" className="w-full mt-1 border rounded-xl px-4 py-2 outline-none focus:ring-2" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Sacola</h2>
          {items.length === 0
            ? <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4"><ShoppingBag size={48} /><p>Sacola vazia</p></div>
            : (
              <div className="flex-1 overflow-y-auto space-y-3">
                {items.map((item) => (
                  <div key={item.product.id} className="bg-white rounded-xl shadow p-3 flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.product.name}</p>
                      <p className="text-xs text-gray-500">R$ {(Number(item.product.price) * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><Minus size={12} /></button>
                      <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-7 h-7 rounded-full text-white flex items-center justify-center" style={{ backgroundColor: theme.primary_color }}><Plus size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          {items.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Total</span><span style={{ color: theme.primary_color }}>R$ {total().toFixed(2)}</span>
              </div>
              <button onClick={() => setStep('order-type')} className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2" style={{ backgroundColor: theme.primary_color }}>
                Continuar <ChevronRight />
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'order-type' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
          <h2 className="text-2xl font-bold">Como prefere o pedido?</h2>
          <div className="flex gap-6 w-full max-w-sm">
            {(['dine_in', 'takeaway'] as const).map((type) => (
              <button key={type} onClick={() => { setOrderType(type); setStep('payment') }}
                className="flex-1 py-8 rounded-2xl flex flex-col items-center gap-2 text-lg font-bold border-2 transition-all"
                style={orderType === type ? { backgroundColor: theme.primary_color, color: 'white', borderColor: theme.primary_color } : { borderColor: '#e5e7eb' }}>
                <span className="text-3xl">{type === 'dine_in' ? '🍽️' : '🛍️'}</span>
                {type === 'dine_in' ? 'Local' : 'Viagem'}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6 max-w-md mx-auto w-full">
          <button onClick={() => setStep('order-type')} className="self-start flex items-center gap-2 text-gray-600"><ArrowLeft size={20} /> Voltar</button>
          <h2 className="text-2xl font-bold">Forma de pagamento</h2>
          <div className="w-full space-y-3">
            {[
              { id: 'credit_card', label: 'Cartão de Crédito', icon: <CreditCard size={22} /> },
              { id: 'debit_card', label: 'Cartão de Débito', icon: <Banknote size={22} /> },
              { id: 'pix', label: 'Pix', icon: <QrCode size={22} /> },
            ].map((m) => (
              <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                className="w-full p-4 rounded-xl flex items-center gap-3 font-semibold transition-all border-2"
                style={paymentMethod === m.id ? { backgroundColor: theme.primary_color, color: 'white', borderColor: theme.primary_color } : { borderColor: '#e5e7eb' }}>
                {m.icon}{m.label}
              </button>
            ))}
          </div>
          <div className="w-full flex justify-between font-bold border-t pt-3">
            <span>Total</span><span style={{ color: theme.primary_color }}>R$ {total().toFixed(2)}</span>
          </div>
          <button onClick={handlePay} disabled={!paymentMethod || isProcessing} className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50" style={{ backgroundColor: theme.primary_color }}>
            {isProcessing ? 'Processando...' : 'Confirmar Pagamento'}
          </button>
        </div>
      )}

      {step === 'success' && completedOrder && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-5 text-center">
          <div className="text-6xl">✅</div>
          <h2 className="text-2xl font-bold">Pedido #{completedOrder.order_number} confirmado!</h2>
          <p className="text-gray-500 text-sm">QR code para o cliente acompanhar o pedido:</p>
          <div className="bg-white p-4 rounded-2xl shadow-lg">
            <QRCodeSVG value={`${process.env.NEXT_PUBLIC_API_URL?.replace('8000', '3000') || 'http://localhost:3000'}/track/${completedOrder.tracking_token}`} size={180} />
          </div>
          <p className="text-xs text-gray-400">Entregue o QR code ao cliente ou imprima com a nota fiscal</p>
          <button onClick={() => { setStep('menu'); setCompletedOrder(null) }} className="px-8 py-3 rounded-xl text-white font-bold" style={{ backgroundColor: theme.primary_color }}>
            Novo atendimento
          </button>
        </div>
      )}
    </div>
  )
}
