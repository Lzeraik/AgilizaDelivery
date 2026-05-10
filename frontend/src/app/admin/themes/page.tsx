'use client'
import { useEffect, useState } from 'react'
import { getThemes, updateTheme, uploadFile } from '@/services/api'
import type { Theme } from '@/types'
import { Save, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

const SCREEN_LABELS: Record<string, string> = {
  totem: '🖥️ Totem',
  kitchen: '👨‍🍳 Cozinha',
  display: '📺 Display',
  attendant: '👤 Atendente',
}

const GOOGLE_FONTS = ['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Open Sans', 'Lato', 'Nunito', 'Raleway']

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [selected, setSelected] = useState<Theme | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getThemes().then((t) => { setThemes(t); if (t.length) setSelected({ ...t[0] }) })
  }, [])

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await updateTheme(selected.screen, {
        primary_color: selected.primary_color,
        secondary_color: selected.secondary_color,
        bg_color: selected.bg_color,
        text_color: selected.text_color,
        accent_color: selected.accent_color,
        font_family: selected.font_family,
        logo_url: selected.logo_url,
        banners: selected.banners,
        restaurant_name: selected.restaurant_name,
      })
      setThemes((ts) => ts.map((t) => (t.screen === updated.screen ? updated : t)))
      toast.success('Tema salvo!')
    } catch { toast.error('Erro ao salvar tema') }
    finally { setSaving(false) }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selected) return
    const { url } = await uploadFile('logos', file)
    setSelected({ ...selected, logo_url: url })
    toast.success('Logo enviada!')
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selected) return
    const { url } = await uploadFile('banners', file)
    setSelected({ ...selected, banners: [...(selected.banners || []), url] })
    toast.success('Banner adicionado!')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Personalização de Temas</h1>

      <div className="flex gap-2 flex-wrap">
        {themes.map((t) => (
          <button key={t.screen} onClick={() => setSelected({ ...t })}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${selected?.screen === t.screen ? 'bg-orange-500 text-white' : 'bg-white border hover:border-orange-400 text-gray-700'}`}>
            {SCREEN_LABELS[t.screen]}
          </button>
        ))}
      </div>

      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Nome do Restaurante</label>
              <input value={selected.restaurant_name} onChange={(e) => setSelected({ ...selected, restaurant_name: e.target.value })} className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'primary_color', label: 'Cor Primária' },
                { key: 'secondary_color', label: 'Cor Secundária' },
                { key: 'bg_color', label: 'Cor de Fundo' },
                { key: 'text_color', label: 'Cor do Texto' },
                { key: 'accent_color', label: 'Cor de Destaque' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={(selected as unknown as Record<string, string>)[key]}
                      onChange={(e) => setSelected({ ...selected, [key]: e.target.value })}
                      className="w-10 h-10 rounded-lg border cursor-pointer" />
                    <input value={(selected as unknown as Record<string, string>)[key]}
                      onChange={(e) => setSelected({ ...selected, [key]: e.target.value })}
                      className="flex-1 border rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Fonte</label>
              <select value={selected.font_family} onChange={(e) => setSelected({ ...selected, font_family: e.target.value })} className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400">
                {GOOGLE_FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Logo</label>
              <div className="flex items-center gap-3">
                {selected.logo_url && <img src={selected.logo_url} alt="Logo" className="h-12 w-12 rounded-lg object-cover border" />}
                <label className="flex items-center gap-2 text-sm text-orange-500 font-medium cursor-pointer hover:text-orange-600">
                  <Upload size={16} /> Upload logo
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Banners</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(selected.banners || []).map((b, i) => (
                  <div key={i} className="relative group">
                    <img src={b} alt={`Banner ${i + 1}`} className="h-16 w-24 object-cover rounded-lg border" />
                    <button onClick={() => setSelected({ ...selected, banners: selected.banners.filter((_, idx) => idx !== i) })}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 text-white rounded-lg flex items-center justify-center text-xs transition-opacity">Remover</button>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-orange-500 font-medium cursor-pointer hover:text-orange-600">
                <Upload size={16} /> Adicionar banner
                <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
              </label>
            </div>

            <button onClick={handleSave} disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
              <Save size={18} />{saving ? 'Salvando...' : 'Salvar Tema'}
            </button>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Pré-visualização</h3>
            <div className="rounded-xl overflow-hidden border" style={{ fontFamily: selected.font_family, backgroundColor: selected.bg_color, color: selected.text_color }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: selected.primary_color }}>
                {selected.logo_url && <img src={selected.logo_url} alt="Logo" className="h-7 w-7 rounded-full object-cover" />}
                <span className="text-white font-bold">{selected.restaurant_name}</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="h-4 rounded-full w-2/3" style={{ backgroundColor: selected.text_color + '22' }} />
                <div className="h-4 rounded-full w-1/2" style={{ backgroundColor: selected.text_color + '22' }} />
                <div className="flex gap-2 mt-4">
                  <div className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: selected.primary_color }}>Primário</div>
                  <div className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: selected.accent_color }}>Destaque</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
