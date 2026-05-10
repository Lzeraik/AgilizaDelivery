export type UserRole = 'admin' | 'attendant' | 'kitchen'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Category {
  id: number
  name: string
  description?: string
  icon: string
  display_order: number
  is_active: boolean
}

export interface Product {
  id: number
  category_id: number
  name: string
  description?: string
  price: number
  image_url?: string
  is_available: boolean
  preparation_time: number
  display_order: number
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
export type OrderSource = 'totem' | 'attendant'
export type OrderType = 'dine_in' | 'takeaway'
export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix'

export interface OrderItem {
  id: number
  product_id: number
  product_name?: string
  product_image?: string
  quantity: number
  unit_price: number
  notes?: string
}

export interface Order {
  id: number
  order_number: string
  source: OrderSource
  customer_name?: string
  status: OrderStatus
  order_type: OrderType
  total_amount: number
  tracking_token: string
  qr_code_url?: string
  notes?: string
  items: OrderItem[]
  created_at: string
  updated_at?: string
}

export interface CartItem {
  product: Product
  quantity: number
  notes?: string
}

export interface Theme {
  id: number
  screen: 'totem' | 'kitchen' | 'display' | 'attendant'
  primary_color: string
  secondary_color: string
  bg_color: string
  text_color: string
  accent_color: string
  font_family: string
  logo_url?: string
  banners: string[]
  restaurant_name: string
}

export interface Payment {
  id: number
  order_id: number
  method: PaymentMethod
  amount: number
  status: 'pending' | 'approved' | 'failed'
  transaction_id?: string
  created_at: string
}

export interface Stock {
  id?: number
  product_id: number
  product_name?: string
  quantity: number
  min_quantity: number
  is_low?: boolean
  updated_at?: string
}

export interface DailySummary {
  date: string
  total_orders: number
  total_revenue: number
  pending: number
  preparing: number
  ready: number
  delivered: number
}

export interface TopProduct {
  product_id: number
  product_name: string
  total_sold: number
  total_revenue: number
}

export interface PeakHour {
  hour: number
  order_count: number
}
