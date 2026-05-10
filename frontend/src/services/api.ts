import axios from 'axios'
import type { Category, Product, Order, OrderStatus, Theme, User, Stock } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then((r) => r.data)

// Categories
export const getCategories = (activeOnly = false) =>
  api.get<Category[]>('/categories', { params: { active_only: activeOnly } }).then((r) => r.data)

export const createCategory = (data: Partial<Category>) =>
  api.post<Category>('/categories', data).then((r) => r.data)

export const updateCategory = (id: number, data: Partial<Category>) =>
  api.put<Category>(`/categories/${id}`, data).then((r) => r.data)

export const deleteCategory = (id: number) =>
  api.delete(`/categories/${id}`)

// Products
export const getProducts = (params?: { category_id?: number; available_only?: boolean }) =>
  api.get<Product[]>('/products', { params }).then((r) => r.data)

export const createProduct = (data: Partial<Product>) =>
  api.post<Product>('/products', data).then((r) => r.data)

export const updateProduct = (id: number, data: Partial<Product>) =>
  api.put<Product>(`/products/${id}`, data).then((r) => r.data)

export const deleteProduct = (id: number) =>
  api.delete(`/products/${id}`)

// Orders
export const createOrder = (data: {
  source: string
  order_type: string
  items: { product_id: number; quantity: number; notes?: string }[]
  attendant_id?: number
  customer_name?: string
  notes?: string
}) => api.post<Order>('/orders', data).then((r) => r.data)

export const trackOrder = (token: string) =>
  api.get<Order>(`/orders/track/${token}`).then((r) => r.data)

export const listOrders = (params?: { status?: OrderStatus; limit?: number }) =>
  api.get<Order[]>('/orders', { params }).then((r) => r.data)

export const updateOrderStatus = (orderId: number, status: OrderStatus) =>
  api.patch(`/orders/${orderId}/status`, { status }).then((r) => r.data)

// Kitchen
export const getKitchenQueue = () =>
  api.get<Order[]>('/kitchen/queue').then((r) => r.data)

export const startPreparing = (orderId: number) =>
  api.patch(`/kitchen/${orderId}/prepare`).then((r) => r.data)

export const markReady = (orderId: number) =>
  api.patch(`/kitchen/${orderId}/ready`).then((r) => r.data)

// Display
export const getDisplayOrders = () =>
  api.get<{ preparing: Order[]; ready: Order[] }>('/display/orders').then((r) => r.data)

// Payments
export const initiatePayment = (orderId: number, method: string) =>
  api.post('/payments/initiate', { order_id: orderId, method }).then((r) => r.data)

export const confirmPayment = (orderId: number) =>
  api.post(`/payments/${orderId}/confirm`).then((r) => r.data)

// Themes
export const getThemes = () =>
  api.get<Theme[]>('/themes').then((r) => r.data)

export const getTheme = (screen: string) =>
  api.get<Theme>(`/themes/${screen}`).then((r) => r.data)

export const updateTheme = (screen: string, data: Partial<Theme>) =>
  api.put<Theme>(`/themes/${screen}`, data).then((r) => r.data)

// Stock
export const getStock = () =>
  api.get<Stock[]>('/stock').then((r) => r.data)

export const getLowStock = () =>
  api.get<Stock[]>('/stock/low').then((r) => r.data)

export const updateStock = (productId: number, quantity: number, min_quantity?: number) =>
  api.put(`/stock/${productId}`, { quantity, min_quantity }).then((r) => r.data)

// Reports
export const getDailySummary = (date?: string) =>
  api.get('/reports/daily', { params: { target_date: date } }).then((r) => r.data)

export const getTopProducts = (days = 30, limit = 10) =>
  api.get('/reports/top-products', { params: { days, limit } }).then((r) => r.data)

export const getPeakHours = (days = 30) =>
  api.get('/reports/peak-hours', { params: { days } }).then((r) => r.data)

export const getRevenue = (days = 30) =>
  api.get('/reports/revenue', { params: { days } }).then((r) => r.data)

// Users
export const getUsers = () =>
  api.get<User[]>('/users').then((r) => r.data)

export const createUser = (data: { name: string; email: string; password: string; role: string }) =>
  api.post<User>('/users', data).then((r) => r.data)

export const updateUser = (id: number, data: Partial<User & { password: string }>) =>
  api.put<User>(`/users/${id}`, data).then((r) => r.data)

export const deleteUser = (id: number) =>
  api.delete(`/users/${id}`)

// NFC-e
export const emitirNFCe = (orderId: number) =>
  api.post(`/nfe/emitir/${orderId}`).then((r) => r.data)

// Upload
export const uploadFile = (folder: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/uploads/${folder}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data as { url: string })
}
