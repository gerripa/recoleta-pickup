import { useState } from 'react'
import { CheckCircle2, ExternalLink, Instagram, MessageCircle, X, Info } from 'lucide-react'
import { useStore, CATALOG, money, subtotalOf, type Channel, type Order } from '../store'
import { navigate, reserveLink } from '../router'
import { Button, Card, CopyField, cx, toast } from '../components/ui'
import { PageTitle } from './AdminLayout'

const input = 'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100'

export default function ManualOrder() {
  const { orders, createManualOrder, byId } = useStore()
  const [channel, setChannel] = useState<Exclude<Channel, 'Tiendanube'>>('WhatsApp')
  const suggest = (c: Channel) => {
    const prefix = c === 'WhatsApp' ? 'WA' : 'IG'
    const nums = orders.filter((o) => o.number.startsWith(prefix)).map((o) => Number(o.number.split('-')[1]) || 0)
    return `${prefix}-${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`
  }
  const [customer, setCustomer] = useState('')
  const [number, setNumber] = useState(() => suggest('WhatsApp'))
  const [products, setProducts] = useState<string[]>([])
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState<string | null>(null)
  const created: Order | undefined = createdId ? byId(createdId) : undefined

  const toggle = (p: string) => setProducts((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]))

  const submit = () => {
    if (!customer.trim()) return setError('Completá el nombre del cliente.')
    if (!number.trim()) return setError('Completá el número de pedido.')
    if (orders.some((o) => o.number.toUpperCase() === number.trim().toUpperCase())) return setError('Ya existe un pedido con ese número.')
    if (products.length === 0) return setError('Elegí al menos un producto.')
    const o = createManualOrder({ customer: customer.trim(), number: number.trim().toUpperCase(), channel, products })
    setCreatedId(o.id)
    toast(`Pedido ${o.number} registrado`)
  }

  const resetForm = () => {
    setCreatedId(null)
    setCustomer('')
    setProducts([])
    setError('')
    setNumber(suggest(channel))
  }

  if (created) {
    const msg = `¡Hola ${created.customer.split(' ')[0]}! Para terminar tu compra, confirmá acá tu retiro en el local con tu email. Ahí ves tus beneficios y el total final: ${reserveLink(created.id)}`
    return (
      <div className="mx-auto max-w-xl">
        <Card className="p-6 sm:p-8">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-700"><CheckCircle2 className="h-6 w-6" /></span>
          <h1 className="mt-4 text-2xl font-bold">Pedido {created.number} registrado</h1>
          <p className="mt-1 text-ink-500">{created.customer} · {created.channel} · {money(subtotalOf(created.products))}</p>
          <div className="mt-6">
            <div className="text-sm font-semibold">Mensaje para enviarle al cliente</div>
            <p className="mt-0.5 text-sm text-ink-500">El cliente pone su email y ve sus beneficios antes de pagar. Después confirmás el pago en Pedidos.</p>
            <div className="mt-3 rounded-2xl rounded-tl-sm bg-[#DCF8C6] p-4 text-sm text-ink-900">{msg}</div>
            <div className="mt-3"><CopyField value={msg} /></div>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-ink-50 p-3 text-xs text-ink-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Enlace de demostración: funciona en este navegador porque los datos se guardan acá.</div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={() => navigate(`/reservar/${created.id}`)}><ExternalLink className="h-4 w-4" /> Abrir como cliente</Button>
              <Button variant="secondary" className="flex-1" onClick={resetForm}>Cargar otro pedido</Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <>
      <PageTitle title="Nuevo pedido manual" subtitle="Para compras cerradas por WhatsApp o Instagram. El cliente completa su email desde el enlace." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="text-sm font-semibold text-ink-700">Canal de venta</div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {(['WhatsApp', 'Instagram'] as const).map((c) => {
                  const Icon = c === 'WhatsApp' ? MessageCircle : Instagram
                  return (
                    <button key={c} onClick={() => { setChannel(c); setNumber(suggest(c)) }} className={cx('flex items-center gap-3 rounded-xl border-2 p-3.5 text-left text-sm font-semibold', channel === c ? 'border-brand-800 bg-brand-50 text-brand-900' : 'border-ink-200 text-ink-600 hover:border-ink-300')}>
                      <span className={cx('grid h-9 w-9 place-items-center rounded-lg', c === 'WhatsApp' ? 'bg-emerald-100 text-emerald-700' : 'bg-fuchsia-100 text-fuchsia-700')}><Icon className="h-[18px] w-[18px]" /></span>{c}
                    </button>
                  )
                })}
              </div>
            </div>
            <label className="block"><span className="text-sm font-semibold text-ink-700">Nombre del cliente</span><input className={cx(input, 'mt-2')} value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Ej.: Ana Martínez" /></label>
            <label className="block"><span className="text-sm font-semibold text-ink-700">Número de pedido</span><input className={cx(input, 'mt-2 font-mono')} value={number} onChange={(e) => setNumber(e.target.value)} /></label>
            <div className="sm:col-span-2">
              <div className="text-sm font-semibold text-ink-700">Productos comprados</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {CATALOG.map((p) => (
                  <button key={p.name} onClick={() => toggle(p.name)} className={cx('rounded-full border px-3 py-1.5 text-xs font-medium', products.includes(p.name) ? 'border-brand-800 bg-brand-800 text-white' : 'border-ink-200 text-ink-600 hover:border-brand-600')}>
                    {p.name} · {money(p.price)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && <p className="mt-5 text-sm font-medium text-red-700">{error}</p>}
          <div className="mt-6 flex justify-end"><Button className="w-full py-3 sm:w-auto sm:px-8" onClick={submit}>Registrar y generar enlace</Button></div>
        </Card>

        <Card className="h-fit p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">Resumen</div>
          <div className="mt-3 text-lg font-bold">{number || '—'}</div>
          <div className="text-sm text-ink-500">{customer || 'Cliente sin nombre'} · {channel}</div>
          <ul className="mt-4 space-y-1.5 border-t border-ink-100 pt-4 text-sm">
            {products.length === 0 && <li className="text-ink-400">Sin productos todavía</li>}
            {products.map((p) => <li key={p} className="flex items-center justify-between gap-2"><span>{p}</span><button aria-label={`Quitar ${p}`} onClick={() => toggle(p)} className="text-ink-400 hover:text-ink-900"><X className="h-3.5 w-3.5" /></button></li>)}
          </ul>
          {products.length > 0 && <div className="mt-4 flex justify-between border-t border-ink-100 pt-4 text-sm font-bold"><span>Subtotal</span><span>{money(subtotalOf(products))}</span></div>}
          <p className="mt-3 text-xs text-ink-400">Los beneficios se calculan cuando el cliente confirma con su email.</p>
        </Card>
      </div>
    </>
  )
}
