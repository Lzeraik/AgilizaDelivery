'use client'
import { useEffect, useState, useCallback } from 'react'
import { getCategories, getProducts, getTheme, createOrder, initiatePayment, confirmPayment } from '@/services/api'
import type { Category, Product, Theme, Order } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { ShoppingBag, ChevronRight, Plus, Minus, ArrowLeft, CreditCard, Banknote, QrCode, ChefHat } from 'lucide-react'
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
  const { items, addItem, updateQuantity, clearCart, total, count, orderType, setOrderType } = useCartStore()

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

  const handlePay = async () => {
    if (!paymentMethod) return toast.error('Selecione um método de pagamento')
    setIsProcessing(true)
    try {
      const order = await createOrder({
        source: 'totem' as const,
        order_type: orderType,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity, notes: i.notes })),
      })
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

  if (!theme) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-gray-900 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          {theme.logo_url
            ? <img src={theme.logo_url} alt="Logo" className="h-10 w-10 rounded-full object-cover ring-2 ring-orange-500" />
            : <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center"><ChefHat size={20} className="text-white" /></div>}
          <div>
            <h1 className="text-xl font-bold text-white">{theme.restaurant_name}</h1>
            <p className="text-xs text-gray-400">Faça seu pedido</p>
          </div>
        </div>
        {step === 'menu' && (
          <button onClick={() => setStep('cart')}
            className="relative flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-md">
            <ShoppingBag size={18} />
            Sacola
            {count() > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{count()}</span>
            )}
          </button>
        )}
      </header>

      {/* Menu */}
      {step === 'menu' && (
        <div className="flex flex-1 overflow-hidden">
          {/* Category sidebar */}
          <aside className="w-48 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto shadow-sm">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`w-full px-4 py-5 flex flex-col items-center gap-1 text-sm font-medium transition-all border-b border-gray-100 ${activeCategory === cat.id ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'}`}>
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
                  <div key={product.id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden cursor-pointer animate-slide-in"
                    onClick={() => setSelectedProduct(product)}>
                    <div className="h-40 bg-gray-100 overflow-hidden">
                      {product.image_url
                        ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>}
                    </div>
                    <div className="p-3 flex flex-col gap-1">
                      <h3 className="font-semibold text-sm text-gray-900 leading-tight">{product.name}</h3>
                      {product.description && <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-bold text-base text-orange-500">R$ {Number(product.price).toFixed(2)}</span>
                        {inCart
                          ? <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-600">{inCart.quantity}x</span>
                          : <span className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center"><Plus size={14} className="text-white" /></span>}
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
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-in" onClick={(e) => e.stopPropagation()}>
            {selectedProduct.image_url && <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-56 object-cover" />}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedProduct.name}</h2>
              {selectedProduct.description && <p className="text-gray-500 mb-4 text-sm">{selectedProduct.description}</p>}
              <p className="text-2xl font-bold text-orange-500 mb-6">R$ {Number(selectedProduct.price).toFixed(2)}</p>
              <div className="flex gap-3">
                <button onClick={() => setSelectedProduct(null)}
                  className="flex-1 border-2 border-orange-500 text-orange-500 py-3 rounded-2xl font-semibold hover:bg-orange-50 transition-colors">
                  Voltar
                </button>
                <button onClick={() => { addItem(selectedProduct); setSelectedProduct(null); toast.success('Adicionado à sacola!') }}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-semibold transition-colors">
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
          <button onClick={() => setStep('menu')} className="flex items-center gap-2 mb-5 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={20} /> Voltar ao cardápio
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sua Sacola</h2>
          {items.length === 0
            ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
                <ShoppingBag size={64} />
                <p className="font-medium">Sacola vazia</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3">
                {items.map((item) => (
                  <div key={item.product.id} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-4 flex items-center gap-4 animate-slide-in">
                    {item.product.image_url
                      ? <img src={item.product.image_url} className="w-16 h-16 rounded-xl object-cover" alt={item.product.name} />
                      : <div className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center text-2xl">🍽️</div>}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-orange-500 font-medium">R$ {(Number(item.product.price) * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"><Minus size={14} /></button>
                      <span className="w-6 text-center font-bold text-gray-900">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-colors"><Plus size={14} className="text-white" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          {items.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="bg-white rounded-2xl shadow-sm p-4 flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span className="text-orange-500">R$ {total().toFixed(2)}</span>
              </div>
              <button onClick={() => setStep('order-type')}
                className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-md">
                Continuar <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order type */}
      {step === 'order-type' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Como prefere o seu pedido?</h2>
            <p className="text-gray-500 mt-2">Escolha uma opção abaixo</p>
          </div>
          <div className="flex gap-6 w-full max-w-md">
            {(['dine_in', 'takeaway'] as const).map((type) => (
              <button key={type} onClick={() => { setOrderType(type); setStep('payment') }}
                className={`flex-1 py-10 rounded-3xl flex flex-col items-center gap-3 text-xl font-bold transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-1 border-2 ${orderType === type ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'}`}>
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
          <button onClick={() => setStep('order-type')} className="self-start flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={20} /> Voltar
          </button>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Como vai pagar?</h2>
            <p className="text-gray-500 mt-2">Selecione a forma de pagamento</p>
          </div>
          <div className="w-full space-y-3">
            {[
              { id: 'credit_card', label: 'Cartão de Crédito', icon: <CreditCard size={24} /> },
              { id: 'debit_card', label: 'Cartão de Débito', icon: <Banknote size={24} /> },
              { id: 'pix', label: 'Pix', icon: <QrCode size={24} /> },
            ].map((method) => (
              <button key={method.id} onClick={() => setPaymentMethod(method.id)}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 text-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 border-2 ${paymentMethod === method.id ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'}`}>
                {method.icon}{method.label}
              </button>
            ))}
          </div>
          <div className="w-full bg-white rounded-2xl shadow-sm p-4 flex justify-between text-lg font-bold text-gray-900">
            <span>Total</span>
            <span className="text-orange-500">R$ {total().toFixed(2)}</span>
          </div>
          <button onClick={handlePay} disabled={!paymentMethod || isProcessing}
            className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg disabled:opacity-50 transition-colors shadow-md">
            {isProcessing ? 'Processando...' : 'Confirmar Pagamento'}
          </button>
        </div>
      )}

      {/* Success */}
      {step === 'success' && completedOrder && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6 text-center">
          <div className="text-7xl animate-bounce">🎉</div>
          <div className="bg-white rounded-3xl shadow-lg p-6 w-full max-w-sm animate-slide-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Pedido Confirmado!</h2>
            <p className="text-gray-500 mb-3">Seu número é</p>
            <p className="text-6xl font-black text-orange-500 mb-4">#{completedOrder.order_number}</p>
            <p className="text-sm text-gray-500 mb-4">Escaneie o QR code para acompanhar</p>
            {completedOrder.tracking_token && (
              <div className="bg-gray-50 p-4 rounded-2xl inline-block">
                <QRCodeSVG value={`${process.env.NEXT_PUBLIC_API_URL?.replace('8000', '3000') || 'http://localhost:3000'}/track/${completedOrder.tracking_token}`} size={180} />
              </div>
            )}
          </div>
          <button onClick={() => { setStep('menu'); setCompletedOrder(null) }}
            className="px-8 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg transition-colors shadow-md">
            Fazer novo pedido
          </button>
        </div>
      )}
    </div>
  )
}
