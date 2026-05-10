'use client'
import { useEffect, useState, useCallback } from 'react'
import { getCategories, getProducts, getTheme, createOrder, initiatePayment, confirmPayment } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import type { Category, Product, Theme, Order } from '@/types'
import { login } from '@/services/api'
import { ShoppingBag, LogOut, ChevronRight, Plus, Minus, ArrowLeft, CreditCard, Banknote, QrCode, User, ChefHat } from 'lucide-react'
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

  if (!theme) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  )

  // Login screen
  if (!user || step === 'login') return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-sm animate-slide-in">
        <div className="flex flex-col items-center mb-8">
          {theme.logo_url
            ? <img src={theme.logo_url} alt="Logo" className="h-16 w-16 rounded-full object-cover mb-3 ring-4 ring-orange-500" />
            : <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-3"><User size={32} className="text-white" /></div>}
          <h1 className="text-2xl font-bold text-gray-900">{theme.restaurant_name}</h1>
          <p className="text-gray-400 text-sm mt-1">Acesso do Atendente</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-900" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-900" />
          <button type="submit" className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors shadow-md">
            Entrar
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          {theme.logo_url
            ? <img src={theme.logo_url} alt="Logo" className="h-9 w-9 rounded-full object-cover ring-2 ring-orange-500" />
            : <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center"><ChefHat size={18} className="text-white" /></div>}
          <div>
            <h1 className="text-lg font-bold text-white">{theme.restaurant_name}</h1>
            <p className="text-xs text-gray-400">Atendente: {user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {step === 'menu' && (
            <button onClick={() => setStep('cart')}
              className="relative flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-sm">
              <ShoppingBag size={18} />
              Sacola
              {count() > 0 && <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{count()}</span>}
            </button>
          )}
          <button onClick={() => { clearAuth(); setStep('login') }}
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Menu */}
      {step === 'menu' && (
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-44 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto shadow-sm">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`w-full px-3 py-4 flex flex-col items-center gap-1 text-xs font-medium transition-all border-b border-gray-100 ${activeCategory === cat.id ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'}`}>
                <span className="text-xl">{cat.icon}</span>{cat.name}
              </button>
            ))}
          </aside>
          <main className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((product) => {
                const inCart = items.find((i) => i.product.id === product.id)
                return (
                  <div key={product.id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden cursor-pointer animate-slide-in"
                    onClick={() => { addItem(product); toast.success('Adicionado!') }}>
                    <div className="h-32 bg-gray-100 overflow-hidden">
                      {product.image_url
                        ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>}
                    </div>
                    <div className="p-2.5">
                      <p className="font-semibold text-sm text-gray-900 line-clamp-1">{product.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="font-bold text-sm text-orange-500">R$ {Number(product.price).toFixed(2)}</span>
                        {inCart
                          ? <span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">{inCart.quantity}x</span>
                          : <span className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center"><Plus size={12} className="text-white" /></span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </main>
        </div>
      )}

      {/* Cart */}
      {step === 'cart' && (
        <div className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full">
          <button onClick={() => setStep('menu')} className="flex items-center gap-2 mb-5 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={20} /> Voltar
          </button>
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <label className="text-sm font-medium text-gray-600">Nome do cliente (opcional)</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ex: João"
              className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-orange-400 text-gray-900" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sacola</h2>
          {items.length === 0
            ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
                <ShoppingBag size={48} />
                <p className="font-medium">Sacola vazia</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3">
                {items.map((item) => (
                  <div key={item.product.id} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-3 flex items-center gap-3 animate-slide-in">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{item.product.name}</p>
                      <p className="text-xs text-orange-500 font-medium">R$ {(Number(item.product.price) * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"><Minus size={12} /></button>
                      <span className="text-sm font-bold w-5 text-center text-gray-900">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-colors"><Plus size={12} className="text-white" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          {items.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="bg-white rounded-2xl shadow-sm p-4 flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span><span className="text-orange-500">R$ {total().toFixed(2)}</span>
              </div>
              <button onClick={() => setStep('order-type')}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-md">
                Continuar <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order type */}
      {step === 'order-type' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Como prefere o pedido?</h2>
            <p className="text-gray-500 mt-2 text-sm">Escolha uma opção</p>
          </div>
          <div className="flex gap-6 w-full max-w-sm">
            {(['dine_in', 'takeaway'] as const).map((type) => (
              <button key={type} onClick={() => { setOrderType(type); setStep('payment') }}
                className={`flex-1 py-8 rounded-2xl flex flex-col items-center gap-2 text-lg font-bold transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-1 border-2 ${orderType === type ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'}`}>
                <span className="text-3xl">{type === 'dine_in' ? '🍽️' : '🛍️'}</span>
                {type === 'dine_in' ? 'Local' : 'Viagem'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment */}
      {step === 'payment' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6 max-w-md mx-auto w-full">
          <button onClick={() => setStep('order-type')} className="self-start flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={20} /> Voltar
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Forma de pagamento</h2>
          <div className="w-full space-y-3">
            {[
              { id: 'credit_card', label: 'Cartão de Crédito', icon: <CreditCard size={22} /> },
              { id: 'debit_card', label: 'Cartão de Débito', icon: <Banknote size={22} /> },
              { id: 'pix', label: 'Pix', icon: <QrCode size={22} /> },
            ].map((m) => (
              <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                className={`w-full p-4 rounded-xl flex items-center gap-3 font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 border-2 ${paymentMethod === m.id ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'}`}>
                {m.icon}{m.label}
              </button>
            ))}
          </div>
          <div className="w-full bg-white rounded-2xl shadow-sm p-4 flex justify-between font-bold text-gray-900">
            <span>Total</span><span className="text-orange-500">R$ {total().toFixed(2)}</span>
          </div>
          <button onClick={handlePay} disabled={!paymentMethod || isProcessing}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold disabled:opacity-50 transition-colors shadow-md">
            {isProcessing ? 'Processando...' : 'Confirmar Pagamento'}
          </button>
        </div>
      )}

      {/* Success */}
      {step === 'success' && completedOrder && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-5 text-center">
          <div className="text-6xl animate-bounce">✅</div>
          <div className="bg-white rounded-3xl shadow-lg p-6 w-full max-w-sm animate-slide-in">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Pedido #{completedOrder.order_number} confirmado!</h2>
            <p className="text-gray-500 text-sm mb-4">QR code para o cliente acompanhar o pedido:</p>
            <div className="bg-gray-50 p-4 rounded-2xl inline-block">
              <QRCodeSVG value={`${process.env.NEXT_PUBLIC_API_URL?.replace('8000', '3000') || 'http://localhost:3000'}/track/${completedOrder.tracking_token}`} size={180} />
            </div>
            <p className="text-xs text-gray-400 mt-3">Entregue o QR code ao cliente ou imprima com a nota fiscal</p>
          </div>
          <button onClick={() => { setStep('menu'); setCompletedOrder(null) }}
            className="px-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors shadow-md">
            Novo atendimento
          </button>
        </div>
      )}
    </div>
  )
}
