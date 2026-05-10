'use client'
import { useEffect, useState, useCallback } from 'react'
import { getCategories, getProducts, getTheme, createOrder, initiatePayment, confirmPayment } from '@/services/api'
import type { Category, Product, Theme, Order } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { ShoppingBag, ChevronRight, Plus, Minus, X, CreditCard, Banknote, QrCode, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'

type Step = 'menu' | 'cart' | 'order-type' | 'payment' | 'success'

export default function TotemPage() {
  const [theme, setTheme] = useState<Theme | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [step, setStep] = useState<Step>('menu')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { items, addItem, removeItem, updateQuantity, clearCart, total, count, orderType, setOrderType } = useCartStore()

  useEffect(() => {
    getTheme('totem').then(setTheme)
    getCategories(true).then((cats) => {
      setCategories(cats)
      if (cats.length) setActiveCategory(cats[0].id)
    })
  }, [])

  useEffect(() => {
    if (activeCategory) getProducts({ category_id: activeCategory, available_only: true }).then(setProducts)
  }, [activeCategory])

  const themeStyle = theme
    ? ({
        '--primary': theme.primary_color,
        '--secondary': theme.secondary_color,
        '--bg': theme.bg_color,
        '--text': theme.text_color,
        '--accent': theme.accent_color,
        fontFamily: theme.font_family,
        backgroundColor: theme.bg_color,
        color: theme.text_color,
      } as React.CSSProperties)
    : {}

  const handlePay = async () => {
    if (!paymentMethod) return toast.error('Selecione um método de pagamento')
    setIsProcessing(true)
    try {
      const orderPayload = {
        source: 'totem' as const,
        order_type: orderType,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity, notes: i.notes })),
      }
      const order = await createOrder(orderPayload)
      await initiatePayment(order.id, paymentMethod)
      await confirmPayment(order.id)
      setCompletedOrder(order)
      setStep('success')
      clearCart()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Erro ao processar pagamento'
      toast.error(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!theme) return <div className="min-h-screen flex items-center justify-center bg-gray-100"><div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" /></div>

  return (
    <div className="min-h-screen flex flex-col" style={themeStyle}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between shadow-md" style={{ backgroundColor: theme.primary_color }}>
        <div className="flex items-center gap-3">
          {theme.logo_url && <img src={theme.logo_url} alt="Logo" className="h-10 w-10 rounded-full object-cover" />}
          <h1 className="text-2xl font-bold text-white">{theme.restaurant_name}</h1>
        </div>
        {step === 'menu' && (
          <button onClick={() => setStep('cart')} className="relative flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition-all">
            <ShoppingBag size={20} />
            <span className="font-semibold">Sacola</span>
            {count() > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{count()}</span>
            )}
          </button>
        )}
      </header>

      {/* Menu */}
      {step === 'menu' && (
        <div className="flex flex-1 overflow-hidden">
          {/* Category sidebar */}
          <aside className="w-48 flex-shrink-0 border-r overflow-y-auto" style={{ borderColor: theme.primary_color + '33' }}>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`w-full px-4 py-5 flex flex-col items-center gap-1 text-sm font-medium transition-all border-b ${activeCategory === cat.id ? 'text-white' : 'hover:bg-gray-50'}`}
                style={activeCategory === cat.id ? { backgroundColor: theme.primary_color, color: 'white', borderColor: theme.primary_color } : { borderColor: '#e5e7eb' }}>
                <span className="text-2xl">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </aside>

          {/* Products grid */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => {
                const inCart = items.find((i) => i.product.id === product.id)
                return (
                  <div key={product.id} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1"
                    onClick={() => setSelectedProduct(product)}>
                    <div className="h-40 bg-gray-100 overflow-hidden">
                      {product.image_url
                        ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>}
                    </div>
                    <div className="p-3 flex flex-col gap-1 flex-1">
                      <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
                      {product.description && <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="font-bold text-base" style={{ color: theme.primary_color }}>R$ {Number(product.price).toFixed(2)}</span>
                        {inCart ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full text-white" style={{ backgroundColor: theme.accent_color }}>{inCart.quantity}x</span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full text-white" style={{ backgroundColor: theme.primary_color }}>
                            <Plus size={14} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </main>
        </div>
      )}

      {/* Product modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {selectedProduct.image_url && <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-56 object-cover" />}
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">{selectedProduct.name}</h2>
              {selectedProduct.description && <p className="text-gray-600 mb-4">{selectedProduct.description}</p>}
              <p className="text-2xl font-bold mb-6" style={{ color: theme.primary_color }}>R$ {Number(selectedProduct.price).toFixed(2)}</p>
              <div className="flex gap-3">
                <button onClick={() => setSelectedProduct(null)} className="flex-1 border-2 py-3 rounded-2xl font-semibold" style={{ borderColor: theme.primary_color, color: theme.primary_color }}>Voltar</button>
                <button onClick={() => { addItem(selectedProduct); setSelectedProduct(null); toast.success('Adicionado à sacola!') }}
                  className="flex-1 py-3 rounded-2xl font-semibold text-white" style={{ backgroundColor: theme.primary_color }}>
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart */}
      {step === 'cart' && (
        <div className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full">
          <button onClick={() => setStep('menu')} className="flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} /> Voltar ao cardápio
          </button>
          <h2 className="text-2xl font-bold mb-4">Sua Sacola</h2>
          {items.length === 0
            ? <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4"><ShoppingBag size={64} /><p>Sacola vazia</p></div>
            : (
              <div className="flex-1 overflow-y-auto space-y-3">
                {items.map((item) => (
                  <div key={item.product.id} className="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
                    {item.product.image_url
                      ? <img src={item.product.image_url} className="w-16 h-16 rounded-xl object-cover" alt={item.product.name} />
                      : <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">🍽️</div>}
                    <div className="flex-1">
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-sm text-gray-500">R$ {(Number(item.product.price) * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><Minus size={14} /></button>
                      <span className="w-6 text-center font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: theme.primary_color }}><Plus size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          {items.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-xl font-bold border-t pt-4">
                <span>Total</span>
                <span style={{ color: theme.primary_color }}>R$ {total().toFixed(2)}</span>
              </div>
              <button onClick={() => setStep('order-type')} className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2" style={{ backgroundColor: theme.primary_color }}>
                Continuar <ChevronRight />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order type */}
      {step === 'order-type' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
          <h2 className="text-3xl font-bold text-center">Como prefere o seu pedido?</h2>
          <div className="flex gap-6 w-full max-w-md">
            {(['dine_in', 'takeaway'] as const).map((type) => (
              <button key={type} onClick={() => { setOrderType(type); setStep('payment') }}
                className={`flex-1 py-10 rounded-3xl flex flex-col items-center gap-3 text-xl font-bold transition-all border-4 ${orderType === type ? 'text-white border-transparent' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                style={orderType === type ? { backgroundColor: theme.primary_color } : {}}>
                <span className="text-5xl">{type === 'dine_in' ? '🍽️' : '🛍️'}</span>
                {type === 'dine_in' ? 'Comer aqui' : 'Para levar'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment */}
      {step === 'payment' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6 max-w-md mx-auto w-full">
          <button onClick={() => setStep('order-type')} className="self-start flex items-center gap-2 text-gray-600"><ArrowLeft size={20} /> Voltar</button>
          <h2 className="text-3xl font-bold text-center">Como vai pagar?</h2>
          <div className="w-full space-y-3">
            {[
              { id: 'credit_card', label: 'Cartão de Crédito', icon: <CreditCard size={24} /> },
              { id: 'debit_card', label: 'Cartão de Débito', icon: <Banknote size={24} /> },
              { id: 'pix', label: 'Pix', icon: <QrCode size={24} /> },
            ].map((method) => (
              <button key={method.id} onClick={() => setPaymentMethod(method.id)}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 text-lg font-semibold transition-all border-2 ${paymentMethod === method.id ? 'text-white border-transparent' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                style={paymentMethod === method.id ? { backgroundColor: theme.primary_color, borderColor: theme.primary_color } : {}}>
                {method.icon}{method.label}
              </button>
            ))}
          </div>
          <div className="w-full flex justify-between text-xl font-bold border-t pt-4">
            <span>Total</span>
            <span style={{ color: theme.primary_color }}>R$ {total().toFixed(2)}</span>
          </div>
          <button onClick={handlePay} disabled={!paymentMethod || isProcessing}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg disabled:opacity-50"
            style={{ backgroundColor: theme.primary_color }}>
            {isProcessing ? 'Processando...' : 'Confirmar Pagamento'}
          </button>
        </div>
      )}

      {/* Success */}
      {step === 'success' && completedOrder && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6 text-center">
          <div className="text-7xl animate-bounce">🎉</div>
          <h2 className="text-3xl font-bold">Pedido Confirmado!</h2>
          <p className="text-xl text-gray-600">Seu número é <strong className="text-4xl" style={{ color: theme.primary_color }}>#{completedOrder.order_number}</strong></p>
          <p className="text-gray-500">Escaneie o QR code para acompanhar seu pedido</p>
          {completedOrder.tracking_token && (
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <QRCodeSVG value={`${process.env.NEXT_PUBLIC_API_URL?.replace('8000', '3000') || 'http://localhost:3000'}/track/${completedOrder.tracking_token}`} size={200} />
            </div>
          )}
          <button onClick={() => { setStep('menu'); setCompletedOrder(null) }}
            className="mt-4 px-8 py-4 rounded-2xl text-white font-bold text-lg"
            style={{ backgroundColor: theme.primary_color }}>
            Fazer novo pedido
          </button>
        </div>
      )}
    </div>
  )
}
